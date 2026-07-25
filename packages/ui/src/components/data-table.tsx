import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Thin, tokenized table primitives that apply the dense `.data-grid` pattern
 * from globals.css (sticky compact headers, 30px rows, hairline borders,
 * tabular-nums). Pair these with TanStack Table's headless model for sorting,
 * virtualization, and column sizing.
 */

export function DataTable({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto rounded-md border border-border">
      <table
        className={cn("data-grid w-full border-collapse", className)}
        {...props}
      />
    </div>
  );
}

export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TR({
  selected,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr data-selected={selected ? "true" : undefined} className={className} {...props} />
  );
}

export function TH({
  numeric,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(numeric && "text-right tabular-nums", className)}
      {...props}
    />
  );
}

export function TD({
  numeric,
  mono,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        numeric && "text-right tabular-nums",
        mono && "font-mono text-xs",
        className,
      )}
      {...props}
    />
  );
}
