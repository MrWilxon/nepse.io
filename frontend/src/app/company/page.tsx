"use client";

import { CompanyListWidget } from "@/components/dashboard-widgets";
import { Building2 } from "lucide-react";

export default function CompaniesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-accent-theme/10 p-2.5 text-accent-theme">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary-theme tracking-tight">Companies Directory</h1>
          <p className="text-muted-theme text-sm mt-0.5">
            Browse and search all listed companies on the Nepal Stock Exchange (NEPSE).
          </p>
        </div>
      </div>

      <div className="card-3d overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
        <CompanyListWidget />
      </div>
    </div>
  );
}
