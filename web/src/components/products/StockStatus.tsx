import { getStockStatus } from "@/lib/products";

type StockStatusProps = {
  stock: number;
  className?: string;
};

export function StockStatus({ stock, className = "" }: StockStatusProps) {
  const status = getStockStatus(stock);

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-muted">供貨狀態：</span>
      <span
        className={`flex items-center gap-1.5 font-medium ${status.className}`}
      >
        {status.showDot ? (
          <span
            className={`h-2 w-2 rounded-full ${status.dotClassName}`}
            aria-hidden
          />
        ) : null}
        {status.label}
      </span>
    </div>
  );
}
