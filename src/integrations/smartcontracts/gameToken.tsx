// Complete GameToken Manager for Deployed Contract
// Updated with your actual deployed addresses from transaction output

import { TransactionBlock } from '@mysten/sui.js/transactions';

export class GameTokenManager {
    constructor(suiClient, network = 'testnet') {
        this.suiClient = suiClient;
        this.network = network;

        // Your deployed contract addresses
        this.PACKAGE_ID = '0x28368dd22fdcfd68639d6ef692b666b05c66b4cb601598c6df1163d09769a161';
        this.GAME_TOKEN_STORE_ID = '0x361231730e99ca459be4789d58c4dc772fc8d6819de536a8de4447627009eb4f';
        this.TOKEN_POLICY_ID = '0x1f6789b62e0a7465aa56c6c9efd3284c97c3d04d438bf549ddb96b02945596a8';
        this.ADMIN_CAP_ID = '0x8e85f98102940f4fafe142f563cbfff596768498ae8cb6d17b68f43113059297';

        // Token types
        this.GAME_TOKEN_TYPE = `${this.PACKAGE_ID}::game_token::GAME_TOKEN`;

        // SIMPLE FIX: Use YOUR contract's USDC and USDT types
        this.USDC_TYPE = `${this.PACKAGE_ID}::game_token::USDC`;
        this.USDT_TYPE = `${this.PACKAGE_ID}::game_token::USDT`;

        // Exchange rate and settings
        this.USD_TO_GT_RATE = 1000;
        this.PLATFORM_FEE_RATE = 0.005;
        this.GT_DECIMALS = 6;
        this.USDC_DECIMALS = 6;
        this.USDT_DECIMALS = 6;
    }


    // ========================= CALCULATION HELPERS =========================

    /**
     * Calculate payment required for desired GT amount
     */
    calculatePaymentRequired(gtAmount) {
        const usdEquivalent = gtAmount / this.USD_TO_GT_RATE;
        const platformFee = usdEquivalent * this.PLATFORM_FEE_RATE;
        const totalPayment = usdEquivalent + platformFee;

        return {
            usdEquivalent,
            platformFee,
            totalPayment
        };
    }

    /**
     * Calculate USD received when selling GT
     */
    calculateUSDReceived(gtAmount) {
        const usdEquivalent = gtAmount / this.USD_TO_GT_RATE;
        const platformFee = usdEquivalent * this.PLATFORM_FEE_RATE;
        const usdReceived = usdEquivalent - platformFee;

        return {
            usdEquivalent,
            platformFee,
            usdReceived
        };
    }

    // ========================= MINT GT FUNCTIONS =========================

    /**
     * Mint specific amount of GT tokens with USDC
     */
    async mintGTWithUSDC(walletKeyPair, gtAmountWanted) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(50000000);

            // Calculate required payment
            const { usdEquivalent, platformFee, totalPayment } = this.calculatePaymentRequired(gtAmountWanted);
            console.log(`💰 Want ${gtAmountWanted} GT: Pay $${totalPayment} (${usdEquivalent} + ${platformFee} fee)`);

            // Get USDC coins
            const usdcCoins = await this.suiClient.getCoins({
                owner: userAddress,
                coinType: this.USDC_TYPE,
            });

            if (usdcCoins.data.length === 0) {
                throw new Error('No USDC coins found');
            }

            // Convert to smallest units
            const totalPaymentSmallest = Math.floor(totalPayment * Math.pow(10, this.USDC_DECIMALS));
            const gtAmountSmallest = Math.floor(gtAmountWanted * Math.pow(10, this.GT_DECIMALS));

            const totalBalance = usdcCoins.data.reduce((sum, coin) => sum + Number(coin.balance), 0);

            if (totalBalance < totalPaymentSmallest) {
                throw new Error(`Insufficient USDC. Need $${totalPayment}, have $${totalBalance / Math.pow(10, this.USDC_DECIMALS)}`);
            }

            // Merge and split USDC coins
            let usdcCoin = txb.object(usdcCoins.data[0].coinObjectId);
            if (usdcCoins.data.length > 1) {
                const otherCoins = usdcCoins.data.slice(1).map(coin => txb.object(coin.coinObjectId));
                txb.mergeCoins(usdcCoin, otherCoins);
            }

