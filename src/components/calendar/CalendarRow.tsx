import React from 'react';
import { G } from 'react-native-svg';
import { CalendarCell } from './CalendarCell';
import type { CellStatus } from '../../types';

const GAP = 2; // 1px gap between cells (cell + gap = 12 + 2 = 14)

type CellData = {
  date: string;
  status: CellStatus;
};

type CalendarRowProps = {
  // 7 cells — one per day (Mon at index 0, Sun at index 6)
  cells: CellData[];
  color: string;
  cellSize?: number;
  // Column index used to compute x position
  colIndex: number;
};

function CalendarRowComponent({
  cells,
  color,
  cellSize = 12,
  colIndex,
}: CalendarRowProps) {
  const step = cellSize + GAP;
  const x = colIndex * step;

  return (
    <G>
      {cells.map((cell, rowIndex) => (
        <CalendarCell
          key={cell.date}
          status={cell.status}
          color={color}
          size={cellSize}
          x={x}
          y={rowIndex * step}
        />
      ))}
    </G>
  );
}

export const CalendarRow = React.memo(CalendarRowComponent);
