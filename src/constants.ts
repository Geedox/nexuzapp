export const NETWORK: "testnet" | "mainnet" = "mainnet";
export const POOL_IDS: Record<string, string> = {
    SUI_USDC:
        "0x6fd4915e6d8d3e2ba6d81787046eb948ae36fdfc75dad2e24f0d4aaa2417a416",
    SUI_USDT:
        "0x53d70570db4f4d8ebc20aa1b67dc6f5d061d318d371e5de50ff64525d7dd5bca",
    USDC_USDT:
        "0x4038aea2341070550e9c1f723315624c539788d0ca9212dca7eb4b36147c0fcb",
    USDC_SUI:
        "0x6fd4915e6d8d3e2ba6d81787046eb948ae36fdfc75dad2e24f0d4aaa2417a416",
    USDT_SUI:
        "0x53d70570db4f4d8ebc20aa1b67dc6f5d061d318d371e5de50ff64525d7dd5bca",
    USDT_USDC:
        "0x4038aea2341070550e9c1f723315624c539788d0ca9212dca7eb4b36147c0fcb",
};
export const COIN_TYPES: Record<string, string> = {
    "SUI": "0x2::sui::SUI",
    "USDC": "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    "USDT": "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT",
}