import { Download, FileSpreadsheet, FileText, FileBadge } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  projectId: string;
  projectName: string;
}

/**
 * Triggers browser downloads for PDF (full / summary) and CSV. Uses direct
 * window navigation so the browser handles the streamed response and the
 * filename via Content-Disposition.
 */
export function ExportMenu({ projectId, projectName }: Props) {
  function openPdf(format: "full" | "summary") {
    const url = `/api/projects/${projectId}/report.pdf?format=${format}`;
    window.open(url, "_blank", "noopener");
  }

  function downloadCsv() {
    const a = document.createElement("a");
    a.href = `/api/projects/${projectId}/report.csv`;
    a.download = `${projectName.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Download className="h-4 w-4" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Download quote</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => openPdf("full")} className="cursor-pointer">
          <FileBadge className="h-4 w-4" />
          <div className="flex flex-col">
            <span>PDF · full quote</span>
            <span className="text-[10px] text-muted-foreground">Cover, tables, cost, signatures</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openPdf("summary")} className="cursor-pointer">
          <FileText className="h-4 w-4" />
          <div className="flex flex-col">
            <span>PDF · summary</span>
            <span className="text-[10px] text-muted-foreground">Cover + totals only</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={downloadCsv} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          <div className="flex flex-col">
            <span>CSV · Excel</span>
            <span className="text-[10px] text-muted-foreground">Line items + summary rows</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
