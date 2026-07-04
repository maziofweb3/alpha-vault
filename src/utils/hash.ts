import { keccak256, toUtf8Bytes } from 'ethers';

export function hashString(input: string): string {
  return keccak256(toUtf8Bytes(input));
}

export function hashArray<T extends Record<string, unknown>>(
  items: T[],
  sortKey: keyof T,
): string {
  const sorted = [...items].sort((a, b) =>
    String(a[sortKey]).localeCompare(String(b[sortKey])),
  );
  return hashString(JSON.stringify(sorted));
}
