import { ChevronRight, Coins, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { CostBreakdown as CostBreakdownT } from "@/lib/cost/types";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  cost: CostBreakdownT;
  projectId: string;
  useCustomRates: boolean;
}

export function CostBreakdown({ cost, useCustomRates }: Props) {
  if (!cost.hasAnyRates) {
    return (
      <div className="rounded-md border border-dashed border-border p-5 text-sm space-y-3">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">No rates configured</span>
        </div>
        <p className="text-muted-foreground text-xs">
          Add prices in your profile's <strong className="text-foreground">Rates</strong> tab to see a cost
          breakdown. The calc quantities above are always accurate regardless of rates.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/profile">
            Set up rates <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Cost breakdown</h3>
        </div>
        <Badge variant={useCustomRates ? "warning" : "secondary"} className="text-[10px]">
          {useCustomRates ? "Project rates" : "User default rates"}
        </Badge>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pl-4 pr-2 text-left font-medium">Line item</th>
              <th className="py-2 px-2 text-right font-medium">Qty</th>
              <th className="py-2 px-2 text-right font-medium">Unit rate</th>
              <th className="py-2 pr-4 pl-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {cost.lines.map((l) => (
              <tr key={l.label} className={cn("border-t border-border/40", l.total === 0 && "opacity-60")}>
                <td className="py-2 pl-4 pr-2">{l.label}</td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {formatNumber(l.quantity, l.label.startsWith("Cement") ? 1 : 0)} <span className="text-[10px] text-muted-foreground">{l.unit}</span>
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                  {formatMoney(l.unitPrice, cost.currency)}
                </td>
                <td className="py-2 pr-4 pl-2 text-right tabular-nums font-medium">
                  {formatMoney(l.total, cost.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border">
            <tr>
              <td className="py-2 pl-4 pr-2 text-right text-xs uppercase tracking-wider text-muted-foreground" colSpan={3}>
                Materials subtotal
              </td>
              <td className="py-2 pr-4 pl-2 text-right tabular-nums font-medium">
                {formatMoney(cost.materialsSubtotal, cost.currency)}
              </td>
            </tr>
            {cost.laborTotal > 0 && (
              <tr>
                <td className="py-1.5 pl-4 pr-2 text-right text-xs text-muted-foreground" colSpan={3}>
                  Labor (~{formatNumber(cost.laborDays, 1)} mason-days)
                </td>
                <td className="py-1.5 pr-4 pl-2 text-right tabular-nums">
                  {formatMoney(cost.laborTotal, cost.currency)}
                </td>
              </tr>
            )}
            {cost.taxAmount > 0 && (
              <tr>
                <td className="py-1.5 pl-4 pr-2 text-right text-xs text-muted-foreground" colSpan={3}>
                  Tax ({cost.taxPct}%)
                </td>
                <td className="py-1.5 pr-4 pl-2 text-right tabular-nums">
                  {formatMoney(cost.taxAmount, cost.currency)}
                </td>
              </tr>
            )}
            <tr className="bg-primary/10">
              <td className="py-2.5 pl-4 pr-2 text-right text-xs font-semibold uppercase tracking-wider text-primary" colSpan={3}>
                <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> Grand total</span>
              </td>
              <td className="py-2.5 pr-4 pl-2 text-right tabular-nums font-bold text-primary text-base">
                {formatMoney(cost.grandTotal, cost.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
