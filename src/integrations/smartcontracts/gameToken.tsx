// Enhanced GameToken contract integration utilities with multi-currency support
import { TransactionBlock } from '@mysten/sui.js/transactions';

export class GameTokenManager {
    constructor(suiClient, network = 'testnet') {
        this.suiClient = suiClient;
        this.network = network;

        // YOUR NEW DEPLOYED CONTRACT ADDRESSES
        this.PACKAGE_ID = '0x635b49907d2463300968b1bc13388ccd9c5a0302b1ef7be065d3eba8b6616da0';
        this.GAME_TOKEN_STORE_ID = '0xb7ba6d465a0536cf71ade84eb0a54d444e0c7e1486cc0c18de567834581fa14e';
        this.TOKEN_POLICY_ID = '0x1342d88b9688b0deafc977fadaf683aadedab2b4e337c3a57ec99c42004e0f9c';
        this.ADMIN_CAP_ID = '0x6f98813f138929a405eb03044a37dfafcaec19baad38ca8a35de9b18b1798a3b';

        // Coin types - USDC detection will be handled dynamically
        this.GAME_TOKEN_TYPE = `${this.PACKAGE_ID}::game_token::GAME_TOKEN`;
        this.SUI_TYPE = '0x2::sui::SUI';
        // USDC type will be detected dynamically - common testnet types:
        this.USDC_TYPE = '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'; // Default Wormhole USDC
        // USDT not used for now
        this.USDT_TYPE = `${this.PACKAGE_ID}::game_token::USDT`;

        // Token decimals
        this.GT_DECIMALS = 6;
        this.USDC_DECIMALS = 6;
        this.USDT_DECIMALS = 6;
        this.SUI_DECIMALS = 9;
    }

    // ========================= BUY FUNCTIONS =========================

