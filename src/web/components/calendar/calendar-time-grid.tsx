import type { ReactNode } from "react";
import {
  CALENDAR_START_HOUR,
  CALENDAR_GRID_HEIGHT_PX,
  CALENDAR_HOUR_HEIGHT_PX,
  clampEventToGrid,
  eventHeightPx,
  eventTopPx,
  formatHourLabel,
  getCalendarHourSlots,
  getPodiatristStyle,
  layoutTimedEvents,
  podiatristInitials,
  sortPodiatristsByName,
  type LaidOutCalendarEvent,
  type PodiatristColorStyle,
  DEFAULT_APPOINTMENT_STYLE,
} from "../../lib/calendar-time-grid";

export type CalendarTimedBlock = {
  id: string;
  kind: "appointment" | "session";
  startMinutes: number;
  durationMinutes: number;
  podiatristId?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  /** Iniciales del podólogo cuando comparte color con otro. */
  badge?: string;
  canEdit?: boolean;
  onClick?: () => void;
  href?: string;
};

export type CalendarUntimedBlock = {
  id: string;
  kind: "appointment" | "session";
  podiatristId?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onClick?: () => void;
  href?: string;
};

type PodiatristOption = { id: string; name: string };

function InitialsBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] px-0.5 rounded text-[9px] font-bold leading-none bg-brand-ink/10 border border-current/25 shrink-0">
      {label}
    </span>
  );
}

function resolveStyle(
  podiatristId: string | undefined,
  colorByPodiatrist: boolean,
  orderedPodiatristIds: string[]
): PodiatristColorStyle {
  if (!colorByPodiatrist || !podiatristId) return DEFAULT_APPOINTMENT_STYLE;
  return getPodiatristStyle(podiatristId, orderedPodiatristIds);
}

function TimedEventBlock({
  block,
  style,
  layout,
}: {
  block: CalendarTimedBlock;
  style: PodiatristColorStyle;
  layout: LaidOutCalendarEvent;
}) {
  const clamped = clampEventToGrid(layout.startMinutes, layout.durationMinutes);
  if (!clamped) return null;

  const top = eventTopPx(clamped.startMinutes);
  const height = eventHeightPx(clamped.durationMinutes);
  const widthPct = 100 / layout.totalColumns;
  const leftPct = layout.column * widthPct;

  const className = `absolute rounded-md border px-1.5 py-1 overflow-hidden text-left transition-shadow ${style.bg} ${style.border} ${style.text} ${
    block.canEdit || block.href ? "cursor-pointer hover:shadow-md hover:z-10" : "cursor-default"
  }`;

  const content = (
    <>
      <p className="text-[10px] font-semibold leading-tight truncate flex items-center gap-1">
        {block.badge && <InitialsBadge label={block.badge} />}
        <span className="truncate min-w-0">{block.meta ?? ""}</span>
      </p>
      <p className="text-xs font-medium leading-tight truncate">{block.title}</p>
      {block.subtitle && (
        <p className="text-[10px] opacity-80 leading-tight truncate">{block.subtitle}</p>
      )}
    </>
  );

  const styleProps = {
    className,
    style: {
      top: `${top}px`,
      height: `${height}px`,
      left: `calc(${leftPct}% + 2px)`,
      width: `calc(${widthPct}% - 4px)`,
    },
    onClick: block.onClick,
    title: [block.meta, block.title, block.subtitle].filter(Boolean).join(" · "),
  };

  if (block.href) {
    return (
      <a href={block.href} {...styleProps}>
        {content}
      </a>
    );
  }

  if (block.onClick) {
    return (
      <button type="button" {...styleProps}>
        {content}
      </button>
    );
  }

  return (
    <div {...styleProps}>
      {content}
    </div>
  );
}

