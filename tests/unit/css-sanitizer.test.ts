import { describe, it, expect } from 'bun:test';
import {
  checkDangerousPatterns,
  parseCustomProperties,
  validateProperty,
  validateCSS,
  sanitizeCSS,
  processCSSForTheme,
} from '../../src/server/lib/css-sanitizer';

describe('CSS Sanitizer', () => {
  describe('checkDangerousPatterns', () => {
    it('should pass safe CSS', () => {
      const safeCss = ':root { --color-bg: #ffffff; }';
      expect(() => checkDangerousPatterns(safeCss)).not.toThrow();
    });

    it('should reject javascript: URLs', () => {
      const dangerousCss = '--color-bg: javascript:alert(1);';
      expect(() => checkDangerousPatterns(dangerousCss)).toThrow(
        'forbidden pattern'
      );
    });

    it('should reject url() function', () => {
      const dangerousCss = '--color-bg: url(http://evil.com/bg.png);';
      expect(() => checkDangerousPatterns(dangerousCss)).toThrow(
        'forbidden pattern'
      );
    });

    it('should reject @import', () => {
      const dangerousCss = '@import url("evil.css"); --color-bg: #fff;';
      expect(() => checkDangerousPatterns(dangerousCss)).toThrow(
        'forbidden pattern'
      );
    });

    it('should reject expression()', () => {
      const dangerousCss = '--color-bg: expression(alert(1));';
      expect(() => checkDangerousPatterns(dangerousCss)).toThrow(
        'forbidden pattern'
      );
    });

    it('should reject behavior:', () => {
      const dangerousCss = '--color-bg: behavior:url(evil.htc);';
      expect(() => checkDangerousPatterns(dangerousCss)).toThrow(
        'forbidden pattern'
      );
    });

    it('should reject -moz-binding', () => {
      const dangerousCss = '--color-bg: -moz-binding: url(evil.xml);';
      expect(() => checkDangerousPatterns(dangerousCss)).toThrow(
        'forbidden pattern'
      );
    });

    it('should reject data: URLs', () => {
      const dangerousCss = '--color-bg: data:text/html,<script>alert(1)</script>';
      expect(() => checkDangerousPatterns(dangerousCss)).toThrow(
        'forbidden pattern'
      );
    });
  });

  describe('parseCustomProperties', () => {
    it('should parse single property', () => {
      const css = '--color-bg: #ffffff;';
      const result = parseCustomProperties(css);

      expect(result).toHaveLength(1);
      expect(result[0].property).toBe('--color-bg');
      expect(result[0].value).toBe('#ffffff');
    });

    it('should parse multiple properties', () => {
      const css = `
        --color-bg: #ffffff;
        --color-fg: #1a1a1a;
        --font-size-md: 1rem;
      `;
      const result = parseCustomProperties(css);

      expect(result).toHaveLength(3);
      expect(result[0].property).toBe('--color-bg');
      expect(result[1].property).toBe('--color-fg');
      expect(result[2].property).toBe('--font-size-md');
    });

    it('should parse properties from :root block', () => {
      const css = `:root {
        --color-bg: #ffffff;
        --color-fg: #1a1a1a;
      }`;
      const result = parseCustomProperties(css);

      expect(result).toHaveLength(2);
    });

    it('should handle values with spaces', () => {
      const css = `--font-family: 'Open Sans', sans-serif;`;
      const result = parseCustomProperties(css);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("'Open Sans', sans-serif");
    });

    it('should return empty array for CSS without custom properties', () => {
      const css = 'body { color: red; }';
      const result = parseCustomProperties(css);

      expect(result).toHaveLength(0);
    });
  });

  describe('validateProperty', () => {
    describe('color properties', () => {
      it('should accept valid 6-digit hex color', () => {
        const error = validateProperty('--color-bg', '#ffffff');
        expect(error).toBeNull();
      });

      it('should accept valid 3-digit hex color', () => {
        const error = validateProperty('--color-bg', '#fff');
        expect(error).toBeNull();
      });

      it('should accept valid 8-digit hex color (with alpha)', () => {
        const error = validateProperty('--color-bg', '#ffffff80');
        expect(error).toBeNull();
      });

      it('should reject invalid hex color', () => {
        const error = validateProperty('--color-bg', 'not-a-color');
        expect(error).toContain('Invalid value');
      });

      it('should reject rgb() format', () => {
        const error = validateProperty('--color-bg', 'rgb(255, 255, 255)');
        expect(error).toContain('Invalid value');
      });

      it('should reject color names', () => {
        const error = validateProperty('--color-bg', 'red');
        expect(error).toContain('Invalid value');
      });
    });

    describe('size properties', () => {
      it('should accept rem units', () => {
        const error = validateProperty('--font-size-md', '1rem');
        expect(error).toBeNull();
      });

      it('should accept em units', () => {
        const error = validateProperty('--font-size-md', '1.5em');
        expect(error).toBeNull();
      });

      it('should accept px units', () => {
        const error = validateProperty('--font-size-md', '16px');
        expect(error).toBeNull();
      });

      it('should accept decimal values', () => {
        const error = validateProperty('--font-size-md', '0.875rem');
        expect(error).toBeNull();
      });

      it('should reject unitless values', () => {
        const error = validateProperty('--font-size-md', '16');
        expect(error).toContain('Invalid value');
      });

      it('should reject percentage units', () => {
        const error = validateProperty('--font-size-md', '100%');
        expect(error).toContain('Invalid value');
      });
    });

    describe('font weight properties', () => {
      it('should accept valid weights (100-900)', () => {
        const weights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
        for (const weight of weights) {
          const error = validateProperty('--font-weight-normal', weight);
          expect(error).toBeNull();
        }
      });

      it('should reject invalid weights', () => {
        const error = validateProperty('--font-weight-normal', '450');
        expect(error).toContain('Invalid value');
      });

      it('should reject keyword weights', () => {
        const error = validateProperty('--font-weight-normal', 'bold');
        expect(error).toContain('Invalid value');
      });
    });

    describe('font family properties', () => {
      it('should accept simple font names', () => {
        const error = validateProperty('--font-family', 'Arial');
        expect(error).toBeNull();
      });

      it('should accept font stacks', () => {
        const error = validateProperty(
          '--font-family',
          "'Open Sans', Arial, sans-serif"
        );
        expect(error).toBeNull();
      });

      it('should accept system font stacks', () => {
        const error = validateProperty(
          '--font-family',
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        );
        expect(error).toBeNull();
      });

      it('should reject font families with special characters', () => {
        const error = validateProperty('--font-family', 'url(evil.com)');
        expect(error).toContain('Invalid value');
      });
    });

    describe('whitelist validation', () => {
      it('should reject non-whitelisted properties', () => {
        const error = validateProperty('--custom-property', '#ffffff');
        expect(error).toContain('not in the whitelist');
      });

      it('should reject standard CSS properties', () => {
        const error = validateProperty('color', '#ffffff');
        expect(error).toContain('not in the whitelist');
      });
    });
  });

  describe('validateCSS', () => {
    it('should pass valid CSS', () => {
      const css = `:root {
        --color-bg: #ffffff;
        --color-fg: #1a1a1a;
        --font-size-md: 1rem;
      }`;
      const result = validateCSS(css);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unbalanced braces', () => {
      const css = ':root { --color-bg: #ffffff;';
      const result = validateCSS(css);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unbalanced braces in CSS');
    });

    it('should detect unclosed single quotes', () => {
      const css = `:root { --font-family: 'Open Sans; }`;
      const result = validateCSS(css);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unclosed single quote in CSS');
    });

    it('should detect unclosed double quotes', () => {
      const css = `:root { --font-family: "Open Sans; }`;
      const result = validateCSS(css);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unclosed double quote in CSS');
    });

    it('should warn when no custom properties found', () => {
      const css = 'body { color: red; }';
      const result = validateCSS(css);

      expect(result.warnings).toContain('No valid CSS custom properties found');
    });

    it('should warn about invalid property values', () => {
      const css = ':root { --color-bg: not-a-color; }';
      const result = validateCSS(css);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Invalid value');
    });

    it('should fail on dangerous patterns', () => {
      const css = ':root { --color-bg: javascript:alert(1); }';
      const result = validateCSS(css);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('forbidden pattern');
    });
  });

  describe('sanitizeCSS', () => {
    it('should preserve valid properties', () => {
      const css = `
        --color-bg: #ffffff;
        --color-fg: #1a1a1a;
      `;
      const result = sanitizeCSS(css);

      expect(result.css).toContain('--color-bg: #ffffff');
      expect(result.css).toContain('--color-fg: #1a1a1a');
      expect(result.removedProperties).toHaveLength(0);
    });

    it('should remove non-whitelisted properties', () => {
      const css = `
        --color-bg: #ffffff;
        --custom-prop: red;
        --color-fg: #1a1a1a;
      `;
      const result = sanitizeCSS(css);

      expect(result.css).toContain('--color-bg');
      expect(result.css).toContain('--color-fg');
      expect(result.css).not.toContain('--custom-prop');
      expect(result.removedProperties).toContain('--custom-prop');
    });

    it('should remove properties with invalid values', () => {
      const css = `
        --color-bg: #ffffff;
        --color-fg: not-a-color;
      `;
      const result = sanitizeCSS(css);

      expect(result.css).toContain('--color-bg');
      expect(result.css).not.toContain('--color-fg');
      expect(result.removedProperties).toContain('--color-fg');
    });

    it('should throw on dangerous patterns', () => {
      const css = '--color-bg: url(evil.com);';
      expect(() => sanitizeCSS(css)).toThrow('forbidden pattern');
    });

    it('should return empty CSS when all properties are invalid', () => {
      const css = '--invalid-prop: invalid-value;';
      const result = sanitizeCSS(css);

      expect(result.css).toBe('');
    });

    it('should format output as :root block', () => {
      const css = '--color-bg: #ffffff;';
      const result = sanitizeCSS(css);

      expect(result.css).toMatch(/^:root \{[\s\S]*\}$/);
    });

    it('should record sanitization details', () => {
      const css = `
        --color-bg: #ffffff;
        --color-fg: invalid;
      `;
      const result = sanitizeCSS(css);

      expect(result.sanitizedValues).toHaveLength(1);
      expect(result.sanitizedValues[0].property).toBe('--color-fg');
      expect(result.sanitizedValues[0].original).toBe('invalid');
      expect(result.sanitizedValues[0].reason).toContain('Invalid value');
    });
  });

  describe('processCSSForTheme', () => {
    it('should return sanitized CSS and validation results', () => {
      const css = `:root {
        --color-bg: #ffffff;
        --color-fg: #1a1a1a;
      }`;
      const result = processCSSForTheme(css);

      expect(result.css).toContain('--color-bg');
      expect(result.css).toContain('--color-fg');
      expect(result.validation.valid).toBe(true);
      expect(result.sanitization.removedProperties).toHaveLength(0);
    });

    it('should handle mixed valid and invalid properties', () => {
      const css = `:root {
        --color-bg: #ffffff;
        --invalid: something;
        --color-fg: #1a1a1a;
      }`;
      const result = processCSSForTheme(css);

      expect(result.css).toContain('--color-bg');
      expect(result.css).toContain('--color-fg');
      expect(result.css).not.toContain('--invalid');
      expect(result.sanitization.removedProperties).toContain('--invalid');
    });

    it('should throw on dangerous CSS', () => {
      const css = '@import url("evil.css");';
      expect(() => processCSSForTheme(css)).toThrow('forbidden pattern');
    });
  });
});
