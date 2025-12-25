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

  // Generate a contextual greeting based on time of day
  const getContextualGreeting = (): { greeting: string; suggestion: string } => {
    const hour = new Date().getHours();
    const themeName = theme.name;

    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good morning!",
        suggestion: `The early light inspired "${themeName}" — a fresh look to start your day.`
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Hey there!",
        suggestion: `I noticed it's ${signalDescriptions.toLowerCase()}. How about "${themeName}"?`
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: "Good evening!",
        suggestion: `As the day winds down, "${themeName}" might set the right mood.`
      };
    } else {
      return {
        greeting: "Working late?",
        suggestion: `"${themeName}" is designed to be easy on your eyes at this hour.`
      };
    }
  };

  const { greeting, suggestion } = getContextualGreeting();

  return (
    <div className="theme-proposal" onKeyDown={handleKeyDown}>
      <div className="theme-proposal__overlay" onClick={handleDismiss} />
      <div className="theme-proposal__content">
        <div className="theme-proposal__header">
          <h2>{greeting}</h2>
          <button className="theme-proposal__close" onClick={handleDismiss}>
            <X size={20} />
          </button>
        </div>

        <div className="theme-proposal__body">
          {/* Conversational suggestion */}
          <p className="theme-proposal__suggestion">{suggestion}</p>

          {/* Theme Name - now more prominent */}
          <div className="theme-proposal__name">
            <span className="theme-proposal__name-value">{theme.name}</span>
            {theme.fonts && theme.fonts.length > 0 && (
              <span className="theme-proposal__fonts-inline">
                featuring {theme.fonts.map((f) => f.family).join(' & ')}
              </span>
            )}
          </div>

          {/* Preview Note */}
          <div className="theme-proposal__preview-note">
            <span>✨ Take a look around — the preview is live</span>
          </div>

          {/* Context Info - now secondary */}
          <div className="theme-proposal__context">
            <span className="theme-proposal__context-label">
              Inspired by {signalDescriptions.toLowerCase() || 'current conditions'} · {generatedAt}
            </span>
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
            Not now
          </button>
          <button
            type="button"
            className="theme-proposal__apply"
            onClick={handleApply}
          >
            Love it, keep it!
          </button>
        </div>
      </div>
    </div>
  );
}
