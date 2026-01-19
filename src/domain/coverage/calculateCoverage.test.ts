import { describe, it, expect } from 'vitest';
import {
  calculateCoverage,
  getShiftCoverageStatus,
  getDayCoverageStatus,
  getWeekCoverageSummary,
} from './calculateCoverage';
import type { Agent } from '../../types';
import { createDefaultWeekPreferences } from '../../types';

function createTestAgent(
  id: string,
  name: string,
  overrides: Partial<Record<string, Record<string, string>>> = {}
): Agent {
  const preferences = createDefaultWeekPreferences();

  // Apply overrides
  for (const [day, shifts] of Object.entries(overrides)) {
    if (shifts) {
      for (const [shift, status] of Object.entries(shifts)) {
        (preferences as Record<string, Record<string, string>>)[day][shift] = status;
      }
    }
  }

  return {
    id,
    name,
    preferences,
    contractHoursPerWeek: 40,
  };
}

describe('calculateCoverage', () => {
  it('returns empty coverage when no agents', () => {
    const coverage = calculateCoverage([]);

    expect(coverage.mon.s1.available).toBe(0);
    expect(coverage.mon.s1.neutral).toBe(0);
    expect(coverage.mon.s1.unavailable).toBe(0);
    expect(coverage.mon.s1.availableAgents).toEqual([]);
    expect(coverage.mon.s1.neutralAgents).toEqual([]);
    expect(coverage.mon.s1.unavailableAgents).toEqual([]);
  });

  it('counts available agents correctly', () => {
    const agent = createTestAgent('1', 'Alice', {
      mon: { s1: 'available', s2: 'available' },
    });

    const coverage = calculateCoverage([agent]);

    expect(coverage.mon.s1.available).toBe(1);
    expect(coverage.mon.s1.availableAgents).toEqual(['Alice']);
    expect(coverage.mon.s2.available).toBe(1);
    expect(coverage.mon.s2.availableAgents).toEqual(['Alice']);
  });

  it('counts neutral agents correctly', () => {
    const agent = createTestAgent('1', 'Bob', {
      tue: { s3: 'neutral' },
    });

    const coverage = calculateCoverage([agent]);

    expect(coverage.tue.s3.neutral).toBe(1);
    expect(coverage.tue.s3.neutralAgents).toEqual(['Bob']);
  });

  it('counts unavailable agents correctly', () => {
    const agent = createTestAgent('1', 'Charlie', {}); // Default is unavailable

    const coverage = calculateCoverage([agent]);

    expect(coverage.mon.s1.unavailable).toBe(1);
    expect(coverage.mon.s1.unavailableAgents).toEqual(['Charlie']);
  });

  it('aggregates multiple agents correctly', () => {
    const alice = createTestAgent('1', 'Alice', {
      mon: { s1: 'available' },
    });
    const bob = createTestAgent('2', 'Bob', {
      mon: { s1: 'available' },
    });
    const charlie = createTestAgent('3', 'Charlie', {
      mon: { s1: 'neutral' },
    });

    const coverage = calculateCoverage([alice, bob, charlie]);

    expect(coverage.mon.s1.available).toBe(2);
    expect(coverage.mon.s1.neutral).toBe(1);
    expect(coverage.mon.s1.unavailable).toBe(0);
    expect(coverage.mon.s1.availableAgents).toEqual(['Alice', 'Bob']);
    expect(coverage.mon.s1.neutralAgents).toEqual(['Charlie']);
  });
});

describe('getShiftCoverageStatus', () => {
  it('returns "covered" when there are available agents', () => {
    const status = getShiftCoverageStatus({
      available: 1,
      neutral: 0,
      unavailable: 2,
      availableAgents: ['Alice'],
      neutralAgents: [],
      unavailableAgents: ['Bob', 'Charlie'],
    });

    expect(status).toBe('covered');
  });

  it('returns "tight" when only neutral agents available', () => {
    const status = getShiftCoverageStatus({
      available: 0,
      neutral: 1,
      unavailable: 2,
      availableAgents: [],
      neutralAgents: ['Bob'],
      unavailableAgents: ['Alice', 'Charlie'],
    });

    expect(status).toBe('tight');
  });

  it('returns "gap" when no one is available', () => {
    const status = getShiftCoverageStatus({
      available: 0,
      neutral: 0,
      unavailable: 3,
      availableAgents: [],
      neutralAgents: [],
      unavailableAgents: ['Alice', 'Bob', 'Charlie'],
    });

    expect(status).toBe('gap');
  });
});

describe('getDayCoverageStatus', () => {
  it('returns "gap" if any shift has a gap', () => {
    const shiftCoverage = {
      s1: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s2: { available: 0, neutral: 0, unavailable: 1, availableAgents: [], neutralAgents: [], unavailableAgents: ['A'] }, // gap
      s3: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s4: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s5: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
    };

    expect(getDayCoverageStatus(shiftCoverage)).toBe('gap');
  });

  it('returns "tight" if any shift is tight but none are gaps', () => {
    const shiftCoverage = {
      s1: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s2: { available: 0, neutral: 1, unavailable: 0, availableAgents: [], neutralAgents: ['A'], unavailableAgents: [] }, // tight
      s3: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s4: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s5: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
    };

    expect(getDayCoverageStatus(shiftCoverage)).toBe('tight');
  });

  it('returns "covered" if all shifts have available agents', () => {
    const shiftCoverage = {
      s1: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s2: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s3: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s4: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
      s5: { available: 1, neutral: 0, unavailable: 0, availableAgents: ['A'], neutralAgents: [], unavailableAgents: [] },
    };

    expect(getDayCoverageStatus(shiftCoverage)).toBe('covered');
  });
});

describe('getWeekCoverageSummary', () => {
  it('counts shifts correctly', () => {
    const agents = [
      createTestAgent('1', 'Alice', {
        mon: { s1: 'available', s2: 'available', s3: 'available', s4: 'available', s5: 'available' },
        tue: { s1: 'neutral', s2: 'neutral', s3: 'neutral', s4: 'neutral', s5: 'neutral' },
        // wed-sun are all unavailable (gaps)
      }),
    ];

    const coverage = calculateCoverage(agents);
    const summary = getWeekCoverageSummary(coverage);

    expect(summary.totalShifts).toBe(35); // 7 days * 5 shifts
    expect(summary.coveredShifts).toBe(5); // Monday
    expect(summary.tightShifts).toBe(5); // Tuesday
    expect(summary.gapShifts).toBe(25); // Wed-Sun
    expect(summary.gapDetails.length).toBe(25);
  });
});
