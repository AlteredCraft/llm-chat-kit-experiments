/**
 * ThemeProposal Modal
 *
 * Displays a proposed AI-generated theme with preview and Apply/Dismiss actions.
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { GeneratedTheme } from '../types/theme';
import { previewTheme } from '../services/theme';
import './ThemeProposal.css';

interface ThemeProposalProps {
  theme: GeneratedTheme;
  isOpen: boolean;
  onApply: (theme: GeneratedTheme, saveAsFavorite: boolean) => void;
  onDismiss: () => void;
}

export function ThemeProposal({
  theme,
  isOpen,
  onApply,
  onDismiss,
}: ThemeProposalProps) {
  const [saveAsFavorite, setSaveAsFavorite] = useState(true);
  const [revertPreview, setRevertPreview] = useState<(() => void) | null>(null);

  // Apply preview when modal opens
  useEffect(() => {
    if (isOpen && theme) {
      const revert = previewTheme(theme);
      setRevertPreview(() => revert);
    }

    return () => {
      // Cleanup: revert preview when modal closes or unmounts
      if (revertPreview) {
        revertPreview();
        setRevertPreview(null);
      }
    };
  }, [isOpen, theme]);

  if (!isOpen || !theme) {
    return null;
  }

  function handleApply() {
    // Clear revert function since we're keeping the theme
    setRevertPreview(null);
    onApply(theme, saveAsFavorite);
  }

  function handleDismiss() {
    // Revert the preview before dismissing
    if (revertPreview) {
      revertPreview();
      setRevertPreview(null);
    }
    onDismiss();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleDismiss();
    }
  }

  // Format the generation timestamp
  const generatedAt = new Date(theme.generatedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Get signal descriptions
  const signalDescriptions = Object.entries(theme.signals)
    .map(([, value]) => value.label)
    .join(', ');

  return (
    <div className="theme-proposal" onKeyDown={handleKeyDown}>
      <div className="theme-proposal__overlay" onClick={handleDismiss} />
      <div className="theme-proposal__content">
        <div className="theme-proposal__header">
          <h2>New Theme Available</h2>
          <button className="theme-proposal__close" onClick={handleDismiss}>
            <X size={20} />
          </button>
        </div>

        <div className="theme-proposal__body">
          {/* Theme Name */}
          <div className="theme-proposal__name">
            <span className="theme-proposal__name-label">Theme:</span>
            <span className="theme-proposal__name-value">{theme.name}</span>
          </div>

          {/* Context Info */}
          <div className="theme-proposal__context">
            <div className="theme-proposal__context-row">
              <span className="theme-proposal__context-label">Based on:</span>
              <span className="theme-proposal__context-value">
                {signalDescriptions || 'Current conditions'}
              </span>
            </div>
            <div className="theme-proposal__context-row">
              <span className="theme-proposal__context-label">Generated:</span>
              <span className="theme-proposal__context-value">{generatedAt}</span>
            </div>
          </div>

          {/* Fonts Info (if any) */}
          {theme.fonts && theme.fonts.length > 0 && (
            <div className="theme-proposal__fonts">
              <span className="theme-proposal__fonts-label">Fonts:</span>
              <span className="theme-proposal__fonts-value">
                {theme.fonts.map((f) => f.family).join(', ')}
              </span>
            </div>
          )}

          {/* Preview Note */}
          <div className="theme-proposal__preview-note">
            <span>✨ Preview active - this is how the app will look</span>
          </div>

          {/* Save as Favorite Option */}
          <div className="theme-proposal__option">
            <input
              type="checkbox"
              id="save-as-favorite"
              className="theme-proposal__checkbox"
              checked={saveAsFavorite}
              onChange={(e) => setSaveAsFavorite(e.target.checked)}
            />
            <label htmlFor="save-as-favorite" className="theme-proposal__option-label">
              Save as favorite
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="theme-proposal__actions">
          <button
            type="button"
            className="theme-proposal__dismiss"
            onClick={handleDismiss}
          >
            Dismiss
          </button>
          <button
            type="button"
            className="theme-proposal__apply"
            onClick={handleApply}
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
}