            const [paymentCoin] = txb.splitCoins(usdcCoin, [totalPaymentSmallest]);

            // Mint GT tokens
            const gtCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::mint_gt_with_usdc`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    paymentCoin,
                    txb.pure(gtAmountSmallest),
                ],
            });

            txb.transferObjects([gtCoin], userAddress);

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
                gtReceived: gtAmountWanted,
                usdEquivalent,
                platformFee,
                totalPayment,
            };
        } catch (error) {
            console.error('Error minting GT with USDC:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Mint specific amount of GT tokens with USDT
     */
    async mintGTWithUSDT(walletKeyPair, gtAmountWanted) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(50000000);

            // Calculate required payment
            const { usdEquivalent, platformFee, totalPayment } = this.calculatePaymentRequired(gtAmountWanted);
            console.log(`💰 Want ${gtAmountWanted} GT: Pay $${totalPayment} (${usdEquivalent} + ${platformFee} fee)`);

            // Get USDT coins
            const usdtCoins = await this.suiClient.getCoins({
                owner: userAddress,
                coinType: this.USDT_TYPE,
            });

            if (usdtCoins.data.length === 0) {
                throw new Error('No USDT coins found');
            }

            // Convert to smallest units
            const totalPaymentSmallest = Math.floor(totalPayment * Math.pow(10, this.USDT_DECIMALS));
            const gtAmountSmallest = Math.floor(gtAmountWanted * Math.pow(10, this.GT_DECIMALS));

            const totalBalance = usdtCoins.data.reduce((sum, coin) => sum + Number(coin.balance), 0);

            if (totalBalance < totalPaymentSmallest) {
                throw new Error(`Insufficient USDT. Need $${totalPayment}, have $${totalBalance / Math.pow(10, this.USDT_DECIMALS)}`);
            }

            // Merge and split USDT coins
            let usdtCoin = txb.object(usdtCoins.data[0].coinObjectId);
            if (usdtCoins.data.length > 1) {
                const otherCoins = usdtCoins.data.slice(1).map(coin => txb.object(coin.coinObjectId));
                txb.mergeCoins(usdtCoin, otherCoins);
            }

            const [paymentCoin] = txb.splitCoins(usdtCoin, [totalPaymentSmallest]);

            // Mint GT tokens
            const gtCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::mint_gt_with_usdt`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    paymentCoin,
                    txb.pure(gtAmountSmallest),
                ],
            });

            txb.transferObjects([gtCoin], userAddress);

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
                gtReceived: gtAmountWanted,
                usdEquivalent,
                platformFee,
                totalPayment,
            };
        } catch (error) {
            console.error('Error minting GT with USDT:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ========================= BURN GT FUNCTIONS =========================

    /**
     * Burn GT tokens for USDC
     */
    async burnGTForUSDC(walletKeyPair, gtAmount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(50000000);

            // Calculate what user will receive
            const { usdEquivalent, platformFee, usdReceived } = this.calculateUSDReceived(gtAmount);
            console.log(`💸 Sell ${gtAmount} GT: Get $${usdReceived} (${usdEquivalent} - ${platformFee} fee)`);

            const gtCoins = await this.getGameTokenCoins(userAddress);
            if (!gtCoins || gtCoins.length === 0) {
                throw new Error('No Game Token coins found');
            }

            const gtAmountSmallest = Math.floor(gtAmount * Math.pow(10, this.GT_DECIMALS));

            // Merge and split GT coins
            let gtCoin = txb.object(gtCoins[0]);
            if (gtCoins.length > 1) {
                const otherCoins = gtCoins.slice(1).map(coinId => txb.object(coinId));
                txb.mergeCoins(gtCoin, otherCoins);
            }

            const [burnCoin] = txb.splitCoins(gtCoin, [gtAmountSmallest]);

            // Burn GT for USDC
            const usdcCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::burn_gt_for_usdc`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    burnCoin,
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
                gtSold: gtAmount,
                usdEquivalent,
                platformFee,
                usdReceived,
            };
        } catch (error) {
            console.error('Error burning GT for USDC:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Burn GT tokens for USDT
     */
    async burnGTForUSDT(walletKeyPair, gtAmount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(50000000);

            // Calculate what user will receive
            const { usdEquivalent, platformFee, usdReceived } = this.calculateUSDReceived(gtAmount);
            console.log(`💸 Sell ${gtAmount} GT: Get $${usdReceived} (${usdEquivalent} - ${platformFee} fee)`);

            const gtCoins = await this.getGameTokenCoins(userAddress);
            if (!gtCoins || gtCoins.length === 0) {
                throw new Error('No Game Token coins found');
            }

            const gtAmountSmallest = Math.floor(gtAmount * Math.pow(10, this.GT_DECIMALS));

            // Merge and split GT coins
            let gtCoin = txb.object(gtCoins[0]);
            if (gtCoins.length > 1) {
                const otherCoins = gtCoins.slice(1).map(coinId => txb.object(coinId));
                txb.mergeCoins(gtCoin, otherCoins);
            }

            const [burnCoin] = txb.splitCoins(gtCoin, [gtAmountSmallest]);

            // Burn GT for USDT
            const usdtCoin = txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::burn_gt_for_usdt`,
                arguments: [
                    txb.object(this.GAME_TOKEN_STORE_ID),
                    burnCoin,
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
                gtSold: gtAmount,
                usdEquivalent,
                platformFee,
                usdReceived,
            };
        } catch (error) {
            console.error('Error burning GT for USDT:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ========================= SPENDING FUNCTIONS =========================

    /**
     * Spend GT tokens in-game
     */
    async spendGTTokens(walletKeyPair, gtAmount, purpose) {
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

            // Convert to token for spending
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

            // Spend the tokens
            txb.moveCall({
                target: `${this.PACKAGE_ID}::game_token::spend_gt_tokens`,
                arguments: [
                    txb.object(this.TOKEN_POLICY_ID),
                    gtToken,
                    txb.pure(purpose),
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
            console.error('Error spending GT tokens:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ========================= BALANCE FUNCTIONS =========================

    /**
     * Get Game Token balance
     */
    async getGameTokenBalance(address) {
        try {
            const balance = await this.suiClient.getBalance({
                owner: address,
                coinType: this.GAME_TOKEN_TYPE,
            });
            return Number(balance.totalBalance) / Math.pow(10, this.GT_DECIMALS);
        } catch (error) {
            console.error('Error fetching GT balance:', error);
            return 0;
        }
    }

    /**
     * Get USDC balance
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
     * Get USDT balance
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

    // ========================= VIEW FUNCTIONS =========================

    /**
     * Get store statistics
     */
    async getStoreStats() {
        try {
            const result = await this.suiClient.getObject({
                id: this.GAME_TOKEN_STORE_ID,
                options: { showContent: true },
            });

            if (result.data?.content?.fields) {
                const fields = result.data.content.fields;
                return {
                    totalMinted: Number(fields.total_minted) / Math.pow(10, this.GT_DECIMALS),
                    totalBurned: Number(fields.total_burned) / Math.pow(10, this.GT_DECIMALS),
                    tradingEnabled: fields.trading_enabled,
                    admin: fields.admin,
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching store stats:', error);
            return null;
        }
    }

    /**
     * Get platform fee reserves
     */
    async getReserveBalances() {
        try {
            const result = await this.suiClient.getObject({
                id: this.GAME_TOKEN_STORE_ID,
                options: { showContent: true },
            });

            if (result.data?.content?.fields) {
                const fields = result.data.content.fields;
                return {
                    usdc: Number(fields.usdc_reserves?.fields?.value || 0) / Math.pow(10, this.USDC_DECIMALS),
                    usdt: Number(fields.usdt_reserves?.fields?.value || 0) / Math.pow(10, this.USDT_DECIMALS),
                };
            }
            return { usdc: 0, usdt: 0 };
        } catch (error) {
            console.error('Error fetching reserve balances:', error);
            return { usdc: 0, usdt: 0 };
        }
    }

    /**
     * Get Game Token coins for address
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
     * Get exchange rates and fees
     */
    getExchangeInfo() {
        return {
            usdToGtRate: this.USD_TO_GT_RATE,
            platformFeeRate: this.PLATFORM_FEE_RATE,
            gtToUsdRate: 1 / this.USD_TO_GT_RATE,
        };
    }

    // ========================= ADMIN FUNCTIONS =========================

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
                options: { showEffects: true, showEvents: true },
            });

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error('Error minting reward:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Withdraw platform fees (admin only)
     */
    async withdrawFees(walletKeyPair, currency, amount) {
        try {
            const txb = new TransactionBlock();
            const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
            txb.setGasBudget(50000000);

            const targetFunction = currency === 'USDC' ? 'withdraw_usdc_fees' : 'withdraw_usdt_fees';
            const decimals = currency === 'USDC' ? this.USDC_DECIMALS : this.USDT_DECIMALS;
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
                options: { showEffects: true, showEvents: true },
            });

            return {
                success: true,
                digest: result.digest,
                events: result.events,
            };
        } catch (error) {
            console.error(`Error withdrawing ${currency} fees:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get transaction history for GT operations
     */
    async getTransactionHistory(limit = 20) {
        try {
            const [mintEvents, burnEvents] = await Promise.all([
                this.suiClient.queryEvents({
                    query: {
                        MoveEventType: `${this.PACKAGE_ID}::game_token::GTMinted`,
                    },
                    limit,
                    order: 'descending',
                }),
                this.suiClient.queryEvents({
                    query: {
                        MoveEventType: `${this.PACKAGE_ID}::game_token::GTBurned`,
                    },
                    limit,
                    order: 'descending',
                })
            ]);

            const allEvents = [...mintEvents.data, ...burnEvents.data]
                .sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
                .slice(0, limit);

            return allEvents.map(event => {
                const isMint = event.type.includes('GTMinted');
                return {
                    digest: event.id.txDigest,
                    timestamp: event.timestampMs,
                    type: isMint ? 'mint' : 'burn',
                    user: event.parsedJson?.user || 'Unknown',
                    currency: event.parsedJson?.payment_currency || event.parsedJson?.received_currency || 'Unknown',
                    gtAmount: Number(event.parsedJson?.gt_amount || 0) / Math.pow(10, this.GT_DECIMALS),
                    usdEquivalent: Number(event.parsedJson?.usd_equivalent || 0) / Math.pow(10, 6),
                    platformFee: Number(event.parsedJson?.platform_fee || 0) / Math.pow(10, 6),
                    totalPayment: Number(event.parsedJson?.total_payment || 0) / Math.pow(10, 6),
                    usdReceived: Number(event.parsedJson?.usd_received || 0) / Math.pow(10, 6),
                };
            });
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            return [];
        }
    }
}

// Utility functions
export const gameTokenUtils = {
    // Calculate payment required for desired GT amount
    calculatePaymentRequired: (gtAmount) => {
        const usdEquivalent = gtAmount / 1000;
        const platformFee = usdEquivalent * 0.005;
        const totalPayment = usdEquivalent + platformFee;

        return {
            usdEquivalent,
            platformFee,
            totalPayment,
            breakdown: `Want ${gtAmount} GT → Pay $${totalPayment.toFixed(4)} ($${usdEquivalent} + $${platformFee.toFixed(4)} fee)`
        };
    },

    // Calculate USD received when selling GT
    calculateUSDReceived: (gtAmount) => {
        const usdEquivalent = gtAmount / 1000;
        const platformFee = usdEquivalent * 0.005;
        const usdReceived = usdEquivalent - platformFee;

        return {
            usdEquivalent,
            platformFee,
            usdReceived,
            breakdown: `Sell ${gtAmount} GT → Get $${usdReceived.toFixed(4)} ($${usdEquivalent} - $${platformFee.toFixed(4)} fee)`
        };
    },

    // Format amounts for display
    formatGT: (amount) => `${Math.floor(amount).toLocaleString()} GT`,
    formatUSD: (amount, currency = 'USD') => `$${amount.toFixed(4)} ${currency}`,

    // Contract information
    CONTRACT_INFO: {
        USD_TO_GT_RATE: 1000,
        PLATFORM_FEE_RATE: 0.005,
        GT_DECIMALS: 6,
        NETWORK: 'testnet',
        FEE_STRUCTURE: 'User pays extra 0.5% fee on top of USD equivalent',
    }
};

// Factory function
export const initGameTokenManager = (suiClient, network = 'testnet') => {
    return new GameTokenManager(suiClient, network);
};