    /**
     * Purchase Game Tokens with SUI (Updated rate: 2500 GT per SUI)
     */
    async buyGameTokensWithSui(walletKeyPair, suiAmount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(100000000); // 0.1 SUI

            const suiCoins = await this.suiClient.getCoins({
                owner: userAddress,
                coinType: this.SUI_TYPE,
            });

            if (suiCoins.data.length === 0) {
                throw new Error('No SUI coins found in wallet');
            }

            const requiredAmountMist = Math.floor(suiAmount * Math.pow(10, this.SUI_DECIMALS));
            const totalBalance = suiCoins.data.reduce((sum, coin) => sum + Number(coin.balance), 0);

            if (totalBalance < requiredAmountMist + 50_000_000) {
                throw new Error(`Insufficient SUI balance. Have: ${totalBalance / Math.pow(10, this.SUI_DECIMALS)} SUI, Need: ${(requiredAmountMist + 50_000_000) / Math.pow(10, this.SUI_DECIMALS)} SUI`);
            }

            const [paymentCoin] = txb.splitCoins(txb.gas, [requiredAmountMist]);

            const gtCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::buy_gt_with_sui`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    paymentCoin,
                ],
            });

            txb.transferObjects([gtCoin], userAddress);

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                    showObjectChanges: true,
                },
            });

            if (result.effects?.status?.status !== 'success') {
                throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
            }

            return {
                success: true,
                digest: result.digest,
                events: result.events || [],
                objectChanges: result.objectChanges || [],
            };
        } catch (error) {
            console.error('Error buying game tokens with SUI:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Purchase Game Tokens with USDC
     */
    async buyGameTokensWithUsdc(walletKeyPair, usdcAmount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(100000000);

            const usdcCoins = await this.suiClient.getCoins({
                owner: userAddress,
                coinType: this.USDC_TYPE,
            });

            if (usdcCoins.data.length === 0) {
                throw new Error('No USDC coins found in wallet');
            }

            const requiredAmountSmallest = Math.floor(usdcAmount * Math.pow(10, this.USDC_DECIMALS));
            const totalBalance = usdcCoins.data.reduce((sum, coin) => sum + Number(coin.balance), 0);

            if (totalBalance < requiredAmountSmallest) {
                throw new Error(`Insufficient USDC balance. Have: ${totalBalance / Math.pow(10, this.USDC_DECIMALS)} USDC, Need: ${requiredAmountSmallest / Math.pow(10, this.USDC_DECIMALS)} USDC`);
            }

            // Merge and split USDC coins
            let usdcCoin = txb.object(usdcCoins.data[0].coinObjectId);
            if (usdcCoins.data.length > 1) {
                const otherCoins = usdcCoins.data.slice(1).map(coin => txb.object(coin.coinObjectId));
                txb.mergeCoins(usdcCoin, otherCoins);
            }

            const [paymentCoin] = txb.splitCoins(usdcCoin, [requiredAmountSmallest]);

            const gtCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::buy_gt_with_usdc`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    paymentCoin,
                ],
            });

            txb.transferObjects([gtCoin], userAddress);

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                    showObjectChanges: true,
                },
            });

            if (result.effects?.status?.status !== 'success') {
                throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
            }

            return {
                success: true,
                digest: result.digest,
                events: result.events || [],
            };
        } catch (error) {
            console.error('Error buying game tokens with USDC:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Purchase Game Tokens with USDT
     */
    async buyGameTokensWithUsdt(walletKeyPair, usdtAmount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(100000000);

            const usdtCoins = await this.suiClient.getCoins({
                owner: userAddress,
                coinType: this.USDT_TYPE,
            });

            if (usdtCoins.data.length === 0) {
                throw new Error('No USDT coins found in wallet');
            }

            const requiredAmountSmallest = Math.floor(usdtAmount * Math.pow(10, this.USDT_DECIMALS));
            const totalBalance = usdtCoins.data.reduce((sum, coin) => sum + Number(coin.balance), 0);

            if (totalBalance < requiredAmountSmallest) {
                throw new Error(`Insufficient USDT balance. Have: ${totalBalance / Math.pow(10, this.USDT_DECIMALS)} USDT, Need: ${requiredAmountSmallest / Math.pow(10, this.USDT_DECIMALS)} USDT`);
            }

            // Merge and split USDT coins
            let usdtCoin = txb.object(usdtCoins.data[0].coinObjectId);
            if (usdtCoins.data.length > 1) {
                const otherCoins = usdtCoins.data.slice(1).map(coin => txb.object(coin.coinObjectId));
                txb.mergeCoins(usdtCoin, otherCoins);
            }

            const [paymentCoin] = txb.splitCoins(usdtCoin, [requiredAmountSmallest]);

            const gtCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::buy_gt_with_usdt`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    paymentCoin,
                ],
            });

            txb.transferObjects([gtCoin], userAddress);

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                    showObjectChanges: true,
                },
            });

            if (result.effects?.status?.status !== 'success') {
                throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
            }

            return {
                success: true,
                digest: result.digest,
                events: result.events || [],
            };
        } catch (error) {
            console.error('Error buying game tokens with USDT:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ========================= SELL FUNCTIONS =========================

    /**
     * Sell Game Tokens for SUI
     */
    async sellGameTokensForSui(walletKeyPair, gtAmount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(100000000);

            const gtCoins = await this.getGameTokenCoins(userAddress);
            if (!gtCoins || gtCoins.length === 0) {
                throw new Error('No Game Token coins found');
            }

            const gtAmountSmallest = Math.floor(gtAmount * Math.pow(10, this.GT_DECIMALS));

            // Merge GT coins if needed and split the required amount
            let gtCoin = txb.object(gtCoins[0]);
            if (gtCoins.length > 1) {
                const otherCoins = gtCoins.slice(1).map(coinId => txb.object(coinId));
                txb.mergeCoins(gtCoin, otherCoins);
            }

            const [sellCoin] = txb.splitCoins(gtCoin, [gtAmountSmallest]);

            const suiCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::sell_gt_for_sui`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    sellCoin,
                ],
            });

            txb.transferObjects([suiCoin], userAddress);

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            if (result.effects?.status?.status !== 'success') {
                throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
            }

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error('Error selling GT for SUI:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Sell Game Tokens for USDC
     */
    async sellGameTokensForUsdc(walletKeyPair, gtAmount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(100000000);

            const gtCoins = await this.getGameTokenCoins(userAddress);
            if (!gtCoins || gtCoins.length === 0) {
                throw new Error('No Game Token coins found');
            }

            const gtAmountSmallest = Math.floor(gtAmount * Math.pow(10, this.GT_DECIMALS));

            let gtCoin = txb.object(gtCoins[0]);
            if (gtCoins.length > 1) {
                const otherCoins = gtCoins.slice(1).map(coinId => txb.object(coinId));
                txb.mergeCoins(gtCoin, otherCoins);
            }

            const [sellCoin] = txb.splitCoins(gtCoin, [gtAmountSmallest]);

            const usdcCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::sell_gt_for_usdc`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    sellCoin,
                ],
            });

            txb.transferObjects([usdcCoin], userAddress);

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            if (result.effects?.status?.status !== 'success') {
                throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
            }

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error('Error selling GT for USDC:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Sell Game Tokens for USDT
     */
    async sellGameTokensForUsdt(walletKeyPair, gtAmount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(100000000);

            const gtCoins = await this.getGameTokenCoins(userAddress);
            if (!gtCoins || gtCoins.length === 0) {
                throw new Error('No Game Token coins found');
            }

            const gtAmountSmallest = Math.floor(gtAmount * Math.pow(10, this.GT_DECIMALS));

            let gtCoin = txb.object(gtCoins[0]);
            if (gtCoins.length > 1) {
                const otherCoins = gtCoins.slice(1).map(coinId => txb.object(coinId));
                txb.mergeCoins(gtCoin, otherCoins);
            }

            const [sellCoin] = txb.splitCoins(gtCoin, [gtAmountSmallest]);

            const usdtCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::sell_gt_for_usdt`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    sellCoin,
                ],
            });

            txb.transferObjects([usdtCoin], userAddress);

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            if (result.effects?.status?.status !== 'success') {
                throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
            }

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error('Error selling GT for USDT:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ========================= BALANCE FUNCTIONS =========================

    /**
     * Get Game Token balance for an address (WITH DEBUGGING)
     */
    async getGameTokenBalance(address) {
        try {
            console.log('🔍 Fetching GT balance for:', address);
            console.log('🎮 GT Token Type:', this.GAME_TOKEN_TYPE);

            const balance = await this.suiClient.getBalance({
                owner: address,
                coinType: this.GAME_TOKEN_TYPE,
            });

            console.log('💰 Raw balance response:', balance);

            const formattedBalance = Number(balance.totalBalance) / Math.pow(10, this.GT_DECIMALS);
            console.log('✅ Formatted GT balance:', formattedBalance);

            return formattedBalance;
        } catch (error) {
            console.error('❌ Error fetching GT balance:', error);
            console.log('🔧 Trying to get all coins to debug...');

            // Debug: Get all coins for this address
            try {
                const allCoins = await this.suiClient.getAllCoins({
                    owner: address,
                });
                console.log('🪙 All coins for address:', allCoins.data);

                // Filter for GT coins
                const gtCoins = allCoins.data.filter(coin =>
                    coin.coinType === this.GAME_TOKEN_TYPE
                );
                console.log('🎮 GT coins found:', gtCoins);

                if (gtCoins.length > 0) {
                    const totalBalance = gtCoins.reduce((sum, coin) =>
                        sum + Number(coin.balance), 0
                    );
                    const formattedBalance = totalBalance / Math.pow(10, this.GT_DECIMALS);
                    console.log('✅ Manual GT balance calculation:', formattedBalance);
                    return formattedBalance;
                }
            } catch (debugError) {
                console.error('❌ Debug coin fetch also failed:', debugError);
            }

            return 0;
        }
    }

    /**
     * Get USDC balance for an address
     */
    async getUSDCBalance(address) {
        try {
            const balance = await this.suiClient.getBalance({
                owner: address,
                coinType: this.USDC_TYPE,
            });

            return Number(balance.totalBalance) / Math.pow(10, this.USDC_DECIMALS);
        } catch (error) {
            console.error('Error fetching USDC balance:', error);
            return 0;
        }
    }

    /**
     * Get USDT balance for an address
     */
    async getUSDTBalance(address) {
        try {
            const balance = await this.suiClient.getBalance({
                owner: address,
                coinType: this.USDT_TYPE,
            });

            return Number(balance.totalBalance) / Math.pow(10, this.USDT_DECIMALS);
        } catch (error) {
            console.error('Error fetching USDT balance:', error);
            return 0;
        }
    }

    /**
     * Get SUI balance for an address
     */
    async getSUIBalance(address) {
        try {
            const balance = await this.suiClient.getBalance({
                owner: address,
                coinType: this.SUI_TYPE,
            });

            return Number(balance.totalBalance) / Math.pow(10, this.SUI_DECIMALS);
        } catch (error) {
            console.error('Error fetching SUI balance:', error);
            return 0;
        }
    }

    /**
     * Get all balances for an address
     */
    async getAllBalances(address) {
        try {
            const [sui, usdc, usdt, gameTokens] = await Promise.all([
                this.getSUIBalance(address),
                this.getUSDCBalance(address),
                this.getUSDTBalance(address),
                this.getGameTokenBalance(address),
            ]);

            return {
                sui,
                usdc,
                usdt,
                gameTokens,
            };
        } catch (error) {
            console.error('Error fetching all balances:', error);
            return {
                sui: 0,
                usdc: 0,
                usdt: 0,
                gameTokens: 0,
            };
        }
    }

    // ========================= SPENDING FUNCTIONS =========================

    /**
     * Spend Game Tokens for room entry
     */
    async spendForRoomEntry(walletKeyPair, gtAmount, roomId) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(50000000);

            const gtCoins = await this.getGameTokenCoins(userAddress);
            if (!gtCoins || gtCoins.length === 0) {
                throw new Error('No Game Token coins found');
            }

            const gtAmountSmallest = Math.floor(gtAmount * Math.pow(10, this.GT_DECIMALS));

            let gtCoin = txb.object(gtCoins[0]);
            if (gtCoins.length > 1) {
                const otherCoins = gtCoins.slice(1).map(coinId => txb.object(coinId));
                txb.mergeCoins(gtCoin, otherCoins);
            }

            const [spendCoin] = txb.splitCoins(gtCoin, [gtAmountSmallest]);

            const [gtToken, convertRequest] = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::coin_to_token`,
                arguments: [spendCoin],
            });

            txb.moveCall({
                target: `0x2::token::confirm_request`,
                typeArguments: [this.GAME_TOKEN_TYPE],
                arguments: [
                    txb.object(this.TOKEN_POLICY_ID),
                    convertRequest,
                ],
            });

            txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::spend_for_room_entry`,
                arguments: [
                    txb.object(this.TOKEN_POLICY_ID),
                    gtToken,
                    txb.pure(roomId),
                ],
            });

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error('Error spending GT for room entry:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Spend Game Tokens for marketplace purchase
     */
    async spendForMarketplace(walletKeyPair, gtAmount, itemId) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(50000000);

            const gtCoins = await this.getGameTokenCoins(userAddress);
            if (!gtCoins || gtCoins.length === 0) {
                throw new Error('No Game Token coins found');
            }

            const gtAmountSmallest = Math.floor(gtAmount * Math.pow(10, this.GT_DECIMALS));

            let gtCoin = txb.object(gtCoins[0]);
            if (gtCoins.length > 1) {
                const otherCoins = gtCoins.slice(1).map(coinId => txb.object(coinId));
                txb.mergeCoins(gtCoin, otherCoins);
            }

            const [spendCoin] = txb.splitCoins(gtCoin, [gtAmountSmallest]);

            const [gtToken, convertRequest] = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::coin_to_token`,
                arguments: [spendCoin],
            });

            txb.moveCall({
                target: `0x2::token::confirm_request`,
                typeArguments: [this.GAME_TOKEN_TYPE],
                arguments: [
                    txb.object(this.TOKEN_POLICY_ID),
                    convertRequest,
                ],
            });

            txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::spend_for_marketplace`,
                arguments: [
                    txb.object(this.TOKEN_POLICY_ID),
                    gtToken,
                    txb.pure(itemId),
                ],
            });

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error('Error spending GT for marketplace:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ========================= ADMIN FUNCTIONS =========================

    /**
     * Update exchange rates (admin only)
     */
    async updateExchangeRate(walletKeyPair, currency, newRate) {
        try {
            const txb = new TransactionBlock();
            txb.setGasBudget(50000000);

            let targetFunction;
            switch (currency.toUpperCase()) {
                case 'SUI':
                    targetFunction = 'update_sui_rate';
                    break;
                case 'USDC':
                    targetFunction = 'update_usdc_rate';
                    break;
                case 'USDT':
                    targetFunction = 'update_usdt_rate';
                    break;
                default:
                    throw new Error(`Unsupported currency: ${currency}`);
            }

            txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::${targetFunction}`,
                arguments: [
                    txb.object(this.ADMIN_CAP_ID),
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    txb.pure(newRate),
                ],
            });

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error(`Error updating ${currency} rate:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Add reserves to the contract (admin only)
     */
    async addReserves(walletKeyPair, currency, amount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(100000000);

            let targetFunction, coinType, decimals;
            switch (currency.toUpperCase()) {
                case 'SUI':
                    targetFunction = 'add_sui_reserves';
                    coinType = this.SUI_TYPE;
                    decimals = this.SUI_DECIMALS;
                    break;
                case 'USDC':
                    targetFunction = 'add_usdc_reserves';
                    coinType = this.USDC_TYPE;
                    decimals = this.USDC_DECIMALS;
                    break;
                case 'USDT':
                    targetFunction = 'add_usdt_reserves';
                    coinType = this.USDT_TYPE;
                    decimals = this.USDT_DECIMALS;
                    break;
                default:
                    throw new Error(`Unsupported currency: ${currency}`);
            }

            const coins = await this.suiClient.getCoins({
                owner: userAddress,
                coinType: coinType,
            });

            if (coins.data.length === 0) {
                throw new Error(`No ${currency} coins found in wallet`);
            }

            const requiredAmountSmallest = Math.floor(amount * Math.pow(10, decimals));

            let coin = txb.object(coins.data[0].coinObjectId);
            if (coins.data.length > 1) {
                const otherCoins = coins.data.slice(1).map(coin => txb.object(coin.coinObjectId));
                txb.mergeCoins(coin, otherCoins);
            }

            const [reserveCoin] = txb.splitCoins(coin, [requiredAmountSmallest]);

            txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::${targetFunction}`,
                arguments: [
                    txb.object(this.ADMIN_CAP_ID),
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    reserveCoin,
                ],
            });

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error(`Error adding ${currency} reserves:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Withdraw reserves from the contract (admin only)
     */
    async withdrawReserves(walletKeyPair, currency, amount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(100000000);

            let targetFunction, decimals;
            switch (currency.toUpperCase()) {
                case 'SUI':
                    targetFunction = 'withdraw_sui_reserves';
                    decimals = this.SUI_DECIMALS;
                    break;
                case 'USDC':
                    targetFunction = 'withdraw_usdc_reserves';
                    decimals = this.USDC_DECIMALS;
                    break;
                case 'USDT':
                    targetFunction = 'withdraw_usdt_reserves';
                    decimals = this.USDT_DECIMALS;
                    break;
                default:
                    throw new Error(`Unsupported currency: ${currency}`);
            }

            const amountSmallest = Math.floor(amount * Math.pow(10, decimals));

            const coin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::${targetFunction}`,
                arguments: [
                    txb.object(this.ADMIN_CAP_ID),
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    txb.pure(amountSmallest),
                ],
            });

            txb.transferObjects([coin], userAddress);

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error(`Error withdrawing ${currency} reserves:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Mint reward tokens (admin only)
     */
    async mintReward(walletKeyPair, amount, recipientAddress) {
        try {
            const txb = new TransactionBlock();
            txb.setGasBudget(50000000);

            const amountSmallest = Math.floor(amount * Math.pow(10, this.GT_DECIMALS));

            txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::mint_reward`,
                arguments: [
                    txb.object(this.ADMIN_CAP_ID),
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    txb.pure(amountSmallest),
                    txb.pure(recipientAddress),
                ],
            });

            const result = await this.suiClient.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            });

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error('Error minting reward:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ========================= VIEW FUNCTIONS =========================

    /**
     * Get store statistics
     */
    async getStoreStats() {
        try {
            const result = await this.suiClient.getObject({
                id: this.GAME_TOKEN_STORE_ID,
                options: {
                    showContent: true,
                },
            });

            if (result.data?.content?.fields) {
                const fields = result.data.content.fields;
                return {
                    totalMinted: Number(fields.total_minted) / Math.pow(10, this.GT_DECIMALS),
                    totalBurned: Number(fields.total_burned) / Math.pow(10, this.GT_DECIMALS),
                    suiRate: Number(fields.sui_rate),
                    usdcRate: Number(fields.usdc_rate),
                    usdtRate: Number(fields.usdt_rate),
                    admin: fields.admin,
                    suiTradingEnabled: fields.sui_trading_enabled,
                    usdcTradingEnabled: fields.usdc_trading_enabled,
                    usdtTradingEnabled: fields.usdt_trading_enabled,
                };
            }

            return null;
        } catch (error) {
            console.error('Error fetching store stats:', error);
            return null;
        }
    }

    /**
     * Get reserve balances
     */
    async getReserveBalances() {
        try {
            const result = await this.suiClient.getObject({
                id: this.GAME_TOKEN_STORE_ID,
                options: {
                    showContent: true,
                },
            });

            if (result.data?.content?.fields) {
                const fields = result.data.content.fields;
                return {
                    sui: Number(fields.sui_reserves?.fields?.value || 0) / Math.pow(10, this.SUI_DECIMALS),
                    usdc: Number(fields.usdc_reserves?.fields?.value || 0) / Math.pow(10, this.USDC_DECIMALS),
                    usdt: Number(fields.usdt_reserves?.fields?.value || 0) / Math.pow(10, this.USDT_DECIMALS),
                };
            }

            return { sui: 0, usdc: 0, usdt: 0 };
        } catch (error) {
            console.error('Error fetching reserve balances:', error);
            return { sui: 0, usdc: 0, usdt: 0 };
        }
    }

    /**
     * Get exchange rate for specific currency
     */
    async getExchangeRate(currency = 'SUI') {
        try {
            const stats = await this.getStoreStats();
            if (!stats) return 2500; // Default rate

            switch (currency.toUpperCase()) {
                case 'SUI':
                    return stats.suiRate || 3100;
                case 'USDC':
                    return stats.usdcRate || 900;
                case 'USDT':
                    return stats.usdtRate || 900;
                default:
                    return 3100; // Default to SUI rate
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            // Return appropriate default based on currency
            switch (currency.toUpperCase()) {
                case 'SUI': return 3100;
                case 'USDC': return 900;
                case 'USDT': return 900;
                default: return 3100;
            }
        }
    }

    /**
     * Get Game Token coins for an address
     */
    async getGameTokenCoins(address) {
        try {
            const coins = await this.suiClient.getCoins({
                owner: address,
                coinType: this.GAME_TOKEN_TYPE,
            });

            return coins.data.map(coin => coin.coinObjectId);
        } catch (error) {
            console.error('Error fetching GT coins:', error);
            return [];
        }
    }

    /**
     * Get transaction history for all token operations (FIXED FUNCTION NAME)
     */
    async getTokenPurchaseHistory(limit = 20) {
        try {
            const [purchaseEvents, sellEvents] = await Promise.all([
                this.suiClient.queryEvents({
                    query: {
                        MoveEventType: `${this.PACKAGE_ID}::game_token::TokensPurchased`,
                    },
                    limit,
                    order: 'descending',
                }),
                this.suiClient.queryEvents({
                    query: {
                        MoveEventType: `${this.PACKAGE_ID}::game_token::TokensSold`,
                    },
                    limit,
                    order: 'descending',
                })
            ]);

            const allEvents = [...purchaseEvents.data, ...sellEvents.data]
                .sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
                .slice(0, limit);

            return allEvents.map(event => {
                const isPurchase = event.type.includes('TokensPurchased');
                return {
                    digest: event.id.txDigest,
                    timestamp: event.timestampMs,
                    type: isPurchase ? 'purchase' : 'sale',
                    user: event.parsedJson?.buyer || event.parsedJson?.seller || 'Unknown',
                    currency: event.parsedJson?.payment_currency || event.parsedJson?.received_currency || 'Unknown',
                    amount: isPurchase
                        ? Number(event.parsedJson?.payment_amount || 0)
                        : Number(event.parsedJson?.received_amount || 0),
                    gtAmount: isPurchase
                        ? Number(event.parsedJson?.gt_received || 0) / Math.pow(10, this.GT_DECIMALS)
                        : Number(event.parsedJson?.gt_amount || 0) / Math.pow(10, this.GT_DECIMALS),
                    exchangeRate: Number(event.parsedJson?.exchange_rate || 0),
                    // Format for wallet display
                    paymentAmount: isPurchase ? Number(event.parsedJson?.payment_amount || 0) : 0,
                    gtReceived: isPurchase ? Number(event.parsedJson?.gt_received || 0) : 0,
                };
            });
        } catch (error) {
            console.error('Error fetching token purchase history:', error);
            return [];
        }
    }

    /**
     * Alias for getTokenPurchaseHistory (backward compatibility)
     */
    async getTokenHistory(limit = 20) {
        return this.getTokenPurchaseHistory(limit);
    }
}

// Enhanced utility functions
export const gameTokenUtils = {
    // Convert between different units
    toSmallestUnit: (amount, decimals = 6) => Math.floor(amount * Math.pow(10, decimals)),
    fromSmallestUnit: (amount, decimals = 6) => amount / Math.pow(10, decimals),

    // Format amounts for display
    formatGT: (amount) => `${Math.floor(amount).toLocaleString()} GT`,
    formatSUI: (amount) => `${amount.toFixed(4)} SUI`,
    formatUSDC: (amount) => `${amount.toFixed(4)} USDC`,
    formatUSDT: (amount) => `${amount.toFixed(4)} USDT`,
    formatUSD: (amount) => `${amount.toFixed(2)}`,

    // Calculate exchange amounts using optimized business rates
    calculateGTFromCurrency: (currencyAmount, rate = 3100) => Math.floor(currencyAmount * rate), // Default to SUI rate
    calculateCurrencyFromGT: (gtAmount, rate = 3100) => gtAmount / rate,

    // Multi-currency support helpers
    getSupportedCurrencies: () => ['SUI', 'USDC', 'USDT', 'GAME_TOKEN'],

    getCurrencyDecimals: (currency) => {
        switch (currency.toUpperCase()) {
            case 'SUI': return 9;
            case 'USDC': return 6;
            case 'USDT': return 6;
            case 'GAME_TOKEN': return 6;
            default: return 6;
        }
    },

    getCurrencyIcon: (currency) => {
        switch (currency.toUpperCase()) {
            case 'SUI': return '🔵';
            case 'USDC': return '💎';
            case 'USDT': return '🟢';
            case 'GAME_TOKEN': return '🎮';
            default: return '🪙';
        }
    },

    // Validation helpers
    validateSwapPair: (fromCurrency, toCurrency) => {
        if (fromCurrency === toCurrency) return 'Cannot swap same currency';

        const supportedCurrencies = gameTokenUtils.getSupportedCurrencies();
        if (!supportedCurrencies.includes(fromCurrency) || !supportedCurrencies.includes(toCurrency)) {
            return 'Unsupported currency pair';
        }

        // All swaps must involve Game Tokens
        if (fromCurrency !== 'GAME_TOKEN' && toCurrency !== 'GAME_TOKEN') {
            return 'All swaps must involve Game Tokens (GT)';
        }

        return null; // Valid pair
    },

    // Contract information
    CONTRACT_INFO: {
        PACKAGE_ID: '0x635b49907d2463300968b1bc13388ccd9c5a0302b1ef7be065d3eba8b6616da0',
        GAME_TOKEN_STORE_ID: '0xb7ba6d465a0536cf71ade84eb0a54d444e0c7e1486cc0c18de567834581fa14e',
        TOKEN_POLICY_ID: '0x1342d88b9688b0deafc977fadaf683aadedab2b4e337c3a57ec99c42004e0f9c',
        ADMIN_CAP_ID: '0x6f98813f138929a405eb03044a37dfafcaec19baad38ca8a35de9b18b1798a3b',
        EXPLORER_URL: 'https://suivision.xyz',
        NETWORK: 'testnet',
        GT_DECIMALS: 6,
        SUPPORTED_CURRENCIES: ['SUI', 'USDC', 'USDT', 'GAME_TOKEN'],
        DEFAULT_EXCHANGE_RATES: {
            SUI: 3100,   // 1 SUI ($3.52) = 3100 GT (12% profit margin)
            USDC: 900,   // 1 USDC ($1.00) = 900 GT (10% profit margin)  
            USDT: 900    // 1 USDT ($1.00) = 900 GT (10% profit margin)
        }
    }
};

// Factory function to initialize the enhanced GameTokenManager
export const initGameTokenManager = (suiClient, network = 'testnet') => {
    return new GameTokenManager(suiClient, network);
};