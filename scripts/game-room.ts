import { config } from "dotenv";
import { createKeypair, validateEnvironment } from "./game-room-tests/utils";
config();

const testFetchRoomDetails = async () => {
    const { adminKey } = validateEnvironment();
    const keypair1 = createKeypair(adminKey, "Admin Key");
    console.log(keypair1.address)
    // const roomDetails = await gameRoom.fetchRoomDetails({
    //     walletKeyPair: keypair1.keypair,
    // });
    // console.log(JSON.stringify(res, null, 2))
}

testFetchRoomDetails()