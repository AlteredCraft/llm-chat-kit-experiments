/**
 * ThemePanel Component
 *
 * Settings section for AI theme generation configuration.
 * Includes auto-theme toggle, check frequency, Google Fonts toggle,
 * and manual "Surprise Me" button.
 */

import React from 'react';
import type { ThemeSettings, GeneratedTheme, CheckFrequency } from '../types/theme';
import './ThemePanel.css';

interface ThemePanelProps {
  settings: ThemeSettings;
  favoriteTheme: GeneratedTheme | null;
  activeTheme: GeneratedTheme | null;
  isGenerating: boolean;
  onSettingsChange: (updates: Partial<ThemeSettings>) => void;
  onSurpriseMe: () => void;
  onRestoreFavorite: () => void;
  onResetTheme: () => void;
}

const CHECK_FREQUENCY_OPTIONS: Array<{ value: CheckFrequency; label: string }> = [
  { value: 'high', label: 'High (5 min)' },
  { value: 'medium', label: 'Medium (15 min)' },
  { value: 'low', label: 'Low (30 min)' },
];

export function ThemePanel({
  settings,
  favoriteTheme,
  activeTheme,
  isGenerating,
  onSettingsChange,
  onSurpriseMe,
  onRestoreFavorite,
  onResetTheme,
}: ThemePanelProps) {
  return (
    <div className="theme-panel">
      {/* Auto-Theme Toggle */}
      <div className="theme-panel__row">
        <label className="theme-panel__label" htmlFor="auto-theme">
          Auto-generate themes
        </label>
        <input
          type="checkbox"
          id="auto-theme"
          className="theme-panel__checkbox"
          checked={settings.autoGenerate}
          onChange={(e) => onSettingsChange({ autoGenerate: e.target.checked })}
        />
      </div>

      {/* Check Frequency (only shown when auto-generate is on) */}
      {settings.autoGenerate && (
        <div className="theme-panel__row">
          <label className="theme-panel__label" htmlFor="check-frequency">
            Check frequency
          </label>
          <select
            id="check-frequency"
            className="theme-panel__select"
            value={settings.checkFrequency}
            onChange={(e) =>
              onSettingsChange({ checkFrequency: e.target.value as CheckFrequency })
            }
          >
            {CHECK_FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dark Mode Preference */}
      <div className="theme-panel__row">
        <label className="theme-panel__label" htmlFor="prefer-dark">
          Prefer dark themes
        </label>
        <input
          type="checkbox"
          id="prefer-dark"
          className="theme-panel__checkbox"
          checked={settings.preferDarkMode}
          onChange={(e) => onSettingsChange({ preferDarkMode: e.target.checked })}
        />
      </div>

      {/* Google Fonts Toggle */}
      <div className="theme-panel__row">
        <label className="theme-panel__label" htmlFor="google-fonts">
          Enable Google Fonts
        </label>
        <input
          type="checkbox"
          id="google-fonts"
          className="theme-panel__checkbox"
          checked={settings.useGoogleFonts}
          onChange={(e) => onSettingsChange({ useGoogleFonts: e.target.checked })}
        />
      </div>

      {/* Action Buttons */}
      <div className="theme-panel__actions">
        <button
          className="theme-panel__btn theme-panel__btn--primary"
          onClick={onSurpriseMe}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : '✨ Surprise Me'}
        </button>

        {favoriteTheme && (
          <button
            className="theme-panel__btn"
            onClick={onRestoreFavorite}
            disabled={isGenerating}
          >
            ❤️ Restore Favorite
          </button>
        )}

        {activeTheme && (
          <button
            className="theme-panel__btn theme-panel__btn--secondary"
            onClick={onResetTheme}
            disabled={isGenerating}
          >
            Reset to Default
          </button>
        )}
      </div>

      {/* Active Theme Info */}
      {activeTheme && (
        <div className="theme-panel__info">
          <span className="theme-panel__info-label">Active theme:</span>
          <span className="theme-panel__info-value">{activeTheme.name}</span>
        </div>
      )}
    </div>
  );
}
