"use client";

import { FileX, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: any;
  action?: { label: string; href: string };
}

export default function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-kbd-theme flex items-center justify-center mb-4">
        {Icon ? <Icon className="h-7 w-7 text-muted-theme" /> : <FileX className="h-7 w-7 text-muted-theme" />}
      </div>
      <h3 className="text-sm font-bold text-primary-theme mb-1">{title}</h3>
      <p className="text-xs text-muted-theme max-w-xs mb-4">{description}</p>
      {action && (
        <Link href={action.href} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-accent-theme text-primary-theme text-xs font-medium hover:bg-accent-theme transition-colors">
          {action.label} <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
