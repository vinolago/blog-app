"use client";

import { NavLink } from "react-router-dom";
import { Home, FileText, Folder, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Overview", path: "/dashboard", icon: Home },
  { name: "Posts", path: "/dashboard/posts", icon: FileText },
  { name: "Categories", path: "/dashboard/categories", icon: Folder },
  { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-background border-r border-border h-screen p-4 space-y-4">
      <div className="text-2xl font-bold tracking-tight mb-6">
        Blog Admin
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )
              }
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
