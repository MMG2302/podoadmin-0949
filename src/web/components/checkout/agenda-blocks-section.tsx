import { useMemo, useState } from "react";
import { useLanguage } from "../../contexts/language-context";
import { useAgendaBlocks, type AgendaBlockDraft } from "../../hooks/use-agenda-analytics";
import { AGENDA_BLOCK_CATEGORY_ICONS, isAllDayBlock } from "../../lib/agenda-blocks";
import type { AgendaBlock, AgendaBlockCategory, AgendaBlockRecurrence } from "../../types/agenda";

const LOCALE_BY_LANG: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-PT",
  fr: "fr-FR",
};

/** Opciones cada 15 min: cubre comidas y salidas cortas sin llenar el select. */
function quarterHourOptions(): string[] {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += 15) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  out.push("24:00");
  return out;
}

const TIME_OPTIONS = quarterHourOptions();

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

type Props = {
  /** Agenda que se está viendo; en clinic_admin sin podólogo, son los bloqueos de la clínica. */
  podiatristId?: string;
  canEdit?: boolean;
};

export function AgendaBlocksSection({ podiatristId, canEdit = false }: Props) {
  const { t, language } = useLanguage();
  const aa = t.checkout.agendaAnalytics;
  const locale = LOCALE_BY_LANG[language] ?? "es-MX";
  const { blocks, canManageClinicWide, loading, saving, error, create, remove } = useAgendaBlocks(
    true,
    podiatristId
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<AgendaBlockCategory>("lunch");
  const [recurrence, setRecurrence] = useState<AgendaBlockRecurrence>("weekly");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState<string>(todayIso());
  const [endDate, setEndDate] = useState<string>("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("15:00");
  const [allDay, setAllDay] = useState(false);
  const [scope, setScope] = useState<"podiatrist" | "clinic">("podiatrist");

  const categoryLabels: Record<AgendaBlockCategory, string> = {
    lunch: aa.blocksCategoryLunch,
    personal: aa.blocksCategoryPersonal,
    admin: aa.blocksCategoryAdmin,
    vacation: aa.blocksCategoryVacation,
    other: aa.blocksCategoryOther,
  };

  // Nombres cortos de día en el idioma activo, empezando en domingo (0) como el backend.
  const weekdayNames = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(Date.UTC(2024, 0, 7 + i)).toLocaleDateString(locale, {
          weekday: "short",
          timeZone: "UTC",
        })
      ),
    [locale]
  );

  const resetForm = () => {
    setTitle("");
    setCategory("lunch");
    setRecurrence("weekly");
    setWeekdays([1, 2, 3, 4, 5]);
    setStartDate(todayIso());
    setEndDate("");
    setStartTime("14:00");
    setEndTime("15:00");
    setAllDay(false);
    setScope("podiatrist");
    setFormError(null);
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async () => {
    setFormError(null);
    const draft: AgendaBlockDraft = {
      scope: scope === "clinic" ? "clinic" : "podiatrist",
      ...(scope === "podiatrist" && podiatristId ? { podiatristId } : {}),
      title: title.trim(),
      category,
      recurrence,
      weekdays: recurrence === "weekly" ? weekdays : [],
      startDate: recurrence === "weekly" ? startDate || null : startDate,
      endDate: endDate || null,
      startTime: allDay ? "00:00" : startTime,
      endTime: allDay ? "24:00" : endTime,
    };
    const res = await create(draft);
    if (res.ok) {
      resetForm();
      setFormOpen(false);
    } else {
      setFormError(res.error ?? null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(aa.blocksDeleteConfirm)) return;
    await remove(id);
  };

  const describeBlock = (block: AgendaBlock): string => {
    const when = isAllDayBlock(block)
      ? aa.blocksAllDayLabel
      : `${block.startTime} – ${block.endTime}`;
    if (block.recurrence === "weekly") {
      const days =
        block.weekdays.length === 7
          ? aa.blocksEveryDay
          : block.weekdays.map((d) => weekdayNames[d]).join(", ");
      return `${days} · ${when}`;
    }
    const range =
      block.endDate && block.endDate !== block.startDate
        ? `${block.startDate} → ${block.endDate}`
        : block.startDate ?? "";
    return `${range} · ${when}`;
  };

  return (
    <section className="bg-brand-surface rounded-xl border border-brand-border p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-brand-ink">{aa.blocksTitle}</h3>
          <p className="text-xs text-brand-muted mt-1 max-w-prose">{aa.blocksHint}</p>
        </div>
        {canEdit && !formOpen && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="px-3 py-2 text-sm bg-brand-ink text-brand-ink-fg rounded-lg shrink-0"
          >
            {aa.blocksAdd}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-semantic-error">{error}</p>}

      {loading && blocks.length === 0 ? (
        <p className="text-sm text-brand-muted">{aa.blocksLoading}</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-brand-muted">{aa.blocksEmpty}</p>
      ) : (
        <ul className="divide-y divide-brand-border text-sm">
          {blocks.map((block) => (
            <li key={block.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <span aria-hidden className="shrink-0">
                {AGENDA_BLOCK_CATEGORY_ICONS[block.category]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-brand-ink truncate flex items-center gap-2">
                  {block.title}
                  {!block.podiatristId && (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-canvas text-brand-muted border border-brand-border shrink-0">
                      {aa.blocksClinicWideTag}
                    </span>
                  )}
                </p>
                <p className="text-xs text-brand-muted truncate">
                  {categoryLabels[block.category]} · {describeBlock(block)}
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleDelete(block.id)}
                  className="text-xs text-semantic-error hover:underline disabled:opacity-50 shrink-0"
                >
                  {aa.blocksDelete}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!canEdit && <p className="text-xs text-brand-muted">{aa.blocksReadOnlyHint}</p>}

      {canEdit && formOpen && (
        <div className="pt-3 border-t border-brand-border/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-brand-muted space-y-1">
              <span>{aa.blocksTitleLabel}</span>
              <input
                type="text"
                value={title}
                maxLength={120}
                placeholder={aa.blocksTitlePlaceholder}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink"
              />
            </label>
            <label className="text-xs text-brand-muted space-y-1">
              <span>{aa.blocksCategory}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AgendaBlockCategory)}
                className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink"
              >
                {(Object.keys(categoryLabels) as AgendaBlockCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {categoryLabels[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-brand-muted space-y-1">
              <span>{aa.blocksRecurrence}</span>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as AgendaBlockRecurrence)}
                className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink"
              >
                <option value="weekly">{aa.blocksRecurrenceWeekly}</option>
                <option value="once">{aa.blocksRecurrenceOnce}</option>
              </select>
            </label>
            {canManageClinicWide && (
              <label className="text-xs text-brand-muted space-y-1">
                <span>{aa.blocksScope}</span>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as "podiatrist" | "clinic")}
                  className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink"
                >
                  <option value="podiatrist">{aa.blocksScopeMine}</option>
                  <option value="clinic">{aa.blocksScopeClinic}</option>
                </select>
              </label>
            )}
          </div>

          {canManageClinicWide && scope === "clinic" && (
            <p className="text-xs text-brand-muted">{aa.blocksScopeClinicHint}</p>
          )}

          {recurrence === "weekly" ? (
            <div className="space-y-1.5">
              <span className="text-xs text-brand-muted">{aa.blocksWeekdays}</span>
              <div className="flex flex-wrap gap-1.5">
                {weekdayNames.map((name, day) => {
                  const on = weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleWeekday(day)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border capitalize min-w-[3rem] ${
                        on
                          ? "bg-brand-ink text-brand-ink-fg border-brand-ink"
                          : "bg-brand-surface text-brand-muted border-brand-border"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-brand-muted space-y-1">
              <span>{recurrence === "weekly" ? aa.blocksDateFrom : aa.blocksDate}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink"
              />
            </label>
            <label className="text-xs text-brand-muted space-y-1">
              <span>{aa.blocksDateToOptional}</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink"
              />
            </label>
          </div>
          {recurrence === "weekly" && (
            <p className="text-xs text-brand-muted -mt-1">{aa.blocksValidityHint}</p>
          )}

          <label className="flex items-center gap-2 text-sm text-brand-ink">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            {aa.blocksAllDay}
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-brand-muted space-y-1">
                <span>{aa.blocksFrom}</span>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink"
                >
                  {TIME_OPTIONS.slice(0, -1).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-brand-muted space-y-1">
                <span>{aa.blocksTo}</span>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-ink"
                >
                  {TIME_OPTIONS.filter((time) => time > startTime).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {formError && <p className="text-sm text-semantic-error">{formError}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSubmit()}
              className="px-4 py-2 text-sm bg-brand-ink text-brand-ink-fg rounded-lg disabled:opacity-50"
            >
              {saving ? aa.blocksSaving : aa.blocksSave}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setFormOpen(false);
              }}
              className="px-4 py-2 text-sm border border-brand-border text-brand-ink rounded-lg"
            >
              {aa.blocksCancel}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
