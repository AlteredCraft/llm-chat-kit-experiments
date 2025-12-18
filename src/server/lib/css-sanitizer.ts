/**
 * CSS Sanitizer for AI-generated theme CSS
 *
 * Security-focused sanitization using a whitelist approach.
 * Only allows CSS custom properties with validated values.
 */

import {
  THEMEABLE_COLORS,
  THEMEABLE_TYPOGRAPHY,
  type ThemeableVar,
} from '../../client/types/theme';

// =============================================================================
// Validation Patterns
// =============================================================================

/**
 * Pattern for valid hex colors (#RGB, #RRGGBB, #RRGGBBAA)
 */
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Pattern for valid size values (rem, em, px)
 */
const SIZE_PATTERN = /^[\d.]+(?:rem|em|px)$/;

/**
 * Pattern for valid font weight values (100-900)
 */
const FONT_WEIGHT_PATTERN = /^[1-9]00$/;

/**
 * Pattern for valid font family stacks
 * Allows: letters, spaces, hyphens, quotes, commas
 */
const FONT_FAMILY_PATTERN = /^[a-zA-Z\s\-,'"]+$/;

/**
 * Patterns that indicate dangerous CSS (security risks)
 */
const DANGEROUS_PATTERNS: readonly RegExp[] = [
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /@import/gi,
  /url\s*\(/gi,
  /behavior\s*:/gi,
  /-moz-binding/gi,
  /data\s*:/gi,
  /-o-link/gi,
  /-o-link-source/gi,
  /binding\s*:/gi,
];

// =============================================================================
// Whitelist Configuration
// =============================================================================

type ValueValidator = (value: string) => boolean;

const colorValidator: ValueValidator = (value) => HEX_COLOR_PATTERN.test(value);

const sizeValidator: ValueValidator = (value) => SIZE_PATTERN.test(value);

const fontWeightValidator: ValueValidator = (value) =>
  FONT_WEIGHT_PATTERN.test(value);

const fontFamilyValidator: ValueValidator = (value) =>
  FONT_FAMILY_PATTERN.test(value);

/**
 * Whitelist of allowed CSS properties with their validators
 */
const PROPERTY_VALIDATORS: Record<ThemeableVar, ValueValidator> = {
  // Color properties
  '--color-bg': colorValidator,
  '--color-fg': colorValidator,
  '--color-border': colorValidator,
  '--color-muted': colorValidator,
  '--color-user-bg': colorValidator,
  '--color-assistant-bg': colorValidator,
  '--color-accent-blue': colorValidator,
  '--color-accent-blue-light': colorValidator,
  '--color-accent-orange': colorValidator,
  '--color-accent-yellow': colorValidator,

  // Typography - font family
  '--font-family': fontFamilyValidator,
  '--font-family-mono': fontFamilyValidator,

  // Typography - sizes
  '--font-size-xs': sizeValidator,
  '--font-size-sm': sizeValidator,
  '--font-size-md': sizeValidator,
  '--font-size-lg': sizeValidator,
  '--font-size-xl': sizeValidator,

  // Typography - weights
  '--font-weight-normal': fontWeightValidator,
  '--font-weight-medium': fontWeightValidator,
  '--font-weight-semibold': fontWeightValidator,
  '--font-weight-bold': fontWeightValidator,
};

const ALLOWED_PROPERTIES = new Set<string>([
  ...THEMEABLE_COLORS,
  ...THEMEABLE_TYPOGRAPHY,
]);

// =============================================================================
// Validation Result Types
// =============================================================================

export interface CSSValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface CSSSanitizeResult {
  css: string;
  removedProperties: string[];
  sanitizedValues: Array<{ property: string; original: string; reason: string }>;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Check if CSS contains any dangerous patterns.
 * Throws an error if dangerous content is detected.
 */
export function checkDangerousPatterns(css: string): void {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(css)) {
      throw new Error(`CSS contains forbidden pattern: ${pattern.source}`);
    }
  }
}

/**
 * Parse CSS custom properties from a CSS string.
 * Extracts property-value pairs from :root {} blocks or standalone declarations.
 */
export function parseCustomProperties(
  css: string
): Array<{ property: string; value: string; original: string }> {
  const results: Array<{ property: string; value: string; original: string }> =
    [];

  // Match CSS custom properties with their values
  // Handles: --property-name: value;
  const propertyPattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match;

  while ((match = propertyPattern.exec(css)) !== null) {
    const property = match[1].trim();
    const value = match[2].trim();
    results.push({
      property,
      value,
      original: match[0],
    });
  }

  return results;
}

/**
 * Validate a single CSS property and its value.
 * Returns null if valid, or an error message if invalid.
 */
export function validateProperty(
  property: string,
  value: string
): string | null {
  // Check if property is in whitelist
  if (!ALLOWED_PROPERTIES.has(property)) {
    return `Property "${property}" is not in the whitelist`;
  }

  // Get the validator for this property
  const validator = PROPERTY_VALIDATORS[property as ThemeableVar];
  if (!validator) {
    return `No validator found for property "${property}"`;
  }

  // Validate the value
  if (!validator(value)) {
    return `Invalid value "${value}" for property "${property}"`;
  }

  return null;
}

/**
 * Validate CSS syntax and structure.
 */
export function validateCSS(css: string): CSSValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for dangerous patterns first
  try {
    checkDangerousPatterns(css);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return { valid: false, warnings, errors };
  }

  // Check for balanced braces
  const openBraces = (css.match(/{/g) || []).length;
  const closeBraces = (css.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Unbalanced braces in CSS');
  }

  // Check for unclosed strings
  const singleQuotes = (css.match(/'/g) || []).length;
  const doubleQuotes = (css.match(/"/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    errors.push('Unclosed single quote in CSS');
  }
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unclosed double quote in CSS');
  }

  // Check for valid property format
  const properties = parseCustomProperties(css);
  if (properties.length === 0) {
    warnings.push('No valid CSS custom properties found');
  }

  // Validate each property
  for (const { property, value } of properties) {
    const error = validateProperty(property, value);
    if (error) {
      warnings.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Sanitize CSS by removing non-whitelisted properties and invalid values.
 * Returns only valid CSS custom properties.
 */
export function sanitizeCSS(css: string): CSSSanitizeResult {
  // First check for dangerous patterns
  checkDangerousPatterns(css);

  const properties = parseCustomProperties(css);
  const validProperties: string[] = [];
  const removedProperties: string[] = [];
  const sanitizedValues: Array<{
    property: string;
    original: string;
    reason: string;
  }> = [];

  for (const { property, value } of properties) {
    const error = validateProperty(property, value);
    if (error) {
      removedProperties.push(property);
      sanitizedValues.push({
        property,
        original: value,
        reason: error,
      });
    } else {
      validProperties.push(`  ${property}: ${value};`);
    }
  }

  // Rebuild CSS with only valid properties
  const sanitizedCSS =
    validProperties.length > 0
      ? `:root {\n${validProperties.join('\n')}\n}`
      : '';

  return {
    css: sanitizedCSS,
    removedProperties,
    sanitizedValues,
  };
}

/**
 * Full sanitization pipeline: validate and sanitize CSS.
 * Throws on dangerous patterns, returns sanitized CSS otherwise.
 */
export function processCSSForTheme(css: string): {
  css: string;
  validation: CSSValidationResult;
  sanitization: CSSSanitizeResult;
} {
  const validation = validateCSS(css);
  const sanitization = sanitizeCSS(css);

  return {
    css: sanitization.css,
    validation,
    sanitization,
  };
}
