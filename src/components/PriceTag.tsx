import { cn } from "@/lib/utils";
import { discountPercent, formatNaira } from "@/lib/format";

export function PriceTag({
  price,
  wasPrice,
  showBadge = true,
  className,
}: {
  price: number;
  wasPrice?: number | undefined;
  showBadge?: boolean;
  className?: string;
}) {
  const percent = discountPercent(price, wasPrice);
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span className="whitespace-nowrap">{formatNaira(price)}</span>
      {percent > 0 && wasPrice && (
        <s className="whitespace-nowrap text-[0.8em] font-medium opacity-60">
          <span className="sr-only">Was </span>
          {formatNaira(wasPrice)}
        </s>
      )}
      {percent > 0 && showBadge && (
        <span className="whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
          {percent}% OFF
        </span>
      )}
    </span>
  );
}
