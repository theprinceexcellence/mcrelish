export const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

export const discountPercent = (price: number, wasPrice?: number | undefined) =>
  wasPrice && wasPrice > price ? Math.round((1 - price / wasPrice) * 100) : 0;
