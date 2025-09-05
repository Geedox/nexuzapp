import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { COIN_TYPES } from "@/constants";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import { logger } from "@/utils";

export class GameRoom {
    private client: SuiClient;
    private packageId: string;
    private storeId: string;
    private readonly moduleName = "game_room";
    private sponsorKeypair: Ed25519Keypair;
    private sponsorAddress: string;

    constructor(
        client: SuiClient,
        packageId: string = "0x773552029c3a0596bb3aa89956e28642c137a80036d36dd0ba627c1624e4b48c",
        storeId: string = "0x50782a8237d9fb21891b0a0dbdc4348057af9e4ea5d76d1aea67263465eefaa6",
    ) {
        this.client = client;
        this.packageId = packageId;
        this.storeId = storeId;

        // const sponsorPrivateKey = process.env.VITE_PRIVATE_KEY;
        const sponsorPrivateKey = import.meta.env.VITE_PRIVATE_KEY;
        // logger.debug('Raw private key from env:', sponsorPrivateKey ? `${sponsorPrivateKey.substring(0, 8)}...` : 'NOT FOUND');

        if (!sponsorPrivateKey) {
            throw new Error("Sponsor private key is not set");
        }

        this.sponsorKeypair = this.getWalletKeypair(sponsorPrivateKey);
        this.sponsorAddress = this.sponsorKeypair?.getPublicKey().toSuiAddress();

        // logger.debug('Sponsor address derived:', this.sponsorAddress);
        // logger.debug('Sponsor keypair created successfully:', !!this.sponsorKeypair);
    }

