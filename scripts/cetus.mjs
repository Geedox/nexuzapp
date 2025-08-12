import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";

const NETWORK = "mainnet";
const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });
const sdk = CetusClmmSDK.createSDK({ env: NETWORK, sui_client: suiClient });
sdk.setSenderAddress("0x9247d2319df21c67bb5080741a04b803cd8d6d4aa08f3440c06eec3f319ab921");

const getPoolByCoins = async () => {
    const pool = await sdk.Pool.getPoolByCoins(['0x2::sui::SUI', '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',])
    // const pool = await sdk.Pool.getPool("0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105")
    // const pool = await sdk.Pool.getPoolsWithPage()
    console.log("All Pools:", pool);
    // const res = pool.filter((p) => {
    //     return p.coins.some((coin) => coin.coin_type_a.includes("USDC")) ||
    //         p.coins.some((coin) => coin.coin_type_b.includes("SUI"))
    // })
    // console.log("Filtered Pools:", res);
}

getPoolByCoins().catch((error) => {
    console.error("Error fetching pools:", error);
});