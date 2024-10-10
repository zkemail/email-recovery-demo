/**
 * Retrieves the safe account address. If a burner wallet configuration is found in local storage,
 * it returns the burner wallet address. Otherwise, it returns the current user's account address.
 * @returns {string | undefined} The burner wallet address if present in local storage,
 * or the current user's account address.
 */
export const useGetSafeAccountAddress = (): string | undefined => {
  const burnerWalletConfig = localStorage.getItem("burnerWalletConfig");

  if (burnerWalletConfig) {
    return JSON.parse(burnerWalletConfig).burnerWalletAddress;
  }
};
