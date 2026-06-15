export const TYPE_LABELS: Record<string, string> = {
  MutualFund: "Mutual Fund",
  RealEstate: "Real Estate",
};

export const ASSET_TYPES = [
  "Stocks", "MutualFund", "FD", "Crypto", "RealEstate", "Gold", "Other",
] as const;

export function typeLabel(t: string): string {
  return TYPE_LABELS[t] ?? t;
}
