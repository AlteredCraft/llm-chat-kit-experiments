/**
 * Theme Service
 *
 * Handles theme application, CSS injection, and Google Fonts loading.
 */

import type {
  GeneratedTheme,
  GoogleFontSpec,
  ThemeGenerateRequest,
  ThemeGenerateResponse,
} from '../types/theme';

// =============================================================================
// Constants
// =============================================================================

const THEME_STYLE_ID = 'ai-generated-theme';
const GOOGLE_FONTS_LINK_ID = 'ai-theme-google-fonts';

// =============================================================================
// CSS Injection
// =============================================================================

/**
 * Apply theme CSS to the document by injecting a style element.
 * The CSS should contain :root { } with CSS custom property overrides.
 */
export function applyThemeCSS(css: string): void {
  // Remove existing theme style if present
  removeThemeCSS();

  // Create and inject new style element
  const styleEl = document.createElement('style');
  styleEl.id = THEME_STYLE_ID;
  styleEl.textContent = css;

  // Append to head to override the default styles
  document.head.appendChild(styleEl);
}

/**
 * Remove the injected theme CSS, reverting to default styles.
 */
export function removeThemeCSS(): void {
  const existingStyle = document.getElementById(THEME_STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }
}

/**
 * Check if a theme is currently applied.
 */
export function isThemeApplied(): boolean {
  return document.getElementById(THEME_STYLE_ID) !== null;
}

// =============================================================================
// Google Fonts Loading
// =============================================================================

/**
 * Build a Google Fonts CSS URL for the specified fonts.
 * @see https://developers.google.com/fonts/docs/css2
 */
function buildGoogleFontsUrl(fonts: GoogleFontSpec[]): string {
  const families = fonts.map((font) => {
    const weights = font.weights.sort((a, b) => a - b).join(';');
    // URL encode the family name and format for CSS2 API
    const family = encodeURIComponent(font.family).replace(/%20/g, '+');
    return `family=${family}:wght@${weights}`;
  });

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/**
 * Load Google Fonts by injecting a link element.
 */
export function loadGoogleFonts(fonts: GoogleFontSpec[]): void {
  if (!fonts || fonts.length === 0) return;

  // Remove existing fonts link if present
  removeGoogleFonts();

  // Create and inject link element
  const linkEl = document.createElement('link');
  linkEl.id = GOOGLE_FONTS_LINK_ID;
  linkEl.rel = 'stylesheet';
  linkEl.href = buildGoogleFontsUrl(fonts);

  document.head.appendChild(linkEl);
}

/**
 * Remove loaded Google Fonts.
 */
export function removeGoogleFonts(): void {
  const existingLink = document.getElementById(GOOGLE_FONTS_LINK_ID);
  if (existingLink) {
    existingLink.remove();
  }
}

// =============================================================================
// Theme Application
// =============================================================================

/**
 * Apply a complete theme (CSS + optional fonts).
 */
export function applyTheme(theme: GeneratedTheme): void {
  applyThemeCSS(theme.css);

  if (theme.fonts && theme.fonts.length > 0) {
    loadGoogleFonts(theme.fonts);
  }
}

/**
 * Remove the current theme and revert to defaults.
 */
export function resetTheme(): void {
  removeThemeCSS();
  removeGoogleFonts();
}

// =============================================================================
// API Client
// =============================================================================

/**
 * Theme API client for generating themes.
 */
export const themeApi = {
  /**
   * Generate a new theme using the LLM.
   */
  async generate(request: ThemeGenerateRequest): Promise<ThemeGenerateResponse> {
    try {
      const response = await fetch('/api/theme/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data as ThemeGenerateResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },
};

// =============================================================================
// Theme Preview
// =============================================================================

/**
 * Preview a theme temporarily (useful for showing in modal before applying).
 * Returns a cleanup function to revert the preview.
 */
export function previewTheme(theme: GeneratedTheme): () => void {
  const previousCSS = getAppliedThemeCSS();

  applyTheme(theme);

  return () => {
    if (previousCSS) {
      applyThemeCSS(previousCSS);
    } else {
      resetTheme();
    }
  };
}

/**
 * Get the currently applied theme CSS (if any).
 */
function getAppliedThemeCSS(): string | null {
  const styleEl = document.getElementById(THEME_STYLE_ID);
  return styleEl ? styleEl.textContent : null;
}
