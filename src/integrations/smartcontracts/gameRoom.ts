import { convertSplitRuleToString, Currency, TOKEN_ADDRESSES } from "@/constants";
import { logger } from "@/utils";
import { pannaClient } from "@/lib/panna";
import { gameRoomAbi } from "@/integrations/smartcontracts/abi";
import { chain, GetContractParams, GetContractResult, PannaClient, transaction, util, wallet } from "panna-sdk/core";

export type TransferCurrency = "ETH" | "LSK" | "USDC" | "USDT";

export class GameRoom {
  private client: PannaClient = pannaClient;
  private sponsorAddress: `0x${string}` = import.meta.env.VITE_SPONSOR_ADDRESS;
  private contractAddress: `0x${string}` = "0x0E82fDDAd51cc3ac12b69761C45bBCB9A2Bf3C83"
  private contractAbi = gameRoomAbi;
  private contract: GetContractResult;
  private chainNetwork: GetContractParams["chain"] = chain.liskSepolia

  constructor() {
    this.contract = transaction.getContract({
      client: this.client,
      chain: this.chainNetwork,
      address: this.contractAddress,
      abi: this.contractAbi
    })
  }



  /**
   * Transfer USDC coins from one address to another
   */
  async transfer(
    account: wallet.Account,
    toAddress: `0x${string}`,
    amount: number,
    currency: TransferCurrency
  ) {
    try {
      if (currency === "ETH") {
        const tx = transaction.prepareTransaction({
          client: this.client,
          chain: this.chainNetwork,
          to: toAddress,
          value: util.toWei(amount.toString()),
          maxFeePerGas: BigInt(30_000_000_000), // 30 gwei maximum
          maxPriorityFeePerGas: BigInt(2_000_000_000)
        });
        return await transaction.sendTransaction({ account: account, transaction: tx })
      } else {
        // Create transaction block
        const tx = transaction.prepareContractCall({
          client: this.client,
          chain: this.chainNetwork,
          address: TOKEN_ADDRESSES[currency],
          method: "function transfer(address to, uint256 amount)",
          params: [toAddress, util.toWei(amount.toString())],
          maxFeePerGas: BigInt(30_000_000_000), // 30 gwei maximum
          maxPriorityFeePerGas: BigInt(2_000_000_000)
        });
        return await transaction.sendTransaction({ account: account, transaction: tx })
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Create a new game room paying with USDC (or sponsor funding if isSponsored)
  async createGameRoom(options: {
    account: wallet.Account; // Ed25519Keypair or compatible signer
    name: string;
    gameId: string;
    entryFee: number; // in USDC units (e.g., 1.5 = $1.5)
    maxPlayers: number;
    isPrivate: boolean;
    roomCode?: string; // required if isPrivate
    isSpecial: boolean;
    isSponsored?: boolean;
    sponsorAmount?: number; // in USDC units
    winnerSplitRule: "winner_takes_all" | "top_2" | "top_3" | "top_4" | "top_5" | "top_10";
    startTimeMs: number;
    endTimeMs: number;
    currency: TransferCurrency;
  }) {
    const {
      account,
      name,
      gameId,
      entryFee,
      maxPlayers,
      isPrivate,
      roomCode = "",
      isSponsored = false,
      sponsorAmount = 0,
      isSpecial = false,
      winnerSplitRule,
      startTimeMs,
      endTimeMs,
      currency,
    } = options;

    // Determine payment amount depending on sponsorship
    const requiredPayment = isSponsored ? sponsorAmount : entryFee;
    const splitRule = convertSplitRuleToString(winnerSplitRule);

    const coinType = currency === "USDC" ? Currency.USDC : Currency.USDT;
    const txb = transaction.prepareContractCall({
      client: this.client,
      chain: this.chainNetwork,
      address: this.contract.address,
      abi: this.contract.abi,
      method: "createRoom",
      params: [{
        name,
        gameId,
        roomCode,
        entryFee,
        maxPlayers,
        sponsorAmount,
        startTime: BigInt(startTimeMs),
        endTime: BigInt(endTimeMs),
        paymentAmount: BigInt(requiredPayment),
        isSponsored,
        isPrivate,
        isSpecial,
        currency: coinType,
        winnerSplitRule: splitRule,
      }]
    });
    const result = await transaction.sendTransaction({ account: account, transaction: txb })
    return result;

  }

  // Join an existing room. Provide entryFee if required by the room (0 for sponsored rooms).
  async joinGameRoom(options: {
    isSponsored: boolean;
    account: wallet.Account; // Ed25519Keypair or compatible signer
    roomId: string;
    roomCode?: string; // empty for public rooms
    entryFee: number; // in USDC units; 0 if sponsored
    currency: TransferCurrency;
  }) {
    const { isSponsored, account, roomId, roomCode = "", currency } = options;
    const entryFee = options.isSponsored ? 0 : options.entryFee;
    const txb = transaction.prepareContractCall({
      client: this.client,
      chain: this.chainNetwork,
      address: this.contract.address,
      abi: this.contract.abi,
      method: "joinRoom",
      params: [
        roomId,
        roomCode,
      ]
    });
    const result = await transaction.sendTransaction({ account: account, transaction: txb })
    return result;

  }

  // Start a game (creator only)
  async startGame(options: { account: wallet.Account; roomId: string }) {
    const { account, roomId } = options;
    const txb = transaction.prepareContractCall({
      client: this.client,
      chain: this.chainNetwork,
      address: this.contract.address,
      abi: this.contract.abi,
      method: "startGame",
      params: [roomId]
    });
    const result = await transaction.sendTransaction({ account: account, transaction: txb })
    return result;
  }

  // Leave a room
  async leaveRoom(options: { account: wallet.Account; roomId: string }) {
    const { account, roomId } = options;
    const txb = transaction.prepareContractCall({
      client: this.client,
      chain: this.chainNetwork,
      address: this.contract.address,
      abi: this.contract.abi,
      method: "leaveRoom",
      params: [roomId]
    });
    const result = await transaction.sendTransaction({ account: account, transaction: txb })
    return result;
  }

  // Cancel a room (creator only). Returns creator refund coin to sender.
  async cancelRoom(options: { account: wallet.Account; roomId: string }) {
    const { account, roomId } = options;

    const txb = transaction.prepareContractCall({
      client: this.client,
      chain: this.chainNetwork,
      address: this.contract.address,
      abi: this.contract.abi,
      method: "cancelRoom",
      params: [roomId]
    });

    const result = await transaction.sendTransaction({ account: account, transaction: txb })
    return result;
  }

  // Complete game and distribute prizes
  async completeGame(options: {
    roomId: string;
    winnerAddresses: string[];
    scores: number[];
    currency: TransferCurrency;
  }) {
    const { account, roomId, winnerAddresses, scores, currency } = options;
    const txb = transaction.prepareContractCall({
      client: this.client,
      chain: this.chainNetwork,
      address: this.contract.address,
      abi: this.contract.abi,
      method: "completeGame",
      params: [roomId, winnerAddresses, scores.map((s) => BigInt(s))]
    });
    const result = await transaction.sendTransaction({ account: account, transaction: txb })
    return result;
  }
}