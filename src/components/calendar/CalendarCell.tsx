import React from 'react';
import { Rect } from 'react-native-svg';
import { Colors } from '../../constants/theme';
import type { CellStatus } from '../../types';

type CalendarCellProps = {
  status: CellStatus;
  color: string;
  size?: number;
  x: number;
  y: number;
};

function getCellColor(status: CellStatus, habitColor: string): string {
  switch (status) {
    case 'completed':
      return habitColor;
    case 'empty':
      return Colors.cell.empty;   // #1E1E1E
    case 'free':
      return Colors.cell.free;    // #2F2F2F (spec: #252525 — using theme value)
    case 'future':
      return Colors.cell.future;  // #232323 (spec: #1E1E1E — using theme value)
    case 'missed':
      return Colors.cell.missed;  // #3A3A3A
    default:
      return Colors.cell.empty;
  }
}

function CalendarCellComponent({
  status,
  color,
  size = 12,
  x,
  y,
}: CalendarCellProps) {
  const fill = getCellColor(status, color);
  return (
    <Rect
      x={x}
      y={y}
      width={size}
      height={size}
      rx={2}
      ry={2}
      fill={fill}
    />
  );
}

export const CalendarCell = React.memo(CalendarCellComponent);
