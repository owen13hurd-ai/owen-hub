import type { PurchaseCalculatorInput, PurchaseCalculatorResult } from "./types";

function money(value: number) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

export function calculatePurchase(input: PurchaseCalculatorInput): PurchaseCalculatorResult {
  const quantity = Math.max(1, input.quantity || 1);
  const landedCost = money((input.itemPrice * quantity) + input.tax + input.shipping + input.extraFees);
  const resaleGross = money(input.estimatedResalePrice * quantity);
  const marketplaceFees = money(resaleGross * (Math.max(0, input.feesPercent) / 100));
  const netProceeds = money(resaleGross - marketplaceFees);
  const estimatedProfit = money(netProceeds - landedCost);
  const roiPercent = landedCost > 0 ? money((estimatedProfit / landedCost) * 100) : 0;
  const breakEvenUnitPrice = money((landedCost / (1 - (Math.max(0, input.feesPercent) / 100))) / quantity);

  return {
    breakEvenUnitPrice,
    estimatedProfit,
    landedCost,
    marketplaceFees,
    netProceeds,
    resaleGross,
    roiPercent,
  };
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Not set";
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(value);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
