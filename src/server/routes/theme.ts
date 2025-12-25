/**
 * Theme Generation API Route
 *
 * POST /api/theme/generate - Generate a new theme based on signals
 */

import { Hono } from 'hono';
import { generateText } from 'ai';
import { getModel, isProviderEnabled, type ProviderName } from '../lib/providers';
import { processCSSForTheme } from '../lib/css-sanitizer';
import { buildThemePrompt, parseThemeResponse } from '../lib/theme-prompts';
import type {
  ThemeGenerateRequest,
  ThemeGenerateResponse,
  ThemePreferences,
} from '../../client/types/theme';

export const themeRoute = new Hono();

/**
 * POST /api/theme/generate
 *
 * Generates a new theme using the specified LLM provider and model.
 * The response includes sanitized CSS and validation results.
 */
themeRoute.post('/generate', async (c) => {
  try {
    const body = await c.req.json<ThemeGenerateRequest>();
    const { provider, model, signals, preferences, currentThemeCss } = body;

    console.log('Theme generation request:', {
      provider,
      model,
      signals: Object.keys(signals),
      preferences,
    });

    // Validate request
    if (!provider || !model) {
      return c.json<ThemeGenerateResponse>(
        {
          success: false,
          error: 'Missing required fields: provider and model',
        },
        400
      );
    }

    if (!signals || Object.keys(signals).length === 0) {
      return c.json<ThemeGenerateResponse>(
        {
          success: false,
          error: 'At least one signal is required',
        },
        400
      );
    }

    // Validate provider
    if (!isProviderEnabled(provider as ProviderName)) {
      return c.json<ThemeGenerateResponse>(
        {
          success: false,
          error: `Provider "${provider}" is not enabled or configured`,
        },
        400
      );
    }

    // Build the prompt
    const themePreferences: ThemePreferences = {
      useGoogleFonts: preferences?.useGoogleFonts ?? false,
      preferDarkMode: preferences?.preferDarkMode ?? false,
    };

    const prompt = buildThemePrompt(signals, themePreferences, currentThemeCss);

    // Get the model instance
    const modelInstance = getModel(provider as ProviderName, model);

    // Generate theme (non-streaming for structured output)
    console.log('Generating theme with LLM...');
    const result = await generateText({
      model: modelInstance,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: 0.9, // High creativity for unique themes
      maxOutputTokens: 2048,
    });

    console.log('LLM response received, parsing...');

    // Parse the generated theme
    const parsed = parseThemeResponse(result.text);
    if (!parsed.success || !parsed.css) {
      console.error('Failed to parse theme response:', parsed.error);
      return c.json<ThemeGenerateResponse>(
        {
          success: false,
          error: parsed.error || 'Failed to parse LLM response',
        },
        400
      );
    }

    // Process and sanitize the CSS
    console.log('Sanitizing CSS...');
    let processedCss: ReturnType<typeof processCSSForTheme>;
    try {
      processedCss = processCSSForTheme(parsed.css);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSS sanitization failed';
      console.error('CSS sanitization error:', message);
      return c.json<ThemeGenerateResponse>(
        {
          success: false,
          error: `CSS security check failed: ${message}`,
        },
        400
      );
    }

    // Check if we have any valid CSS after sanitization
    if (!processedCss.css || processedCss.css.trim() === '') {
      console.error('No valid CSS properties after sanitization');
      return c.json<ThemeGenerateResponse>(
        {
          success: false,
          error: 'Generated CSS had no valid theme properties',
          lintResults: processedCss.validation,
        },
        400
      );
    }

    console.log('Theme generated successfully:', parsed.name);

    return c.json<ThemeGenerateResponse>({
      success: true,
      theme: {
        name: parsed.name || 'Generated Theme',
        css: processedCss.css,
        fonts: parsed.fonts,
      },
      lintResults: processedCss.validation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Theme generation error:', message);
    return c.json<ThemeGenerateResponse>(
      {
        success: false,
        error: message,
      },
      500
    );
  }
});
