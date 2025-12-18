/**
 * Theme Signals Hook
 *
 * Monitors contextual signals and detects significant changes
 * that should trigger theme generation.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Signal,
  SignalValue,
  TimeOfDayPeriod,
  TimeOfDayRaw,
  CheckFrequency,
} from '../types/theme';

// =============================================================================
// Time of Day Signal
// =============================================================================

/**
 * Signal that tracks the current time of day period.
 * Periods: morning (6-12), midday (12-15), afternoon (15-18), evening (18-21), night (21-6)
 */
export class TimeOfDaySignal implements Signal {
  id = 'time-of-day';
  name = 'Time of Day';

  getValue(): SignalValue {
    const now = new Date();
    const hour = now.getHours();
    const period = this.getPeriod(hour);

    return {
      raw: { hour, period } as TimeOfDayRaw,
      normalized: hour / 24,
      label: `${this.formatPeriod(period)} (${this.formatTime(hour)})`,
    };
  }

  getDescription(): string {
    return 'Current time of day determines color warmth and intensity';
  }

  private getPeriod(hour: number): TimeOfDayPeriod {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 15) return 'midday';
    if (hour >= 15 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 21) return 'evening';
    return 'night';
  }

  private formatPeriod(period: TimeOfDayPeriod): string {
    const labels: Record<TimeOfDayPeriod, string> = {
      morning: 'Morning',
      midday: 'Midday',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
    };
    return labels[period];
  }

  private formatTime(hour: number): string {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'am' : 'pm';
    return `${h}${ampm}`;
  }
}

// =============================================================================
// Signal Change Detection
// =============================================================================

/**
 * Check if a time-of-day signal has significantly changed.
 * A significant change is when the period changes (e.g., morning -> midday).
 */
function hasTimeOfDayChanged(
  previous: SignalValue | undefined,
  current: SignalValue
): boolean {
  if (!previous) return true; // First check is always a change

  const prevRaw = previous.raw as TimeOfDayRaw;
  const currRaw = current.raw as TimeOfDayRaw;

  return prevRaw.period !== currRaw.period;
}

/**
 * Generic function to check if a signal has significantly changed.
 * Dispatches to the appropriate change detection function based on signal ID.
 */
function hasSignificantChange(
  signalId: string,
  previous: SignalValue | undefined,
  current: SignalValue
): boolean {
  switch (signalId) {
    case 'time-of-day':
      return hasTimeOfDayChanged(previous, current);
    default:
      // For unknown signals, compare normalized values with a threshold
      if (!previous) return true;
      return Math.abs(previous.normalized - current.normalized) > 0.1;
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Check frequency intervals in milliseconds
 */
const CHECK_INTERVALS: Record<CheckFrequency, number> = {
  high: 5 * 60 * 1000, // 5 minutes
  medium: 15 * 60 * 1000, // 15 minutes
  low: 30 * 60 * 1000, // 30 minutes
};

export interface UseThemeSignalsResult {
  /** All registered signals */
  signals: Signal[];
  /** Current values of all signals */
  currentValues: Record<string, SignalValue>;
  /** Check for significant changes since last check */
  checkForChanges: () => boolean;
  /** Force a refresh of all signal values */
  refreshValues: () => Record<string, SignalValue>;
  /** Whether any signal has changed significantly */
  hasChanges: boolean;
}

/**
 * Hook to manage theme signals and detect significant changes.
 *
 * @param checkFrequency How often to automatically check for changes
 * @param enabled Whether automatic checking is enabled
 */
export function useThemeSignals(
  checkFrequency: CheckFrequency = 'medium',
  enabled: boolean = true
): UseThemeSignalsResult {
  // Initialize signals (currently just time-of-day)
  const [signals] = useState<Signal[]>(() => [new TimeOfDaySignal()]);

  // Store current signal values
  const [currentValues, setCurrentValues] = useState<Record<string, SignalValue>>(() => {
    const initial: Record<string, SignalValue> = {};
    for (const signal of signals) {
      initial[signal.id] = signal.getValue();
    }
    return initial;
  });

  // Store previous values for change detection
  const previousValuesRef = useRef<Record<string, SignalValue>>({});

  // Track if there are pending changes
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Refresh all signal values and return them
   */
  const refreshValues = useCallback((): Record<string, SignalValue> => {
    const values: Record<string, SignalValue> = {};
    for (const signal of signals) {
      values[signal.id] = signal.getValue();
    }
    setCurrentValues(values);
    return values;
  }, [signals]);

  /**
   * Check if any signals have changed significantly since the last check.
   * Updates the previous values reference for the next comparison.
   */
  const checkForChanges = useCallback((): boolean => {
    const current = refreshValues();
    let hasSignificant = false;

    for (const signal of signals) {
      const prev = previousValuesRef.current[signal.id];
      const curr = current[signal.id];

      if (hasSignificantChange(signal.id, prev, curr)) {
        hasSignificant = true;
      }
    }

    // Update previous values for next comparison
    previousValuesRef.current = { ...current };
    setHasChanges(hasSignificant);

    return hasSignificant;
  }, [signals, refreshValues]);

  // Set up automatic checking interval
  useEffect(() => {
    if (!enabled) return;

    const intervalMs = CHECK_INTERVALS[checkFrequency];
    const interval = setInterval(() => {
      checkForChanges();
    }, intervalMs);

    // Initial check
    checkForChanges();

    return () => clearInterval(interval);
  }, [checkFrequency, enabled, checkForChanges]);

  return {
    signals,
    currentValues,
    checkForChanges,
    refreshValues,
    hasChanges,
  };
}

/**
 * Utility to format signals for API requests
 */
export function formatSignalsForApi(
  signals: Record<string, SignalValue>
): Record<string, { raw: unknown; label: string }> {
  const formatted: Record<string, { raw: unknown; label: string }> = {};
  for (const [id, value] of Object.entries(signals)) {
    formatted[id] = {
      raw: value.raw,
      label: value.label,
    };
  }
  return formatted;
}
