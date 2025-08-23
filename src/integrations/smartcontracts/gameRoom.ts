import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { COIN_TYPES } from "@/constants";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";

export class GameRoom {
    private client: SuiClient;
    private packageId: string;
    private storeId: string;
    private readonly moduleName = "game_room";
    private sponsorKeypair: Ed25519Keypair;
    private sponsorAddress: string;

    constructor(
        client: SuiClient,
        packageId: string = "0x337d95edf239319e079fae6472e998301775a1d3587e3e9d590f906f0ef1c58c",
        storeId: string = "0xe2661d90a781fc3b6036c12f8c277b098401ffb688f1212b596334034798189a",
    ) {
        this.client = client;
        this.packageId = packageId;
        this.storeId = storeId;
        const sponsorPrivateKey = import.meta.env.VITE_PRIVATE_KEY;
        if (!sponsorPrivateKey) {
            throw new Error("Sponsor private key is not set");
        }
        this.sponsorKeypair = this.getWalletKeypair(sponsorPrivateKey);
        this.sponsorAddress = this.sponsorKeypair?.getPublicKey().toSuiAddress();
    }

    private getWalletKeypair = (privateKey: string): Ed25519Keypair | null => {
        try {
            const hex = privateKey;
            if (!hex || typeof hex !== "string" || hex.length < 64) return null;
            const bytes = new Uint8Array(32);
            for (let i = 0; i < 32; i++) {
                bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
            }
            return Ed25519Keypair.fromSecretKey(bytes);
        } catch (e) {
            console.warn("Unable to derive wallet keypair for on-chain ops:", e);
            return null;
        }
    };

    private async getSponsorGasObject(minBalance: bigint = 5_000_000n) {
        const coins = await this.client.getCoins({ owner: this.sponsorAddress });
        console.log("sponsorAddress => ", this.sponsorAddress);
        const coin = coins.data.find(c => BigInt(c.balance) > minBalance);
        if (!coin) throw new Error("Sponsor has no coin for gas");
        return {
            objectId: coin.coinObjectId,
            version: coin.version,
            digest: coin.digest
        };
    }

    private async prepareSponsoredExecution(txb: TransactionBlock, userKeypair: any) {
        const userAddress = userKeypair.getPublicKey().toSuiAddress();
        txb.setSender(userAddress);

        // Set sponsor as gas owner
        txb.setGasOwner(this.sponsorAddress);

        // Attach sponsor’s gas payment
        const gasCoin = await this.getSponsorGasObject();
        txb.setGasPayment([gasCoin]);
        txb.setGasBudget(50_000_000); // could refine with dryRun if you want
        const txbBytes = await txb.build({ client: this.client });
        // Sign with both
        const userSig = await userKeypair.signTransactionBlock(txb);
        const sponsorSig = await this.sponsorKeypair.signTransactionBlock(txbBytes);

        return { txb, signatures: [userSig, sponsorSig] };
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
        console.log("userAddress in createGameRoom => ", userAddress);
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
        const result = await this.client.signAndExecuteTransactionBlock({
            signer: walletKeyPair,
            transactionBlock: txb,
            options: { showEffects: true, showEvents: true },
        });

        const roomDetails = txb.moveCall({
            target: this.getTarget("fetch_room"),
            arguments: [txb.object(this.storeId), txb.pure(roomId)],
        }) as unknown as any;

        return { success: true, digest: result.digest, roomDetails } as { success: true; digest: string; roomDetails: any };
    }

    // Join an existing room. Provide entryFee if required by the room (0 for sponsored rooms).
    async joinGameRoom(options: {
        walletKeyPair: any; // Ed25519Keypair or compatible signer
        roomId: string;
        roomCode?: string; // empty for public rooms
        entryFee: number; // in USDC units; 0 if sponsored
    }) {
        const { walletKeyPair, roomId, roomCode = "", entryFee } = options;

        const txb = new TransactionBlock();
        const userAddress = walletKeyPair.getPublicKey().toSuiAddress();

        const usdcDecimals = 6;
        const entryFeeSmallest = this.toU64SmallestUnits(entryFee, usdcDecimals);

        // Prepare USDC entry fee coin (may be 0 for sponsored rooms)
        const usdcCoins = await this.client.getCoins({ owner: userAddress, coinType: COIN_TYPES.USDC });
        if (usdcCoins.data.length === 0) {
            if (entryFeeSmallest === 0) {
                throw new Error("Joining sponsored rooms requires at least one USDC coin to create a 0-value coin. Please hold a tiny amount of USDC.");
            }
            throw new Error("No USDC coins found in wallet to pay entry fee.");
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
        txb.moveCall({
            target: this.getTarget("leave_room"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(roomId),
                txb.object("0x6"),
            ],
        });
        const { txb: signedTxb, signatures } = await this.prepareSponsoredExecution(txb, walletKeyPair);
        await this.dryRunTransaction(txb, userAddress);
        const result = await this.client.executeTransactionBlock({
            transactionBlock: await signedTxb.build({ client: this.client }),
            signature: signatures,
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
                txb.pure(roomId),
                txb.object("0x6"),
            ],
        }) as unknown as any;

        // Return refund coin to caller
        const userAddress = walletKeyPair.getPublicKey().toSuiAddress();
        txb.transferObjects([refundCoin], txb.pure(userAddress));
        await this.dryRunTransaction(txb, userAddress);
        const { txb: signedTxb, signatures } = await this.prepareSponsoredExecution(txb, walletKeyPair);

        const result = await this.client.executeTransactionBlock({
            transactionBlock: await signedTxb.build({ client: this.client }),
            signature: signatures,
            options: { showEffects: true, showEvents: true }
        });

        if (result.effects?.status?.status !== "success") {
            throw new Error(`Transaction failed: ${result.effects?.status?.error || "Unknown error"}`);
        }
        return { success: true, digest: result.digest };
    }

    // Complete game and distribute prizes
    async completeGame(options: {
        walletKeyPair: any;
        roomId: string;
        winnerAddresses: string[];
        scores: number[];
    }) {
        const { walletKeyPair, roomId, winnerAddresses, scores } = options;

        if (winnerAddresses.length !== scores.length) {
            throw new Error("winnerAddresses and scores must have the same length");
        }

        const txb = new TransactionBlock();
        const userAddress = walletKeyPair.getPublicKey().toSuiAddress();

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

        // Prepare with sponsor paying gas
        const { txb: signedTxb, signatures } = await this.prepareSponsoredExecution(txb, walletKeyPair);

        const result = await this.client.executeTransactionBlock({
            transactionBlock: await signedTxb.build({ client: this.client }),
            signature: signatures,
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