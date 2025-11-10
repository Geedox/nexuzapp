import { client, EcosystemConfig, EcosystemId, util, wallet } from "panna-sdk/core";
import {
  pannaClientId,
  ecosystemPartnerId,
  NETWORK,
  PANNA_NETWORK,
  SUPPORTED_TOKENS,
  type SupportedToken,
  getTokenAddress,
} from "../constants";

if (!pannaClientId) {
  throw new Error("PANNA_CLIENT_ID is not configured");
}

export const pannaClient = client.createPannaClient({
  clientId: pannaClientId,
});

const ecosystem: EcosystemConfig = {
  id: EcosystemId.LISK,
  partnerId: ecosystemPartnerId ?? "",
};

export const ecosystemConfig = ecosystem;
export const getSupportedTokens = () =>
  SUPPORTED_TOKENS.filter(
    (token) => getTokenAddress(token) !== undefined
  ) as SupportedToken[];

export const getAccountBalance = async (address: string) => {
  if (!address) {
    throw new Error("Wallet address is required to fetch balances");
  }

  return util.accountBalance({
    client: pannaClient,
    chain: NETWORK,
    address,
  });
};

const resolveTokenAddresses = (tokens: SupportedToken[]) =>
  tokens
    .map((token) => getTokenAddress(token))
    .filter((address): address is `0x${string}` => Boolean(address));

export const getTokenBalancesInFiat = async (
  address: string,
  tokens: SupportedToken[] = [...SUPPORTED_TOKENS]
) => {
  const tokenAddresses = resolveTokenAddresses(tokens);

  if (!tokenAddresses.length) {
    return [];
  }

  return util.accountBalancesInFiat({
    client: pannaClient,
    chain: NETWORK,
    address,
    currency: util.FiatCurrency.USD,
    tokens: tokenAddresses,
  });
};

export const getTokenBalanceInFiat = async (
  address: string,
  token: SupportedToken
) => {
  const tokenAddress = getTokenAddress(token);

  if (!tokenAddress) {
    throw new Error(`Token ${token} is not supported on ${PANNA_NETWORK}`);
  }

  return util.accountBalanceInFiat({
    client: pannaClient,
    chain: NETWORK,
    address,
    tokenAddress,
  });
};

export const createAccount = () => {
  if (!ecosystem.partnerId) {
    throw new Error("ECOSYSTEM_PARTNER_ID is not configured");
  }
  return wallet.createAccount(ecosystem);
};