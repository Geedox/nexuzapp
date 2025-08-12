import { SuiClient } from "@mysten/sui.js/client";

export class GameRoom {
    private client: SuiClient;
    private contractAddress: string;

    constructor(client: SuiClient, contractAddress: string) {
        this.client = client;
        this.contractAddress = contractAddress;
    }


    async sendFundsToGameRoom(
        amount: number,
        currency: 'SUI' | 'USDC' | 'USDT'
    ) {
        console.log(`Sending ${amount} ${currency} to game room at ${this.contractAddress}`);
    }

    // Method to create a new game room
    async createGameRoom(owner: string, gameId: string, betAmount: number) {

    }

    // Method to join an existing game room
    async joinGameRoom(roomId: string, player: string) {

    }
}