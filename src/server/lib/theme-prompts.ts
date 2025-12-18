/**
 * Theme Prompt Generator
 *
 * Builds prompts for LLM theme generation with strict output format.
 */

import {
  THEMEABLE_COLORS,
  THEMEABLE_TYPOGRAPHY,
  type ThemePreferences,
  type GoogleFontSpec,
} from '../../client/types/theme';

// =============================================================================
// System Fonts
// =============================================================================

/**
 * Safe system font stacks that work across platforms
 */
export const SYSTEM_FONT_STACKS = {
  sansSerif:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
  monospace:
    "'SF Mono', Monaco, Inconsolata, 'Fira Code', 'Droid Sans Mono', 'Source Code Pro', monospace",
  display: "Impact, Haettenschweiler, 'Franklin Gothic Bold', Charcoal, sans-serif",
};

// =============================================================================
// Prompt Building
// =============================================================================

export interface ThemePromptInput {
  signals: Record<string, { raw: unknown; label: string }>;
  preferences: ThemePreferences;
}

export interface ThemePrompt {
  system: string;
  user: string;
}

/**
 * Build the system and user prompts for theme generation
 */
export function buildThemePrompt(
  signals: ThemePromptInput['signals'],
  preferences: ThemePromptInput['preferences']
): ThemePrompt {
  const colorVarList = THEMEABLE_COLORS.map((v) => `  ${v}`).join('\n');
  const typographyVarList = THEMEABLE_TYPOGRAPHY.map((v) => `  ${v}`).join('\n');

  const fontGuidance = preferences.useGoogleFonts
    ? `You MAY use Google Fonts. If you do, include a JSON block with font specifications.
Available Google Fonts guidelines:
- Choose readable fonts appropriate for a chat interface
- Include weights 400 and 600 at minimum
- Limit to 2 font families maximum (one for UI, one for monospace)`
    : `Use ONLY system fonts. Available font stacks:
- Sans-serif: ${SYSTEM_FONT_STACKS.sansSerif}
- Serif: ${SYSTEM_FONT_STACKS.serif}
- Monospace: ${SYSTEM_FONT_STACKS.monospace}`;

  const system = `You are a creative UI theme designer. Your task is to generate CSS custom properties for a chat application based on contextual signals like time of day.

CRITICAL RULES:
1. Output ONLY valid CSS custom properties (variables starting with --)
2. Use ONLY hex colors (#RGB, #RRGGBB, or #RRGGBBAA format)
3. Use ONLY rem, em, or px units for sizes
4. Font weights must be multiples of 100 (100, 200, ..., 900)
5. Do NOT include url(), @import, javascript:, or any external references
6. Do NOT include any HTML, JavaScript, or comments outside the CSS block

AVAILABLE THEME VARIABLES:

Colors (use hex format only):
${colorVarList}

Typography:
${typographyVarList}

${fontGuidance}

OUTPUT FORMAT:
\`\`\`css
:root {
  /* Theme: [Your Creative Theme Name Here] */
  --color-bg: #xxxxxx;
  --color-fg: #xxxxxx;
  --color-border: #xxxxxx;
  --color-muted: #xxxxxx;
  --color-user-bg: #xxxxxx;
  --color-assistant-bg: #xxxxxx;
  --color-accent-blue: #xxxxxx;
  --color-accent-blue-light: #xxxxxx;
  --color-accent-orange: #xxxxxx;
  --color-accent-yellow: #xxxxxx;
  --font-family: [font stack];
  --font-family-mono: [monospace font stack];
  --font-size-xs: [size];
  --font-size-sm: [size];
  --font-size-md: [size];
  --font-size-lg: [size];
  --font-size-xl: [size];
  --font-weight-normal: [weight];
  --font-weight-medium: [weight];
  --font-weight-semibold: [weight];
  --font-weight-bold: [weight];
}
\`\`\`
${
  preferences.useGoogleFonts
    ? `
If using Google Fonts, also output this JSON block:
\`\`\`json
{"fonts": [{"family": "FontName", "weights": [400, 600]}]}
\`\`\`
`
    : ''
}

