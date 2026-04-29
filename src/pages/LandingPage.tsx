import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, Calculator, FileBadge, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { HealthPill } from "@/components/layout/HealthPill";
import { useAuth } from "@/features/auth/useAuth";

const features = [
  {
    icon: LayoutGrid,
    title: "Hierarchical modeling",
    desc: "Projects → Floors → Rooms → Walls. Add rectangular, L-shaped, and circular rooms with door/window deductions.",
  },
  {
    icon: Calculator,
    title: "Deterministic calc engine",
    desc: "Bricks, cement bags, sand, aggregate — derived from volume, mortar ratio, and configurable wastage.",
  },
  {
    icon: Boxes,
    title: "Live 3D visualization",
    desc: "A Three.js wireframe rebuilds as you type. Heatmap mode highlights the heaviest walls at a glance.",
  },
  {
    icon: FileBadge,
    title: "Branded PDF quotes",
    desc: "One-click professional quotations with your logo, plus CSV exports for Excel.",
  },
];

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-blueprint">
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <Logo />
        <div className="flex items-center gap-3">
          <HealthPill />
          {user ? (
            <Button asChild>
              <Link to="/dashboard">
                Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-20 lg:px-10 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            StructuraCore AI · v0.1 · Module 1 + 2 online
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            High-precision material estimation
            <span className="block text-primary">for modern construction.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Model buildings hierarchically, deduct openings automatically, and generate branded quotes in seconds —
            all backed by a deterministic, unit-tested calculation engine.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Open dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/register">
                    Create free account <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">I already have an account</Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card/60 backdrop-blur p-5 hover:border-primary/40 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-border/60 px-6 py-4 text-xs text-muted-foreground lg:px-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span>© {new Date().getFullYear()} StructuraCore AI</span>
          <span>Built with React 19 · Express 5 · MongoDB</span>
        </div>
      </footer>
    </div>
  );
}
