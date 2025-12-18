/**
 * Theme types for AI Dynamic Theme Generator
 */

// =============================================================================
// Signal System Types
// =============================================================================

/**
 * Abstract signal interface for extensibility.
 * Each signal type (time, weather, etc.) implements this interface.
 */
export interface Signal {
  id: string;
  name: string;
  getValue(): SignalValue;
  getDescription(): string;
}

/**
 * Value returned by a signal, with normalized representation for comparison.
 */
export interface SignalValue {
  raw: unknown;
  normalized: number; // 0-1 scale for threshold comparison
  label: string; // Human-readable description
}

/**
 * Time of day periods for the TimeOfDaySignal
 */
export type TimeOfDayPeriod =
  | 'morning' // 6am-12pm
  | 'midday' // 12pm-3pm
  | 'afternoon' // 3pm-6pm
  | 'evening' // 6pm-9pm
  | 'night'; // 9pm-6am

/**
 * Raw value structure for TimeOfDaySignal
 */
export interface TimeOfDayRaw {
  hour: number;
  period: TimeOfDayPeriod;
}

// =============================================================================
// Theme Generation Types
// =============================================================================

/**
 * Check frequency options for signal monitoring
 */
export type CheckFrequency = 'high' | 'medium' | 'low';

/**
 * User preferences for theme generation
 */
export interface ThemePreferences {
  useGoogleFonts: boolean;
  preferDarkMode: boolean;
}

/**
 * Theme settings stored in localStorage
 */
export interface ThemeSettings {
  autoGenerate: boolean;
  checkFrequency: CheckFrequency;
  useGoogleFonts: boolean;
  preferDarkMode: boolean;
}

/**
 * Default theme settings
 */
export const defaultThemeSettings: ThemeSettings = {
  autoGenerate: true,
  checkFrequency: 'medium',
  useGoogleFonts: false,
  preferDarkMode: false,
};

/**
 * Context passed to theme generation
 */
export interface ThemeContext {
  signals: Record<string, SignalValue>;
  preferences: ThemePreferences;
  currentTheme?: GeneratedTheme;
}

/**
 * Google Font specification for dynamic loading
 */
export interface GoogleFontSpec {
  family: string;
  weights: number[];
}

/**
 * A generated theme with all its metadata
 */
export interface GeneratedTheme {
  id: string;
  name: string;
  css: string; // Sanitized CSS custom properties
  fonts?: GoogleFontSpec[]; // Optional Google Fonts
  generatedAt: string; // ISO timestamp
  signals: Record<string, SignalValue>; // Signals that triggered this theme
}

// =============================================================================
// API Types
// =============================================================================

/**
 * Request body for POST /api/theme/generate
 */
export interface ThemeGenerateRequest {
  provider: string;
  model: string;
  signals: Record<string, { raw: unknown; label: string }>;
  preferences: ThemePreferences;
}

/**
 * CSS validation/lint results
 */
export interface CSSLintResults {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Response from POST /api/theme/generate
 */
export interface ThemeGenerateResponse {
  success: boolean;
  theme?: {
    name: string;
    css: string;
    fonts?: GoogleFontSpec[];
  };
  lintResults?: CSSLintResults;
  error?: string;
}

// =============================================================================
// Themeable CSS Variables
// =============================================================================

/**
 * List of all themeable CSS variable names.
 * These are the only variables the AI can modify.
 */
export const THEMEABLE_COLORS = [
  '--color-bg',
  '--color-fg',
  '--color-border',
  '--color-muted',
  '--color-user-bg',
  '--color-assistant-bg',
  '--color-accent-blue',
  '--color-accent-blue-light',
  '--color-accent-orange',
  '--color-accent-yellow',
] as const;

export const THEMEABLE_TYPOGRAPHY = [
  '--font-family',
  '--font-family-mono',
  '--font-size-xs',
  '--font-size-sm',
  '--font-size-md',
  '--font-size-lg',
  '--font-size-xl',
  '--font-weight-normal',
  '--font-weight-medium',
  '--font-weight-semibold',
  '--font-weight-bold',
] as const;

export type ThemeableColorVar = (typeof THEMEABLE_COLORS)[number];
export type ThemeableTypographyVar = (typeof THEMEABLE_TYPOGRAPHY)[number];
export type ThemeableVar = ThemeableColorVar | ThemeableTypographyVar;
