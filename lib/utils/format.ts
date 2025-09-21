import { isAddress } from "viem";
import * as jose from "jose";

export const formatNumber = (num: number, decimalPlaces?: number) => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatTokenAmount = (amount: number, decimalPlaces: number = 2) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);
};

export const formatValue = (key: string, value: any): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  // Convert to string for non-numeric values
  if (typeof value !== "number") {
    return String(value);
  }

  // Smart formatting based on key names
  const lowerKey = key.toLowerCase();
  
  if (lowerKey.includes("usd") || lowerKey.includes("balance") && lowerKey.includes("total")) {
    return formatCurrency(value);
  }
  
  if (lowerKey.includes("amount") || lowerKey.includes("balance")) {
    return formatTokenAmount(value);
  }
  
  if (lowerKey.includes("count")) {
    return formatNumber(value, 0);
  }
  
  // Default number formatting with appropriate decimal places
  return formatNumber(value, value % 1 === 0 ? 0 : 2);
};

export const formatAddress = (address: string) => {
  if (!isAddress(address)) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatKey = (key: string, isTestAddress?: boolean) => {
  if (key === "address" && isTestAddress) {
    return "Test Address";
  }
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const getNameFromAccessToken = (accessToken: string | null) => {
  try {
    const name: string | null = accessToken
      ? jose.decodeJwt(accessToken)["name"] as string
      : null;

    if (name && isAddress(name)) {
      return formatAddress(name);
    }
    return name;
  } catch {
    return null;
  }
};
