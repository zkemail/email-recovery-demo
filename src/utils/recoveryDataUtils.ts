import { AbiCoder } from "ethers";
import { encodeFunctionData } from "viem";
import { safeAbi as safeAbi } from "../abi/Safe.ts";
/**
 * Encodes the recovery data using the validator address and recovery call data.
 * @param {string} validator - The address of the validator.
 * @param {string} recoveryCalldata - The encoded function data for recovery.
 * @returns {string} The encoded recovery data as a string.
 */
export const getRecoveryData = (
  validator: string,
  recoveryCalldata: string
): string => {
  const defaultAbiCoder = AbiCoder.defaultAbiCoder();
  return defaultAbiCoder.encode(
    ["address", "bytes"],
    [validator, recoveryCalldata]
  );
};

/**
 * Generates the recoveryCallData for changing the owner of a contract.
 * @param {string} prevOwner - The address of the previous owner.
 * @param {string} oldOwner - The address of the old owner.
 * @param {string} newOwner - The address of the new owner.
 * @returns {string} The recoveryCallData for the ownership change.
 */
export const getRecoveryCallData = (
  prevOwner: `0x${string}`,
  oldOwner: `0x${string}`,
  newOwner: `0x${string}`
): string => {
  return encodeFunctionData({
    abi: safeAbi,
    functionName: "swapOwner",
    args: [prevOwner, oldOwner, newOwner],
  });
};

export function getPreviousOwnerInLinkedList(
  oldOwner: `0x${string}`,
  safeOwners: `0x${string}`[]
): `0x${string}` {
  const owners: `0x${string}`[] = safeOwners as `0x${string}`[];
  const length: number = owners.length;

  let oldOwnerIndex: number = -1;
  for (let i = 0; i < length; i++) {
    if (owners[i] === oldOwner) {
      oldOwnerIndex = i;
      break;
    }
  }

  const sentinelOwner: `0x${string}` =
    "0x0000000000000000000000000000000000000001";
  return oldOwnerIndex === 0 ? sentinelOwner : owners[oldOwnerIndex - 1];
}

// TIME_UNITS is an object that defines various time units.
// Each unit includes:
// - value: A string identifier for the unit.
// - multiplier: The number of seconds equivalent to the unit.
// - label: A human-readable label for display purposes.
// This structure allows for easy conversion between different time units.
export const TIME_UNITS = {
  SECS: {
    value: "SECS",
    multiplier: 1,
    label: "Secs",
  },
  MINS: {
    value: "MINS",
    multiplier: 60,
    label: "Mins",
  },
  HOURS: {
    value: "HOURS",
    multiplier: 60 * 60,
    label: "Hours",
  },
  DAYS: {
    value: "DAYS",
    multiplier: 60 * 60 * 24,
    label: "Days",
  },
};
