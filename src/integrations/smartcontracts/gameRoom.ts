import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { COIN_TYPES } from "@/constants";

export class GameRoom {
    private client: SuiClient;
    private packageId: string;
    private storeId: string;
    private readonly moduleName = "game_room";

    constructor(
        client: SuiClient,
        packageId: string = "0xead40bafc0216e37bf4d7e7856cca9cd60ac082aeb2bb5555eac676a89fb4973",
        storeId: string = "0x7ea6fc1e7de01ff2b8d93f713de2dedd84911aeebc01f7cb200cc24c927b30e0",
    ) {
        this.client = client;
        this.packageId = packageId;
        this.storeId = storeId;
    }

    private getTarget(func: string): `${string}::${string}::${string}` {
        return `${this.packageId}::${this.moduleName}::${func}` as `${string}::${string}::${string}`;
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
        txb.setGasBudget(100_000_000);

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
        txb.transferObjects([changeCoin], txb.pure(userAddress));

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
        txb.setGasBudget(30_000_000);

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
        txb.setGasBudget(60_000_000);

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
        txb.setGasBudget(40_000_000);

        txb.moveCall({
            target: this.getTarget("start_game"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(roomId),
                txb.object("0x6"),
            ],
        });

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
        txb.setGasBudget(30_000_000);

        txb.moveCall({
            target: this.getTarget("leave_room"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(roomId),
                txb.object("0x6"),
            ],
        });

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

    // Cancel a room (creator only). Returns creator refund coin to sender.
    async cancelRoom(options: { walletKeyPair: any; roomId: string }) {
        const { walletKeyPair, roomId } = options;

        const txb = new TransactionBlock();
        txb.setGasBudget(60_000_000);

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
        txb.setGasBudget(100_000_000);

        txb.moveCall({
            target: this.getTarget("complete_game"),
            arguments: [
                txb.object(this.storeId),
                txb.pure(roomId),
                txb.pure(winnerAddresses),
                txb.pure(scores.map((s) => BigInt(s))),
                txb.object("0x6"),
            ],
        });

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
}