import { CetusClmmSDK, Pool } from "@cetusprotocol/sui-clmm-sdk";
import { GameTokenManager } from "./smartcontracts/gameToken.js";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";

type SwapResult = {
  pool_address: string;
  estimated_amount_in: string;
  estimated_amount_out: any;
  estimated_end_sqrt_price: any;
  estimated_start_sqrt_price: any;
  estimated_fee_amount: any;
  is_exceed: any;
  amount: string;
  a2b: boolean;
  by_amount_in: boolean;
}

export class Swap {
  sdk: CetusClmmSDK;
  gameTokenManager: GameTokenManager;
  public poolIds: string[] = []
  public pools: Pool[] = [];
  public coinTypes: Record<string, string> = {
    "SUI": "0x2::sui::SUI",
    "USDC": '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    "USDT": '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT',

  };
  private a2b: boolean = true
  private signer: any;

  constructor(sdk: CetusClmmSDK, gameTokenManager: GameTokenManager, signer: Ed25519Keypair) {
    this.sdk = sdk;
    this.gameTokenManager = gameTokenManager;
    this.signer = signer;
  }

  async getPoolDetails(coinTypeA: string, coinTypeB: string): Promise<Pool[]> {
    try {
      if (!this.coinTypes[coinTypeA] || !this.coinTypes[coinTypeB]) throw new Error("Invalid coin types provided");
      const poolDetails = await this.sdk.Pool.getPoolByCoins([coinTypeA, coinTypeB]);
      const finalPoolDetails = poolDetails.filter(pool => {
        return (pool.coin_type_a === this.coinTypes[coinTypeA] && pool.coin_type_b === this.coinTypes[coinTypeB]) ||
          (pool.coin_type_a === this.coinTypes[coinTypeB] && pool.coin_type_b === this.coinTypes[coinTypeA]);
      })
      this.pools = finalPoolDetails;
      return finalPoolDetails;
    } catch (error) {
      console.error("Error fetching pool details:", error);
      throw error;
    }
  }

  async calculateSwapRates(coinTypeA: string, coinTypeB: string, amount: number): Promise<SwapResult> {
    if (coinTypeA === "SUI") this.a2b = false;
    else this.a2b = true;
    try {
      const poolIds = this.pools.map(pool => pool.id);
      if (poolIds.length === 0) throw new Error("No pools found for the provided coin types");
      const swapResult = await this.sdk.Swap.preSwapWithMultiPool({
        pool_ids: poolIds,
        coin_type_a: this.coinTypes[coinTypeA],
        coin_type_b: this.coinTypes[coinTypeB],
        amount: amount.toString(),
        a2b: this.a2b,
        by_amount_in: true
      });
      return swapResult
    } catch (error) {
      console.error("Error calculating swap rates:", error);
      throw error;
    }

  }

  async swap(coinTypeA: string, coinTypeB: string, amount: number, preSwapResult: SwapResult) {
    try {
      if (!this.coinTypes[coinTypeA] || !this.coinTypes[coinTypeB]) throw new Error("Invalid coin types provided");
      // build swap payload
      const swapPayload = await this.sdk.Swap.createSwapPayload({
        pool_id: preSwapResult.pool_address,
        coin_type_a: this.coinTypes[coinTypeA],
        coin_type_b: this.coinTypes[coinTypeB],
        a2b: this.a2b,
        by_amount_in: true,
        amount: preSwapResult.amount.toString(),
        amount_limit: (Number(preSwapResult.estimated_amount_in) * (1 - Math.round(amount / Number(preSwapResult.estimated_amount_in)))).toString(),
      })

      const swap = await this.sdk.FullClient.sendTransaction(this.signer, swapPayload)

      return swap;
    } catch (error) {
      console.error("Error executing swap:", error);
      throw error;
    }
  }

}
// steps to swap
// 1. Get pools by coins
// 2. Get pool details
// 3. Calculate swap result
// 4. Execute swap transaction
// 5. Handle transaction confirmation and errors