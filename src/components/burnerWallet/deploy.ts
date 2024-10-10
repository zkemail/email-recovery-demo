import "viem/window";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import {
  createPimlicoBundlerClient,
  //   createPimlicoPaymasterClient,
} from "permissionless/clients/pimlico";
import {
  Address,
  createWalletClient,
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
  parseEther,
  publicActions,
  WalletClient,
} from "viem";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import {
  universalEmailRecoveryModule,
} from "../../../contracts.base-sepolia.json";

export const publicClient = createPublicClient({
  transport: http("https://sepolia.base.org"),
});

export const pimlicoBundlerClient = createPimlicoBundlerClient({
  transport: http(
    `https://api.pimlico.io/v2/base-sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`
  ),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});

/**
 * Executes a series of operations to configure a smart account, including transferring Ether,
 * setting up recovery modules, and installing modules using a smart account client.
 *
 * @async
 * @param {WalletClient} client - The wallet client used for transactions and interactions.
 * @param {object} safeAccount - The smart account object containing the address of the account.
 * @param {object} smartAccountClient - The safe account client
 * @param {string} guardianAddr - The address of the guardian used in the recovery module.
 * @returns {Promise<string>} The address of the configured smart account.
 */
export async function run(
  client: WalletClient,
  safeAccount: object,
  smartAccountClient: object,
  guardianAddr: string
) {
  // Universal Email Recovery Module with
  // ECDSAOwnedDKIMRegistry
  // Verifier
  // EmailAuth
  // EmailRecoveryCommandHandler
  const universalEmailRecoveryModuleAddress: `0x${string}` =
    universalEmailRecoveryModule as `0x${string}`;

  const addresses = await window.ethereum.request({
    method: "eth_requestAccounts",
  }); // Cast the result to string[]
  const [address] = addresses;

  const PRIVATE_KEY = import.meta.env.VITE_VAULT_PRIVATE_KEY as Address;
  const QUICKNODE_ENDPOINT =
    `https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}` as string;

  // In the below if block, we are sending ETHs to the user so that they can test the flow without spending their own ETHs
  if (PRIVATE_KEY) {
    // Convert the private key to an account object
    const vaultAccount = privateKeyToAccount(PRIVATE_KEY);
    // Create a wallet client with the specified account, chain, and HTTP transport
    const walletClient = createWalletClient({
      vaultAccount,
      chain: baseSepolia,
      transport: http(QUICKNODE_ENDPOINT),
    }).extend(publicActions);

    const ethAmount = parseEther("0.0004"); // Doing a bit extra to cover gas costs failure

    // Send the transaction to the resolved ENS address
    await walletClient.sendTransaction({
      account: vaultAccount,
      to: address,
      value: ethAmount,
    });
  }

  // generate hash
  await client.sendTransaction({
    to: safeAccount.address,
    value: parseEther("0.0003"),
  });

  // txHash
  await smartAccountClient.sendTransaction({
    to: address,
    value: parseEther("0.00001"),
  });

  // Convert Uint8Array to hex string without using Buffer
  const toHexString = (bytes) =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");

  const account: `0x${string}` = safeAccount.address as `0x${string}`;
  const isInstalledContext = new Uint8Array([0]);
  const functionSelector = keccak256(
    new TextEncoder().encode("swapOwner(address,address,address)")
  ).slice(0, 10);
  const guardians = [guardianAddr];
  const guardianWeights = [1];
  const threshold = 1;
  const delay = 0; // seconds
  const expiry = 2 * 7 * 24 * 60 * 60; // 2 weeks in seconds

  const callData = encodeAbiParameters(
    parseAbiParameters(
      "address, bytes, bytes4, address[], uint256[], uint256, uint256, uint256"
    ),
    [
      account,
      isInstalledContext instanceof Uint8Array
        ? `0x${toHexString(isInstalledContext)}`
        : isInstalledContext, // Convert Uint8Array to hex string if necessary
      functionSelector as `0x${string}`, // Assuming `functionSelector` is already a string
      guardians as `0x${string}`[], // Ensure each `guardian` address is a string
      guardianWeights, // Convert `guardianWeights` to strings
      threshold.toString(),
      delay.toString(),
      expiry.toString(),
    ]
  );

  // acceptanceSubjectTemplates -> [["Accept", "guardian", "request", "for", "{ethAddr}"]]
  // recoverySubjectTemplates -> [["Recover", "account", "{ethAddr}", "using", "recovery", "hash", "{string}"]]
  const opHash = await smartAccountClient.installModule({
    type: "executor",
    address: universalEmailRecoveryModuleAddress,
    context: callData,
  });
  console.log("opHash", opHash);

  // receipt
  await pimlicoBundlerClient.waitForUserOperationReceipt({
    hash: opHash,
  });

  return account;
}