DESIGN GUIDELINES:
- Ensure sufficient contrast between text and background (WCAG AA minimum)
- Make user messages and assistant messages visually distinct
- Choose accent colors that complement the base palette
- Typography scale should feel balanced and readable`;

  // Build signal descriptions for the user prompt
  const signalDescriptions = Object.entries(signals)
    .map(([id, value]) => `- ${formatSignalId(id)}: ${value.label}`)
    .join('\n');

  const modePreference = preferences.preferDarkMode
    ? 'The user prefers dark themes with light text on dark backgrounds.'
    : 'The user prefers light themes with dark text on light backgrounds.';

  const user = `Create a unique, beautiful theme for a chat application based on these current conditions:

${signalDescriptions}

${modePreference}

Be creative with the theme name - it should reflect the mood and conditions. Ensure the colors are harmonious and the typography is readable. The theme should feel cohesive and intentional, not random.`;

  return { system, user };
}

/**
 * Format a signal ID for display (e.g., 'time-of-day' -> 'Time of Day')
 */
function formatSignalId(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// Response Parsing
// =============================================================================

export interface ParsedThemeResponse {
  success: boolean;
  name?: string;
  css?: string;
  fonts?: GoogleFontSpec[];
  error?: string;
}

/**
 * Parse the LLM response to extract theme CSS and optional fonts
 */
export function parseThemeResponse(response: string): ParsedThemeResponse {
  try {
    // Extract CSS block
    const cssMatch = response.match(/```css\s*([\s\S]*?)```/);
    if (!cssMatch) {
      return { success: false, error: 'No CSS block found in response' };
    }

    const css = cssMatch[1].trim();

    // Validate basic structure
    if (!css.includes(':root') && !css.includes('--')) {
      return { success: false, error: 'CSS does not contain :root or custom properties' };
    }

    // Extract theme name from comment
    const nameMatch = css.match(/\/\*\s*Theme:\s*(.+?)\s*\*\//);
    const name = nameMatch ? nameMatch[1].trim() : 'Generated Theme';

    // Extract optional fonts JSON
    let fonts: GoogleFontSpec[] | undefined;
    const fontsMatch = response.match(/```json\s*([\s\S]*?)```/);
    if (fontsMatch) {
      try {
        const parsed = JSON.parse(fontsMatch[1]);
        if (parsed.fonts && Array.isArray(parsed.fonts)) {
          fonts = validateFontSpecs(parsed.fonts);
        }
      } catch {
        // Ignore font parsing errors - fonts are optional
      }
    }

    return { success: true, name, css, fonts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse response',
    };
  }
}

/**
 * Validate and sanitize font specifications
 */
function validateFontSpecs(fonts: unknown[]): GoogleFontSpec[] {
  const validFonts: GoogleFontSpec[] = [];

  for (const font of fonts) {
    if (
      typeof font === 'object' &&
      font !== null &&
      'family' in font &&
      'weights' in font
    ) {
      const f = font as { family: unknown; weights: unknown };
      if (
        typeof f.family === 'string' &&
        Array.isArray(f.weights) &&
        f.weights.every((w) => typeof w === 'number' && w >= 100 && w <= 900)
      ) {
        // Sanitize family name - only allow safe characters
        const sanitizedFamily = f.family.replace(/[^a-zA-Z0-9\s-]/g, '');
        if (sanitizedFamily.length > 0 && sanitizedFamily.length < 100) {
          validFonts.push({
            family: sanitizedFamily,
            weights: f.weights.filter(
              (w) => w >= 100 && w <= 900 && w % 100 === 0
            ),
          });
        }
      }
    }
  }

  // Limit to 2 font families maximum
  return validFonts.slice(0, 2);
}