    private getWalletKeypair = (privateKey: string): Ed25519Keypair => {
        try {
            // logger.debug('Processing private key...');
            // logger.debug('Private key length:', privateKey.length);
            // logger.debug('Private key first 10 chars:', privateKey.substring(0, 10));

            // Check if it's a Sui bech32 private key (starts with 'suiprivkey')
            if (privateKey.startsWith('suiprivkey')) {
                // logger.debug('Detected Sui bech32 private key format');
                try {
                    // Decode the bech32 private key to get the raw bytes
                    const { secretKey } = decodeSuiPrivateKey(privateKey);
                    // logger.debug('Secret key decoded, length:', secretKey.length);

                    // Ensure we have exactly 32 bytes
                    if (secretKey.length !== 32) {
                        throw new Error(`Expected 32 byte secret key, got ${secretKey.length}`);
                    }

                    // Create keypair from the decoded bytes
                    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
                    const testAddress = keypair.getPublicKey().toSuiAddress();
                    // logger.debug('Successfully created keypair from decoded bech32');
                    // logger.debug('Derived address:', testAddress);
                    return keypair;

                } catch (bech32Error) {
                    // console.error('[DEBUG] Failed to decode bech32 private key:', bech32Error);
                    throw new Error(`Failed to parse Sui bech32 private key: ${bech32Error.message}`);
                }
            }

            // Handle hex format (with or without 0x prefix)
            let cleanKey = privateKey;
            if (privateKey.startsWith('0x')) {
                cleanKey = privateKey.slice(2);
                // logger.debug('Removed 0x prefix, new length:', cleanKey.length);
            }

            // Check if key is valid hex and proper length
            if (!cleanKey || typeof cleanKey !== "string") {
                throw new Error("Private key is not a valid string");
            }

            if (cleanKey.length !== 64) {
                throw new Error(`Private key must be 64 hex characters, got ${cleanKey.length}`);
            }

            // Validate hex format
            if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
                throw new Error("Private key contains invalid hex characters");
            }

            // logger.debug('Private key validation passed for hex format');

            // Convert hex string to bytes
            const bytes = new Uint8Array(32);
            for (let i = 0; i < 32; i++) {
                const hexByte = cleanKey.substr(i * 2, 2);
                bytes[i] = parseInt(hexByte, 16);
            }

            // Create keypair from secret key
            const keypair = Ed25519Keypair.fromSecretKey(bytes);
            return keypair;

        } catch (e) {
            logger.error("Error creating wallet keypair:", e);
            throw new Error(`Failed to create wallet keypair: ${e.message}`);
        }
    };

    // Add a public method to get the sponsor address for debugging
    public getSponsorAddress(): string {
        return this.sponsorAddress;
    }

    // Add a method to test private key conversion
    public testPrivateKeyConversion(testPrivateKey?: string): void {
        const keyToTest = testPrivateKey || import.meta.env.VITE_PRIVATE_KEY;

        if (!keyToTest) {
            logger.error("No private key to test");
            return;
        }

        logger.info("Testing private key conversion...");
        // logger.debug('Original key format:', keyToTest.substring(0, 10) + '...');
        logger.debug('Key length:', keyToTest.length);

        try {
            if (keyToTest.startsWith('suiprivkey')) {
                logger.debug('Testing Sui bech32 format...');
                try {
                    const { secretKey } = decodeSuiPrivateKey(keyToTest);
                    const keypair1 = Ed25519Keypair.fromSecretKey(secretKey);
                    const address1 = keypair1.getPublicKey().toSuiAddress();
                    logger.debug('Bech32 decoding successful, address:', address1);
                } catch (e) {
                    logger.debug('Bech32 method failed:', e.message);
                }
            } else {
                // Method for hex keys
                const cleanKey = keyToTest.startsWith('0x') ? keyToTest.slice(2) : keyToTest;
                if (cleanKey.length === 64) {
                    logger.debug('Testing hex format...');
                    const bytes = new Uint8Array(32);
                    for (let i = 0; i < 32; i++) {
                        bytes[i] = parseInt(cleanKey.substr(i * 2, 2), 16);
                    }
                    const keypair2 = Ed25519Keypair.fromSecretKey(bytes);
                    const address2 = keypair2.getPublicKey().toSuiAddress();
                    logger.debug('Hex method address:', address2);
                }
            }

        } catch (error) {
            console.error('[DEBUG] Test failed:', error);
        }
    }

    private getTarget(func: string): `${string}::${string}::${string}` {
        return `${this.packageId}::${this.moduleName}::${func}` as `${string}::${string}::${string}`;
    }

    private async dryRunTransaction(txb: TransactionBlock, sender: string, bufferMultiplier: number = 1.2) {
        // Provisional budget to allow the dry run to work
        txb.setGasBudget(50_000_000);
        // Ensure sender is set for building
        txb.setSender(sender);
        const resp = await this.client.dryRunTransactionBlock({
            transactionBlock: await txb.build({ client: this.client }),
        });
        try {
            const gasUsed = resp?.effects?.gasUsed;
            if (gasUsed) {
                const computation = BigInt(gasUsed.computationCost ?? 0);
                const storageCost = BigInt(gasUsed.storageCost ?? 0);
                const nonRefundable = BigInt(gasUsed.nonRefundableStorageFee ?? 0);
                let estimate = computation + storageCost + nonRefundable;
                if (estimate < 1_000_000n) estimate = 1_000_000n;
                const numerator = BigInt(Math.round(bufferMultiplier * 100));
                const buffered = (estimate * numerator) / 100n;
                txb.setGasBudget(Number(buffered));
            }
        } catch {
            // ignore, keep provisional budget
        }
        return resp;
    }

    private toU64SmallestUnits(amount: number, decimals: number) {
        if (amount <= 0) return 0;
        const smallest = Math.floor(amount * Math.pow(10, decimals));
        return smallest;
    }

    // Create a new game room paying with USDC (or sponsor funding if isSponsored)
    async createGameRoom(options: {
        walletKeyPair: any; // Ed25519Keypair or compatible signer
        name: string;
        gameId: string;
        entryFee: number; // in USDC units (e.g., 1.5 = $1.5)
        maxPlayers: number;
        isPrivate: boolean;
        roomCode?: string; // required if isPrivate
        isSponsored?: boolean;
        sponsorAmount?: number; // in USDC units
        winnerSplitRule: "winner_takes_all" | "top_2" | "top_3" | "top_4" | "top_5" | "top_10" | "equal";
        startTimeMs: number;
        endTimeMs: number;
    }) {
        const {
            walletKeyPair,
            name,
            gameId,
            entryFee,
            maxPlayers,
            isPrivate,
            roomCode = "",
            isSponsored = false,
            sponsorAmount = 0,
            winnerSplitRule,
            startTimeMs,
            endTimeMs,
        } = options;

        const txb = new TransactionBlock();
        const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
        const usdcDecimals = 6;
        const entryFeeSmallest = this.toU64SmallestUnits(entryFee, usdcDecimals);
        const sponsorAmountSmallest = this.toU64SmallestUnits(sponsorAmount, usdcDecimals);

        // Determine payment amount depending on sponsorship
        const requiredPayment = isSponsored ? sponsorAmountSmallest : entryFeeSmallest;

        // Prepare USDC payment coin
        const usdcCoins = await this.client.getCoins({ owner: userAddress, coinType: COIN_TYPES.USDC });
        if (usdcCoins.data.length === 0) {
            throw new Error("No USDC coins found in wallet to fund room creation.");
        }

        const totalUsdc = usdcCoins.data.reduce((sum, c) => sum + Number(c.balance), 0);
        if (totalUsdc < requiredPayment) {
            throw new Error(`Insufficient USDC: need ${requiredPayment / Math.pow(10, usdcDecimals)} USDC, have ${totalUsdc / Math.pow(10, usdcDecimals)} USDC`);
        }

        const usdcPrimary = txb.object(usdcCoins.data[0].coinObjectId);
        if (usdcCoins.data.length > 1) {
            const rest = usdcCoins.data.slice(1).map(c => txb.object(c.coinObjectId));
            txb.mergeCoins(usdcPrimary, rest);
        }
        const [paymentCoin] = txb.splitCoins(usdcPrimary, [requiredPayment]);
        // Call create_room_with_usdc, capture (room_id, change)
        const createResult = txb.moveCall({
            target: this.getTarget("create_room_with_usdc"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(name),
                txb.pure(gameId),
                txb.pure(entryFeeSmallest),
                txb.pure("USDC"),
                txb.pure(maxPlayers),
                txb.pure(isPrivate),
                txb.pure(roomCode),
                txb.pure(isSponsored),
                txb.pure(sponsorAmountSmallest),
                txb.pure(winnerSplitRule),
                txb.pure(startTimeMs),
                txb.pure(endTimeMs),
                txb.object("0x6"), // Clock
                paymentCoin,
            ],
        }) as unknown as [any, any];

        const [, changeCoin] = createResult;
        // Return change to sender
        logger.info("userAddress in createGameRoom => ", userAddress);
        txb.transferObjects([changeCoin], txb.pure(userAddress));
        await this.dryRunTransaction(txb, userAddress);
        const result = await this.client.signAndExecuteTransactionBlock({
            signer: walletKeyPair,
            transactionBlock: txb,
            options: { showEffects: true, showEvents: true },
        });

        if (result.effects?.status?.status !== "success") {
            throw new Error(`Transaction failed: ${result.effects?.status?.error || "Unknown error"}`);
        }

        // Try to extract room_id from RoomCreated event
        let createdRoomId: string | undefined;
        const eventType = `${this.packageId}::${this.moduleName}::RoomCreated`;
        for (const ev of result.events || []) {
            if (ev.type === eventType && (ev.parsedJson as any)?.room_id) {
                createdRoomId = (ev.parsedJson as any).room_id as string;
                break;
            }
        }

        return {
            success: true,
            digest: result.digest,
            roomId: createdRoomId,
        } as { success: true; digest: string; roomId?: string };
    }

    // Fetch room details by room ID
    async fetchRoomDetails(options: { walletKeyPair: any; roomId: string }) {
        const { walletKeyPair, roomId } = options;

        const txb = new TransactionBlock();
        const roomDetails = txb.moveCall({
            target: this.getTarget("fetch_room"),
            arguments: [txb.object(this.storeId), txb.pure(roomId)],
        });
        txb.setGasBudget(50_000_000);
        txb.setSender(walletKeyPair.getPublicKey().toSuiAddress());
        const result = await this.client.signAndExecuteTransactionBlock({
            signer: walletKeyPair,
            transactionBlock: txb,
            options: { showEffects: true, showEvents: true },
        });


        return { success: true, digest: result.digest, result } as { success: true; digest: string; result: any };
    }

    // Join an existing room. Provide entryFee if required by the room (0 for sponsored rooms).
    async joinGameRoom(options: {
        isSponsored: boolean;
        walletKeyPair: any; // Ed25519Keypair or compatible signer
        roomId: string;
        roomCode?: string; // empty for public rooms
        entryFee: number; // in USDC units; 0 if sponsored
    }) {
        const { isSponsored, walletKeyPair, roomId, roomCode = "" } = options;
        const entryFee = options.isSponsored ? 0 : options.entryFee;

        const txb = new TransactionBlock();
        const userAddress = walletKeyPair.getPublicKey().toSuiAddress();

        const usdcDecimals = 6;
        const entryFeeSmallest = this.toU64SmallestUnits(entryFee, usdcDecimals);

        // Prepare USDC entry fee coin (may be 0 for sponsored rooms)
        const usdcCoins = await this.client.getCoins({ owner: userAddress, coinType: COIN_TYPES.USDC });
        if (!isSponsored) {
            if (usdcCoins.data.length === 0) {
                if (entryFeeSmallest === 0) {
                    throw new Error("Joining sponsored rooms requires at least one USDC coin to create a 0-value coin. Please hold a tiny amount of USDC.");
                }
                throw new Error("No USDC coins found in wallet to pay entry fee.");
            }
        }

        const totalUsdc = usdcCoins.data.reduce((sum, c) => sum + Number(c.balance), 0);
        if (entryFeeSmallest > 0 && totalUsdc < entryFeeSmallest) {
            throw new Error(`Insufficient USDC: need ${entryFee} USDC, have ${totalUsdc / Math.pow(10, usdcDecimals)} USDC`);
        }

        const usdcPrimary = txb.object(usdcCoins.data[0].coinObjectId);
        if (usdcCoins.data.length > 1) {
            const rest = usdcCoins.data.slice(1).map(c => txb.object(c.coinObjectId));
            txb.mergeCoins(usdcPrimary, rest);
        }

        const [entryFeeCoin] = txb.splitCoins(usdcPrimary, [entryFeeSmallest]); // 0 split is allowed
        // Call join_room, capture (participant_id, change)
        const joinResult = txb.moveCall({
            target: this.getTarget("join_room"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(roomId),
                txb.pure(roomCode),
                entryFeeCoin,
                txb.object("0x6"), // Clock
                // ctx is implicit
            ],
        }) as unknown as [any, any];
        const [, changeCoin] = joinResult;
        if (!isSponsored) {
            txb.transferObjects([changeCoin], txb.pure(userAddress));
            await this.dryRunTransaction(txb, userAddress);
            const result = await this.client.signAndExecuteTransactionBlock({
                signer: walletKeyPair,
                transactionBlock: txb,
                options: { showEffects: true, showEvents: true },
            });

            if (result.effects?.status?.status !== "success") {
                throw new Error(`Transaction failed: ${result.effects?.status?.error || "Unknown error"}`);
            }

            return { success: true, digest: result.digest } as { success: true; digest: string };
        } else {
            txb.setSender(userAddress)
            txb.transferObjects([changeCoin], txb.pure(this.sponsorAddress));
            const kindBytes = await txb.build({
                client: this.client, onlyTransactionKind: true
            })
            const sponsoredTx = TransactionBlock.fromKind(kindBytes);
            sponsoredTx.setGasBudget(50_000_000);
            sponsoredTx.setSender(userAddress);
            sponsoredTx.setGasOwner(this.sponsorAddress);
            const buildBytes = await sponsoredTx.build({ client: this.client });
            const { signature: userSignature } = await walletKeyPair.signTransactionBlock(buildBytes);
            const { signature: sponsorSignature } = await this.sponsorKeypair.signTransactionBlock(buildBytes);
            const result = await this.client.executeTransactionBlock({
                transactionBlock: buildBytes,
                signature: [userSignature, sponsorSignature],
                options: { showEffects: true, showEvents: true },
            })
            if (result.effects?.status?.status !== "success") {
                throw new Error(`Transaction failed: ${result.effects?.status?.error || "Unknown error"}`);
            }
            return { success: true, digest: result.digest } as { success: true; digest: string };
        }
    }

    // Start a game (creator only)
    async startGame(options: { walletKeyPair: any; roomId: string }) {
        const { walletKeyPair, roomId } = options;

        const txb = new TransactionBlock();
        const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
        txb.moveCall({
            target: this.getTarget("start_game"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(roomId),
                txb.object("0x6"),
            ],
        });
        await this.dryRunTransaction(txb, userAddress);
        const result = await this.client.signAndExecuteTransactionBlock({
            signer: walletKeyPair,
            transactionBlock: txb,
            options: { showEffects: true, showEvents: true },
        });

        if (result.effects?.status?.status !== "success") {
            throw new Error(`Transaction failed: ${result.effects?.status?.error || "Unknown error"}`);
        }

        return { success: true, digest: result.digest } as { success: true; digest: string };
    }

    // Leave a room
    async leaveRoom(options: { walletKeyPair: any; roomId: string }) {
        const { walletKeyPair, roomId } = options;
        const txb = new TransactionBlock();
        const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
        const refundCoin = txb.moveCall({
            target: this.getTarget("leave_room"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(userAddress),
                txb.pure(roomId),
                txb.object("0x6"),
            ],
        });
        txb.transferObjects([refundCoin], txb.pure(userAddress));
        await this.dryRunTransaction(txb, this.sponsorAddress);
        const result = await this.client.signAndExecuteTransactionBlock({
            transactionBlock: await txb.build({ client: this.client }),
            signer: this.sponsorKeypair,
            options: { showEffects: true, showEvents: true },
        });

        if (result.effects?.status?.status !== "success") {
            throw new Error(`Transaction failed: ${result.effects?.status?.error || "Unknown error"}`);
        }

        return { success: true, digest: result.digest } as { success: true; digest: string };
    }

    // Cancel a room (creator only). Returns creator refund coin to sender.
    async cancelRoom(options: { walletKeyPair: any; roomId: string }) {
        const { walletKeyPair, roomId } = options;

        const txb = new TransactionBlock();

        const refundCoin = txb.moveCall({
            target: this.getTarget("cancel_room"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(walletKeyPair.getPublicKey().toSuiAddress()),
                txb.pure(roomId),
                txb.object("0x6"),
            ],
        }) as unknown as any;

        // Return refund coin to caller
        const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
        txb.transferObjects([refundCoin], txb.pure(userAddress));
        await this.dryRunTransaction(txb, this.sponsorAddress);

        // Prepare with sponsor paying gas first
        const result = await this.client.signAndExecuteTransactionBlock({
            transactionBlock: await txb.build({ client: this.client }),
            signer: this.sponsorKeypair,
            options: { showEffects: true, showEvents: true }
        });

        if (result.effects?.status?.status !== "success") {
            throw new Error(`Transaction failed: ${result.effects?.status?.error || "Unknown error"}`);
        }
        return { success: true, digest: result.digest };
    }

    // Complete game and distribute prizes
    async completeGame(options: {
        roomId: string;
        winnerAddresses: string[];
        scores: number[];
    }) {
        const { roomId, winnerAddresses, scores } = options;

        if (winnerAddresses.length !== scores.length) {
            throw new Error("winnerAddresses and scores must have the same length");
        }

        const txb = new TransactionBlock();
        txb.moveCall({
            target: this.getTarget("complete_game"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(roomId),
                txb.pure(winnerAddresses),
                txb.pure(scores.map((s) => BigInt(s))),
                txb.object("0x6"), // coin type, here fixed to SUI
            ],
        });
        await this.dryRunTransaction(txb, this.sponsorAddress);

        // Prepare with sponsor paying gas
        const result = await this.client.signAndExecuteTransactionBlock({
            transactionBlock: await txb.build({ client: this.client }),
            signer: this.sponsorKeypair,
            options: { showEffects: true, showEvents: true }
        });

        if (result.effects?.status?.status !== "success") {
            throw new Error(`Transaction failed: ${result.effects?.status?.error || "Unknown error"}`);
        }
        // Extract transaction effects and events for winner mapping
        const effects = result.effects;
        const events = result.events;

        // Look for GameCompleted event to get additional details
        let gameCompletedEvent = null;
        const eventType = `${this.packageId}::${this.moduleName}::GameCompleted`;
        for (const ev of events) {
            if (ev.type === eventType) {
                gameCompletedEvent = ev.parsedJson;
                break;
            }
        }
        return {
            success: true,
            digest: result.digest,
            effects,
            events,
            gameCompletedEvent
        };
    }
}