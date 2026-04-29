import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Boxes,
  FileText,
  Settings2,
  History,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
};

const nav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/templates", label: "Templates", icon: Boxes },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/history", label: "History", icon: History },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/50 backdrop-blur lg:flex lg:flex-col">
      <div className="flex h-16 items-center px-5 border-b border-border">
        <Logo />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, label, icon: Icon, disabled }) =>
          disabled ? (
            <div
              key={to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed select-none"
              title="Coming soon"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              <span className="ml-auto text-[10px] rounded bg-secondary px-1.5 py-0.5 uppercase tracking-wide">
                soon
              </span>
            </div>
          ) : (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ),
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground/80 hover:bg-secondary hover:text-foreground",
            )
          }
        >
          <Settings2 className="h-4 w-4" />
          <span>Profile & Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
