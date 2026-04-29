import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FolderPlus, Ruler, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { useProjectsList } from "@/features/projects/api";
import { CreateProjectDialog } from "@/features/projects/CreateProjectDialog";
import { DemoProjectButton } from "@/features/projects/DemoProjectButton";
import { DashboardAnalytics } from "@/features/analytics/DashboardAnalytics";

export function DashboardPage() {
  const { user } = useAuth();
  const { data: projects, isLoading } = useProjectsList();

  const recent = projects?.slice(0, 4) ?? [];
  const total = projects?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10 space-y-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, <span className="text-primary">{user?.displayName.split(" ")[0] ?? "there"}</span>
            </h1>
            <span className="rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-xs text-muted-foreground">
              v1.0 · All 10 modules shipped
            </span>
          </div>
          <p className="mt-2 text-muted-foreground">
            Your estimation workspace — complete. Calc engine, 3D, templates, revisions, costing, PDF export, and analytics all live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DemoProjectButton variant="outline" />
          <CreateProjectDialog />
        </div>
      </div>

      <DashboardAnalytics />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent projects</CardTitle>
                <CardDescription>Jump back into a project.</CardDescription>
              </div>
              {total > 0 && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/projects">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-8 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  No projects yet. Click <strong className="text-foreground">Create demo project</strong> to spin up a
                  ready-made 2-floor residence, or start from scratch.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <DemoProjectButton />
                  <CreateProjectDialog
                    trigger={
                      <Button variant="outline">
                        <FolderPlus className="h-4 w-4" /> Start from scratch
                      </Button>
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="flex items-center justify-between rounded-md border border-border bg-card/60 px-4 py-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {p.numberOfFloors} floor{p.numberOfFloors === 1 ? "" : "s"}
                        </span>
                        <span>{p.roomCount} rooms</span>
                        <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{p.tag}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card/80 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> What's live
            </CardTitle>
            <CardDescription>Modules delivered in this build.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <Check label="1 · Foundation & design" />
              <Check label="2 · Auth, branding, defaults" />
              <Check label="3 · Project / floor / room / wall tree" />
              <Check label="4 · Shape picker + openings + presets" />
              <Check label="5 · Deterministic calc engine" />
              <Check label="6 · Live 3D visualization" />
              <Check label="7 · Templates & revision compare" />
              <Check label="8 · Cost breakdown & rate cards" />
              <Check label="9 · PDF / CSV export" />
              <Check label="10 · Dashboard analytics" />
            </ul>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link to="/profile">
                <Ruler className="h-4 w-4" /> Edit defaults
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function Check({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> <span>{label}</span>
    </li>
  );
}

