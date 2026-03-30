import { calculateStreak } from '../streak';
import type { HabitConfig, StreakResult } from '../../types';

function config(freeDays: number[] = []): HabitConfig {
  return { freeDays };
}

const REF = '2026-03-25'; // Wednesday (dow=3)

describe('calculateStreak', () => {
  // 1. Empty completions
  it('returns zeros for empty completions', () => {
    const result = calculateStreak([], config(), REF);
    expect(result).toEqual<StreakResult>({ current: 0, longest: 0, isActiveToday: false });
  });

  // 2. All 7 days free → inactive
  it('returns zeros when all 7 days are free', () => {
    const result = calculateStreak(['2026-03-25'], config([0,1,2,3,4,5,6]), REF);
    expect(result).toEqual<StreakResult>({ current: 0, longest: 0, isActiveToday: false });
  });

  // 3. Simple consecutive streak (today completed)
  it('counts simple consecutive streak', () => {
    const completions = ['2026-03-23', '2026-03-24', '2026-03-25'];
    const result = calculateStreak(completions, config(), REF);
    expect(result.current).toBe(3);
    expect(result.isActiveToday).toBe(true);
  });

  // 4. Free day without completion → skipped, streak intact
  it('free day not completed is skipped without breaking streak', () => {
    // Mon completed, Tue free (not completed), Wed completed (REF)
    const completions = ['2026-03-23', '2026-03-25'];
    const result = calculateStreak(completions, config([2]), REF); // Tue=2 free
    expect(result.current).toBe(2); // Mon + Wed
    expect(result.isActiveToday).toBe(true);
  });

  // 5. Free day WITH completion → counts +1
  it('free day completed counts toward streak', () => {
    // Mon completed, Tue free AND completed, Wed completed (REF)
    const completions = ['2026-03-23', '2026-03-24', '2026-03-25'];
    const result = calculateStreak(completions, config([2]), REF); // Tue=2 free
    expect(result.current).toBe(3); // Mon + Tue(bonus) + Wed
    expect(result.isActiveToday).toBe(true);
  });

  // 6. Non-free past day missed → breaks streak
  it('missed non-free past day breaks streak', () => {
    // Mon missed, Tue completed, Wed completed (REF)
    const completions = ['2026-03-24', '2026-03-25'];
    const result = calculateStreak(completions, config(), REF);
    expect(result.current).toBe(2); // only Tue + Wed (Mon breaks before them)
  });

  // 7. Today not completed, not free → no penalty, counts from yesterday
  it('today not completed and not free → isActiveToday false, streak from yesterday', () => {
    const completions = ['2026-03-24']; // only Tue, today (Wed) not done
    const result = calculateStreak(completions, config(), REF);
    expect(result.isActiveToday).toBe(false);
    expect(result.current).toBe(1); // yesterday done, today not penalized
  });

  // 8. Future completions ignored
  it('ignores future completion dates', () => {
    const completions = ['2026-03-26', '2026-03-27'];
    const result = calculateStreak(completions, config(), REF);
    expect(result.current).toBe(0);
    expect(result.isActiveToday).toBe(false);
  });

  // 9. Longest streak tracked across history
  it('tracks longest streak even when current is shorter', () => {
    const completions = [
      '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14',
      // gap on Mar 15
      '2026-03-16', '2026-03-17',
    ];
    const result = calculateStreak(completions, config(), '2026-03-17');
    expect(result.current).toBe(2);
    expect(result.longest).toBe(5);
  });

  // 10. Today is a free day → isActiveToday true
  it('today is a free day → isActiveToday true without completion', () => {
    const result = calculateStreak([], config([3]), REF); // Wed=3 free
    expect(result.isActiveToday).toBe(true);
  });
});
