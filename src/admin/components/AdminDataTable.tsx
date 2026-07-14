import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminEmptyState } from "./AdminEmptyState";

export interface AdminColumn<T> {
  key: string;
  header: string;
  /** Hidden below md when true — column moves into card fallback on mobile. */
  hideOnMobile?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
}

interface Props<T> {
  columns: AdminColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  /** Renders the mobile card body for a row. Falls back to a summary of columns. */
  renderMobileCard?: (row: T) => ReactNode;
}

/**
 * Responsive admin table:
 * - Desktop / tablet: real <table> with optional priority-column hiding.
 * - Mobile: stacked card list built from the same columns.
 */
export function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  emptyTitle = "No records to show",
  emptyDescription = "There are no records matching the current filters.",
  onRowClick,
  renderMobileCard,
}: Props<T>) {
  if (rows.length === 0) {
    return <AdminEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-sm border border-border bg-background md:block">
        <table className="w-full text-left text-sm">
          {caption ? (
            <caption className="border-b border-border bg-cream/40 px-4 py-2 text-left text-xs text-muted-foreground">
              {caption}
            </caption>
          ) : null}
          <thead className="text-xs uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn("px-4 py-3 font-medium", c.hideOnMobile && "hidden lg:table-cell")}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border/60 align-top",
                  onRowClick && "cursor-pointer hover:bg-cream/40",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-3",
                      c.hideOnMobile && "hidden lg:table-cell",
                      c.className,
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cn(
              "rounded-sm border border-border bg-background p-4 text-sm",
              onRowClick && "cursor-pointer",
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {renderMobileCard ? (
              renderMobileCard(row)
            ) : (
              <dl className="grid gap-2">
                {columns.map((c) => (
                  <div key={c.key} className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {c.header}
                    </dt>
                    <dd className="min-w-0">{c.render(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
