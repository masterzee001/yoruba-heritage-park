import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminEmptyState } from "./AdminEmptyState";

export interface AdminColumn<T> {
  key: string;
  header: string;
  /** Hidden below lg when true — column moves into card fallback on mobile. */
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

function activationKey<E extends KeyboardEvent>(e: E, handler: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handler();
  }
}

/**
 * Responsive admin table:
 * - Desktop / tablet: real <table> with optional priority-column hiding.
 * - Mobile: stacked card list built from the same columns.
 *
 * Clickable rows are keyboard-activated via Enter / Space with a visible
 * focus ring, so the table works without a pointer.
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
      <div className="hidden overflow-x-auto rounded-sm border border-border bg-background shadow-[0_1px_0_rgba(0,0,0,0.02)] md:block">
        <table className="w-full text-left text-sm">
          {caption ? (
            <caption className="sr-only">{caption}</caption>
          ) : null}
          <thead className="bg-cream/50 text-[11px] uppercase tracking-widest text-muted-foreground">
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
            {rows.map((row, index) => {
              const clickable = Boolean(onRowClick);
              const handleClick = clickable ? () => onRowClick!(row) : undefined;
              return (
                <tr
                  key={rowKey(row)}
                  onClick={handleClick}
                  onKeyDown={
                    clickable ? (e) => activationKey(e, () => onRowClick!(row)) : undefined
                  }
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  aria-label={clickable ? `Open record ${rowKey(row)}` : undefined}
                  className={cn(
                    "border-b border-border/60 align-top transition-colors",
                    index % 2 === 1 && "bg-cream/20",
                    clickable &&
                      "cursor-pointer hover:bg-cream/60 focus:outline-none focus-visible:bg-cream focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
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
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const clickable = Boolean(onRowClick);
          return (
            <li key={rowKey(row)}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onRowClick!(row)}
                  className="admin-focus block w-full rounded-sm border border-border bg-background p-4 text-left text-sm shadow-[0_1px_0_rgba(0,0,0,0.02)] transition hover:border-forest/40 hover:bg-cream/40"
                >
                  {renderMobileCard ? (
                    renderMobileCard(row)
                  ) : (
                    <MobileColumnList columns={columns} row={row} />
                  )}
                </button>
              ) : (
                <div className="rounded-sm border border-border bg-background p-4 text-sm">
                  {renderMobileCard ? (
                    renderMobileCard(row)
                  ) : (
                    <MobileColumnList columns={columns} row={row} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function MobileColumnList<T>({ columns, row }: { columns: AdminColumn<T>[]; row: T }) {
  return (
    <dl className="grid gap-2">
      {columns.map((c) => (
        <div key={c.key} className="grid grid-cols-[112px_minmax(0,1fr)] gap-2">
          <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {c.header}
          </dt>
          <dd className="min-w-0 break-words">{c.render(row)}</dd>
        </div>
      ))}
    </dl>
  );
}
