import { buildPoseidon } from "circomlibjs";

export const templateIdx = 0;

/**
 * Converts a `Uint8Array` of bytes to a hexadecimal string.
 * The bytes are reversed before conversion to hex format.
 * @param {Uint8Array} bytes - The array of bytes to convert.
 * @returns {string} A hexadecimal string representing the byte array.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes]
    .reverse()
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a random account code using the Poseidon hash function.
 * @async
 * @returns {Promise<string>} A promise that resolves to a hex string representing the generated account code.
 */
export async function genAccountCode(): Promise<string> {
  const poseidon = await buildPoseidon();
  const accountCodeBytes: Uint8Array = poseidon.F.random();
  return bytesToHex(accountCodeBytes);
}
