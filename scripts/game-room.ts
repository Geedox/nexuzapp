import { GameRoom } from "../src/integrations/smartcontracts/gameRoom";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/cryptography";

import { config } from "dotenv";
import { createKeypair, createSuiClient, validateEnvironment } from "./game-room-tests/utils";
config();

const testFetchRoomDetails = async () => {
    const client = createSuiClient()
    const { key1 } = validateEnvironment();
    const keypair1 = createKeypair(key1, "Key 1 (Creator)");
    const gameRoom = new GameRoom(client);
    // const roomDetails = await gameRoom.fetchRoomDetails({
    //     walletKeyPair: keypair1.keypair,
    // });
    const res = await gameRoom.completeGame({
        roomId: "0xe9d99d6cf01f125a6628844f03a4974ae917f4d76949936a2e1fed2ff8f7ad4d",
        winnerAddresses: [],
        scores: [],

    })
    console.log(JSON.stringify(res, null, 2))
}

testFetchRoomDetails()