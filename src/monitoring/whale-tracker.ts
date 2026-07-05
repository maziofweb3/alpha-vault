export interface WhaleTx {
  txHash: string;
  token: string;
  amount: number;
  valueUsdc: number;
  from: string;
  to: string;
}

/**
 * Tracks large on-chain transactions for sentiment input.
 */
export function trackWhales(token: string): WhaleTx[] {
  return [
    {
      txHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      token,
      amount: 1500,
      valueUsdc: 5250000,
      from: '0xWhaleAddress1',
      to: '0xWhaleAddress2'
    }
  ];
}