function UntimedList({ items, colorByPodiatrist, orderedPodiatristIds }: {
  items: CalendarUntimedBlock[];
  colorByPodiatrist: boolean;
  orderedPodiatristIds: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="border-b border-brand-border bg-brand-canvas/60 px-2 py-1.5 space-y-1">
      <p className="text-[10px] font-medium text-brand-muted uppercase tracking-wide">Sin hora</p>
      {items.map((item) => {
        const style = resolveStyle(item.podiatristId, colorByPodiatrist, orderedPodiatristIds);
        const inner = (
          <div
            className={`text-xs px-2 py-1 rounded border truncate flex items-center gap-1 ${style.bg} ${style.border} ${style.text}`}
          >
            {item.badge && <InitialsBadge label={item.badge} />}
            <span className="truncate min-w-0">
              {item.title}
              {item.subtitle ? ` · ${item.subtitle}` : ""}
            </span>
          </div>
        );
        if (item.href) {
          return (
            <a key={item.id} href={item.href} className="block">
              {inner}
            </a>
          );
        }
        return (
          <button
            key={item.id}
            type="button"
            className="block w-full text-left"
            onClick={item.onClick}
            disabled={!item.onClick}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

function TimeColumn() {
  const hours = getCalendarHourSlots();
  return (
    <div
      className="shrink-0 w-12 sm:w-14 border-r border-brand-border bg-brand-canvas/40"
      style={{ height: CALENDAR_GRID_HEIGHT_PX }}
    >
      {hours.map((hour) => (
        <div
          key={hour}
          className="relative border-b border-brand-border/60 text-[10px] sm:text-xs text-brand-muted text-right pr-1.5"
          style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
        >
          <span className="absolute -top-2 right-1.5 bg-brand-surface px-0.5">
            {formatHourLabel(hour)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DayTimeColumn({
  timedBlocks,
  untimedBlocks,
  colorByPodiatrist,
  orderedPodiatristIds,
}: {
  timedBlocks: CalendarTimedBlock[];
  untimedBlocks: CalendarUntimedBlock[];
  colorByPodiatrist: boolean;
  orderedPodiatristIds: string[];
}) {
  const layoutInput = timedBlocks.map((b) => ({
    id: b.id,
    kind: b.kind,
    startMinutes: b.startMinutes,
    durationMinutes: b.durationMinutes,
    podiatristId: b.podiatristId,
  }));
  const laidOut = layoutTimedEvents(layoutInput);
  const blockMap = new Map(timedBlocks.map((b) => [b.id, b]));

  return (
    <div className="flex-1 min-w-0 flex flex-col border-r border-brand-border last:border-r-0">
      <UntimedList
        items={untimedBlocks}
        colorByPodiatrist={colorByPodiatrist}
        orderedPodiatristIds={orderedPodiatristIds}
      />
      <div className="relative flex-1" style={{ height: CALENDAR_GRID_HEIGHT_PX }}>
        {getCalendarHourSlots().map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-b border-brand-border/50"
            style={{
              top: (hour - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT_PX,
              height: CALENDAR_HOUR_HEIGHT_PX,
            }}
          />
        ))}
        {laidOut.map((layout) => {
          const block = blockMap.get(layout.id);
          if (!block) return null;
          const style = resolveStyle(block.podiatristId, colorByPodiatrist, orderedPodiatristIds);
          return <TimedEventBlock key={layout.id} block={block} style={style} layout={layout} />;
        })}
      </div>
    </div>
  );
}

export function PodiatristColorLegend({
  podiatrists,
  orderedPodiatristIds,
  colorCollisionIds,
}: {
  podiatrists: PodiatristOption[];
  orderedPodiatristIds: string[];
  colorCollisionIds?: Set<string>;
}) {
  if (podiatrists.length < 2) return null;
  const sorted = sortPodiatristsByName(podiatrists);
  const showInitials = colorCollisionIds && colorCollisionIds.size > 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 border-b border-brand-border bg-brand-canvas/50 text-sm">
      <span className="text-xs font-medium text-brand-muted shrink-0">Podólogos:</span>
      {sorted.map((p) => {
        const style = getPodiatristStyle(p.id, orderedPodiatristIds);
        const needsBadge = showInitials && colorCollisionIds!.has(p.id);
        return (
          <span key={p.id} className="inline-flex items-center gap-1.5 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
            {needsBadge && <InitialsBadge label={podiatristInitials(p.name)} />}
            <span className="text-brand-ink truncate">{p.name}</span>
          </span>
        );
      })}
      {showInitials && (
        <span className="text-[10px] text-brand-muted w-full sm:w-auto">
          Las iniciales indican doctores con el mismo color.
        </span>
      )}
    </div>
  );
}

type WeekDayHeader = {
  date: Date;
  dayLabel: string;
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
};

export function CalendarWeekTimeGrid({
  days,
  getTimedBlocks,
  getUntimedBlocks,
  colorByPodiatrist,
  orderedPodiatristIds,
  legend,
}: {
  days: WeekDayHeader[];
  getTimedBlocks: (date: Date) => CalendarTimedBlock[];
  getUntimedBlocks: (date: Date) => CalendarUntimedBlock[];
  colorByPodiatrist: boolean;
  orderedPodiatristIds: string[];
  legend?: ReactNode;
}) {
  return (
    <div className="min-w-[640px]">
      {legend}
      <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-brand-border">
        <div className="border-r border-brand-border" />
        {days.map((day) => (
          <button
            key={day.date.toISOString()}
            type="button"
            onClick={day.onSelect}
            className={`py-2 text-center border-r border-brand-border last:border-r-0 transition-colors ${
              day.isSelected ? "bg-blue-50" : "hover:bg-brand-canvas"
            }`}
          >
            <div className="text-xs text-brand-muted">{day.dayLabel}</div>
            <div
              className={`text-base font-semibold mt-0.5 mx-auto w-8 h-8 flex items-center justify-center rounded-full ${
                day.isToday ? "bg-brand-ink text-brand-ink-fg" : "text-brand-ink"
              }`}
            >
              {day.date.getDate()}
            </div>
          </button>
        ))}
      </div>
      <div className="flex max-h-[min(70vh,52rem)] overflow-y-auto overscroll-contain">
        <TimeColumn />
        {days.map((day) => (
          <DayTimeColumn
            key={day.date.toISOString()}
            timedBlocks={getTimedBlocks(day.date)}
            untimedBlocks={getUntimedBlocks(day.date)}
            colorByPodiatrist={colorByPodiatrist}
            orderedPodiatristIds={orderedPodiatristIds}
          />
        ))}
      </div>
    </div>
  );
}

export function CalendarDayTimeGrid({
  date,
  timedBlocks,
  untimedBlocks,
  colorByPodiatrist,
  orderedPodiatristIds,
  legend,
  header,
}: {
  date: Date;
  timedBlocks: CalendarTimedBlock[];
  untimedBlocks: CalendarUntimedBlock[];
  colorByPodiatrist: boolean;
  orderedPodiatristIds: string[];
  legend?: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div>
      {header}
      {legend}
      <div className="flex border border-brand-border rounded-lg overflow-hidden mt-4 max-h-[min(70vh,52rem)] overflow-y-auto overscroll-contain">
        <TimeColumn />
        <DayTimeColumn
          timedBlocks={timedBlocks}
          untimedBlocks={untimedBlocks}
          colorByPodiatrist={colorByPodiatrist}
          orderedPodiatristIds={orderedPodiatristIds}
        />
      </div>
      <p className="sr-only">
        Agenda del {date.toLocaleDateString("es-ES")}
      </p>
    </div>
  );
}
