import { ethers } from 'ethers';

/**
 * Helper to build transaction objects.
 */
export function buildSwapTransaction(
  tokenAddress: string,
  amount: bigint,
  recipient: string,
) {
  // Return standard transaction object structure
  return {
    to: tokenAddress,
    data: '0xa9059cbb' + ethers.zeroPadValue(recipient, 32).slice(2) + ethers.zeroPadValue(ethers.toBeHex(amount), 32).slice(2),
    value: '0x00',
  };
}
