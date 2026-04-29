import type { Floor, Project, Room, Wall } from "@/features/projects/types";
import type { LiveEstimateResult } from "@/lib/calc/estimate";
import { formatBricks, formatFt3, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  live: LiveEstimateResult;
  project: Project;
  floors: Floor[];
  rooms: Room[];
  walls: Wall[];
}

export function MaterialsTable({ live, floors, rooms, walls }: Props) {
  const byWall = new Map(live.perWall.map((w) => [w.wallId, w]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground text-left">
            <th className="py-2 pr-3 font-medium">Floor / Room / Wall</th>
            <th className="py-2 px-3 font-medium text-right">Gross ft³</th>
            <th className="py-2 px-3 font-medium text-right">Openings ft³</th>
            <th className="py-2 px-3 font-medium text-right">Net ft³</th>
            <th className="py-2 pl-3 font-medium text-right">Bricks</th>
          </tr>
        </thead>
        {floors.map((f) => {
          const floorRooms = rooms.filter((r) => r.floorId === f.id);
          if (floorRooms.length === 0) return null;

          const floorTotal = { gross: 0, openings: 0, net: 0, bricks: 0 };
          const rows: React.ReactNode[] = [];

          rows.push(
            <tr key={`${f.id}-h`} className="bg-secondary/40 font-medium">
              <td className="py-1.5 pr-3" colSpan={5}>
                {f.label || `Floor ${f.index}`}
              </td>
            </tr>,
          );

          for (const r of floorRooms) {
            const roomWalls = walls.filter((w) => w.roomId === r.id);
            const roomTotal = roomWalls.reduce(
              (acc, w) => {
                const result = byWall.get(w.id);
                if (!result) return acc;
                acc.gross += result.grossFt3;
                acc.openings += result.openingsFt3;
                acc.net += result.netFt3;
                acc.bricks += result.bricks;
                return acc;
              },
              { gross: 0, openings: 0, net: 0, bricks: 0 },
            );
            floorTotal.gross += roomTotal.gross;
            floorTotal.openings += roomTotal.openings;
            floorTotal.net += roomTotal.net;
            floorTotal.bricks += roomTotal.bricks;

            rows.push(
              <tr key={r.id} className="border-b border-border/30">
                <td className="py-1.5 pr-3 pl-4 text-muted-foreground">↳ {r.name}</td>
                <td className="py-1.5 px-3 text-right tabular-nums">{formatNumber(roomTotal.gross, 1)}</td>
                <td className="py-1.5 px-3 text-right tabular-nums">{formatNumber(roomTotal.openings, 1)}</td>
                <td className="py-1.5 px-3 text-right tabular-nums font-medium">{formatNumber(roomTotal.net, 1)}</td>
                <td className="py-1.5 pl-3 text-right tabular-nums font-medium">{formatBricks(roomTotal.bricks)}</td>
              </tr>,
            );
            for (const w of roomWalls) {
              const result = byWall.get(w.id);
              if (!result) continue;
              rows.push(
                <tr key={w.id} className="text-xs text-muted-foreground">
                  <td className="py-1 pr-3 pl-8">
                    · {w.label || "Wall"}{" "}
                    <span className="opacity-60">
                      ({w.lengthFt.toFixed(1)}ft × {w.heightFt.toFixed(1)}ft)
                    </span>
                  </td>
                  <td className="py-1 px-3 text-right tabular-nums">{result.grossFt3.toFixed(1)}</td>
                  <td className={cn("py-1 px-3 text-right tabular-nums", result.openingsFt3 > 0 && "text-amber-400")}>
                    {result.openingsFt3.toFixed(1)}
                  </td>
                  <td className="py-1 px-3 text-right tabular-nums">{result.netFt3.toFixed(1)}</td>
                  <td className="py-1 pl-3 text-right tabular-nums">{Math.ceil(result.bricks)}</td>
                </tr>,
              );
            }
          }

          rows.push(
            <tr key={`${f.id}-t`} className="border-b-2 border-border text-xs font-semibold text-foreground">
              <td className="py-1.5 pr-3 text-right text-muted-foreground uppercase tracking-wider">
                Floor total
              </td>
              <td className="py-1.5 px-3 text-right tabular-nums">{formatNumber(floorTotal.gross, 1)}</td>
              <td className="py-1.5 px-3 text-right tabular-nums">{formatNumber(floorTotal.openings, 1)}</td>
              <td className="py-1.5 px-3 text-right tabular-nums text-primary">{formatNumber(floorTotal.net, 1)}</td>
              <td className="py-1.5 pl-3 text-right tabular-nums text-primary">{formatBricks(floorTotal.bricks)}</td>
            </tr>,
          );

          return <tbody key={f.id}>{rows}</tbody>;
        })}
        <tfoot>
          <tr className="font-semibold">
            <td className="py-2 pr-3 uppercase tracking-wider text-xs text-muted-foreground">Grand total (before wastage)</td>
            <td className="py-2 px-3 text-right tabular-nums">{formatFt3(live.totals.netVolumeFt3, 1).replace(" ft³", "")}</td>
            <td className="py-2 px-3 text-right tabular-nums" />
            <td className="py-2 px-3 text-right tabular-nums text-primary">{formatFt3(live.totals.netVolumeFt3, 1).replace(" ft³", "")}</td>
            <td className="py-2 pl-3 text-right tabular-nums text-primary">{formatBricks(live.totals.bricks)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
