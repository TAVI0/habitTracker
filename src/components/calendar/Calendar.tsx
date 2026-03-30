import React, { useMemo, useRef } from 'react';
import { ScrollView } from 'react-native';
import Svg from 'react-native-svg';
import { CalendarRow } from './CalendarRow';
import type { CellStatus, HabitConfig } from '../../types';
import { today, getDayOfWeek } from '../../utils/dateUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKS_YEAR = 52;
const DAYS_PER_WEEK = 7; // Mon(0) … Sun(6)
const CELL_SIZE = 12;
const GAP = 2;
const STEP = CELL_SIZE + GAP;

// ─── Types ────────────────────────────────────────────────────────────────────

type CellData = {
  date: string;
  status: CellStatus;
};

type WeekData = CellData[];

export type CalendarProps = {
  completionDates: string[];
  color: string;
  config: HabitConfig;
  year?: number;
  /** "month" muestra solo el mes actual (para HabitCard). "year" muestra 52 semanas (para detalle). */
  mode?: 'month' | 'year';
};

// ─── Date helpers (local to this file) ───────────────────────────────────────

function isoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns the ISO date (YYYY-MM-DD) that is `offsetDays` before the given date.
 */
function subtractDays(isoDate: string, offsetDays: number): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return isoDateUTC(d);
}

/**
 * Returns the ISO date `offsetDays` after the given date.
 */
function addDaysLocal(isoDate: string, offsetDays: number): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return isoDateUTC(d);
}

// ─── Cell data computation ────────────────────────────────────────────────────

function buildWeekGrid(
  completionSet: Set<string>,
  freeDaySet: Set<number>,
  referenceDate: string
): WeekData[] {
  // Terminar siempre en el próximo sábado (o hoy si ya es sábado)
  // así la semana actual siempre es visible, con días futuros en gris
  const refDow = getDayOfWeek(referenceDate); // 0=Dom … 6=Sáb
  const daysToSat = (6 - refDow + 7) % 7;    // 0 si ya es sábado
  const gridEnd = addDaysLocal(referenceDate, daysToSat); // próximo sábado
  const gridStart = subtractDays(gridEnd, WEEKS_YEAR * DAYS_PER_WEEK - 1);

  const weeks: WeekData[] = [];
  let weekStart = gridStart;

  for (let w = 0; w < WEEKS_YEAR; w++) {
    const week: CellData[] = [];
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      const date = addDaysLocal(weekStart, d);
      week.push({ date, status: getCellStatus(date, completionSet, freeDaySet, referenceDate) });
    }
    weeks.push(week);
    weekStart = addDaysLocal(weekStart, DAYS_PER_WEEK);
  }

  return weeks;
}

/**
 * Construye la grilla solo para el mes actual.
 * Columnas = semanas completas (Lun–Dom) que contienen días del mes.
 */
function buildMonthGrid(
  completionSet: Set<string>,
  freeDaySet: Set<number>,
  referenceDate: string
): WeekData[] {
  const [year, month] = referenceDate.split('-').map(Number);

  // Primer y último día del mes
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayDate = new Date(year, month, 0); // día 0 del mes siguiente = último del mes
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

  // Retroceder al lunes anterior (o el mismo día si ya es lunes)
  // getDayOfWeek: 0=Dom, 1=Lun ... 6=Sab → para Mon-anchor: (dow + 6) % 7 días atrás
  const firstDow = getDayOfWeek(firstDay);
  const daysToMon = (firstDow + 6) % 7; // 0 si ya es lunes
  const gridStart = subtractDays(firstDay, daysToMon);

  // Avanzar al domingo siguiente al último día del mes
  const lastDow = getDayOfWeek(lastDay);
  const daysToSun = (7 - lastDow) % 7;
  const gridEnd = addDaysLocal(lastDay, daysToSun);

  // Calcular cuántas semanas
  const startMs = new Date(gridStart + 'T00:00:00Z').getTime();
  const endMs = new Date(gridEnd + 'T00:00:00Z').getTime();
  const totalWeeks = Math.round((endMs - startMs) / (7 * 24 * 60 * 60 * 1000)) + 1;

  const weeks: WeekData[] = [];
  let weekStart = gridStart;

  for (let w = 0; w < totalWeeks; w++) {
    const week: CellData[] = [];
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      const date = addDaysLocal(weekStart, d);
      week.push({ date, status: getCellStatus(date, completionSet, freeDaySet, referenceDate) });
    }
    weeks.push(week);
    weekStart = addDaysLocal(weekStart, DAYS_PER_WEEK);
  }

  return weeks;
}

function getCellStatus(
  date: string,
  completionSet: Set<string>,
  freeDaySet: Set<number>,
  referenceDate: string
): CellStatus {
  // Priority: future > completed > free > empty
  if (date > referenceDate) return 'future';
  if (completionSet.has(date)) return 'completed';
  const dow = getDayOfWeek(date);
  if (freeDaySet.has(dow)) return 'free';
  return 'empty';
}

// ─── Component ────────────────────────────────────────────────────────────────

function CalendarComponent({ completionDates, color, config, mode = 'year' }: CalendarProps) {
  const referenceDate = today();
  const scrollRef = useRef<ScrollView>(null);

  const weekGrid = useMemo(() => {
    const completionSet = new Set(completionDates);
    const freeDaySet = new Set(config.freeDays);
    return mode === 'month'
      ? buildMonthGrid(completionSet, freeDaySet, referenceDate)
      : buildWeekGrid(completionSet, freeDaySet, referenceDate);
  }, [completionDates, config.freeDays, referenceDate, mode]);

  const svgWidth = weekGrid.length * STEP;
  const svgHeight = DAYS_PER_WEEK * STEP;

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
    >
      <Svg width={svgWidth} height={svgHeight}>
        {weekGrid.map((week, colIndex) => (
          <CalendarRow
            key={colIndex}
            cells={week}
            color={color}
            cellSize={CELL_SIZE}
            colIndex={colIndex}
          />
        ))}
      </Svg>
    </ScrollView>
  );
}

export const Calendar = React.memo(CalendarComponent);
