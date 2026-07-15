import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { AdminConfirmationDialog } from "./AdminConfirmationDialog";
import { AdminDataTable, type AdminColumn } from "./AdminDataTable";
import { AdminErrorState } from "./AdminErrorState";
import { AdminFilterBar, FilterChip } from "./AdminFilterBar";
import { AdminLoadingState } from "./AdminLoadingState";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminSearchInput } from "./AdminSearchInput";
import { AdminStatusBadge, DemoBadge } from "./AdminStatusBadge";
import { AdminDetailPanel, DetailRow } from "./AdminDetailPanel";
import { FeatureDisabledNotice } from "./FeatureDisabledNotice";
import { PreviewModeBanner } from "./PreviewModeBanner";
import type { DemoRecord, StatusTone } from "../types";

export interface FilterOption<TValue extends string> {
  value: TValue;
  label: string;
}

export interface OperationStatusMap<TStatus extends string> {
  labels: Record<TStatus, string>;
  tones: Record<TStatus, StatusTone>;
}

interface Props<TRecord extends DemoRecord & { id: string }, TStatus extends string> {
  eyebrow: string;
  title: string;
  description: string;
  loadRecords: (filters: { search?: string; status?: TStatus | "all" }) => Promise<TRecord[]>;
  rowKey?: (row: TRecord) => string;
  columns: AdminColumn<TRecord>[];
  renderMobileCard?: (row: TRecord) => ReactNode;
  detailTitle: (row: TRecord) => string;
  detailEyebrow: (row: TRecord) => string;
  detailRows: (row: TRecord) => Array<{ label: string; value: ReactNode }>;
  status: (row: TRecord) => TStatus;
  statusMap: OperationStatusMap<TStatus>;
  statusOptions: Array<FilterOption<string>>;
  disabledFeature: string;
  disabledReason: string;
  emptyTitle?: string;
  emptyDescription?: string;
  actionLabel?: string;
}

const defaultRowKey = <TRecord extends { id: string }>(row: TRecord) => row.id;

export function AdminOperationPage<
  TRecord extends DemoRecord & { id: string },
  TStatus extends string,
>({
  eyebrow,
  title,
  description,
  loadRecords,
  rowKey = defaultRowKey,
  columns,
  renderMobileCard,
  detailTitle,
  detailEyebrow,
  detailRows,
  status,
  statusMap,
  statusOptions,
  disabledFeature,
  disabledReason,
  emptyTitle,
  emptyDescription,
  actionLabel = "Preview action",
}: Props<TRecord, TStatus>) {
  const [records, setRecords] = useState<TRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TStatus | "all">("all");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadRecords({ search, status: statusFilter })
      .then((list) => {
        if (cancelled) return;
        setRecords(list);
        setSelectedId((current) =>
          current && list.some((row) => rowKey(row) === current)
            ? current
            : list[0]
              ? rowKey(list[0])
              : null,
        );
      })
      .catch(() => !cancelled && setError(`${title} records could not be loaded.`));
    return () => {
      cancelled = true;
    };
  }, [loadRecords, rowKey, search, statusFilter, title]);

  const selected = useMemo(
    () => records?.find((row) => rowKey(row) === selectedId) ?? null,
    [records, rowKey, selectedId],
  );

  return (
    <>
      <AdminPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={<AdminStatusBadge tone="preview">Demo data</AdminStatusBadge>}
      />

      <PreviewModeBanner message="This module uses demonstration records only. Local preview actions do not create, update or transmit production data." />

      <AdminFilterBar>
        <AdminSearchInput
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          className="min-w-[220px] flex-1"
        />
        {statusOptions.map((option) => (
          <FilterChip
            key={option.value}
            active={statusFilter === option.value}
            onClick={() => setStatusFilter(option.value)}
          >
            {option.label}
          </FilterChip>
        ))}
      </AdminFilterBar>

      {localNotice ? (
        <div className="flex items-start gap-3 rounded-sm border border-forest/20 bg-forest/10 px-4 py-3 text-xs text-forest-deep">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{localNotice}</p>
        </div>
      ) : null}

      {error ? (
        <AdminErrorState description={error} />
      ) : !records ? (
        <AdminLoadingState rows={3} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
          <AdminDataTable
            columns={columns}
            rows={records}
            rowKey={rowKey}
            caption={`${title} administration records`}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            onRowClick={(row) => setSelectedId(rowKey(row))}
            renderMobileCard={renderMobileCard}
          />

          {selected ? (
            <AdminDetailPanel
              eyebrow={detailEyebrow(selected)}
              title={detailTitle(selected)}
              actions={
                <>
                  <AdminStatusBadge tone={statusMap.tones[status(selected)]}>
                    {statusMap.labels[status(selected)]}
                  </AdminStatusBadge>
                  <DemoBadge />
                </>
              }
            >
              <dl>
                {detailRows(selected).map((row) => (
                  <DetailRow key={row.label} label={row.label}>
                    {row.value}
                  </DetailRow>
                ))}
              </dl>

              <div className="mt-6">
                <FeatureDisabledNotice feature={disabledFeature} reason={disabledReason} />
              </div>

              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-xs font-medium text-charcoal hover:border-forest"
              >
                <Plus className="size-3.5" aria-hidden />
                {actionLabel}
              </button>
            </AdminDetailPanel>
          ) : (
            <AdminDetailPanel eyebrow="Selection" title="No record selected">
              <p className="text-sm text-muted-foreground">
                Select a demonstration record to inspect its administrative detail.
              </p>
            </AdminDetailPanel>
          )}
        </div>
      )}

      <AdminConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Complete preview action?"
        description="This will only update local interface state for the current session."
        confirmLabel="Complete locally"
        onConfirm={() => {
          setConfirmOpen(false);
          setLocalNotice("Preview action completed locally. No production record was created.");
        }}
      />
    </>
  );
}
