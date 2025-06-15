/**
 * Color Generator Utility
 * Generates consistent dark shade colors for logos/avatars
 */

export interface ColorConfig {
  saturation?: number;
  lightness?: number;
  opacity?: number;
}

export class ColorGenerator {

  /**
   * Predefined dark color palette for consistency
   */
  private static readonly DARK_COLORS = [
    '#1a1a1a', // Charcoal
    '#2d3748', // Dark Gray Blue
    '#1a202c', // Dark Navy
    '#2d3748', // Slate
    '#4a5568', // Cool Gray
    '#2b6cb0', // Dark Blue
    '#3182ce', // Blue
    '#2c5282', // Navy Blue
    '#319795', // Teal
    '#2f855a', // Green
    '#38a169', // Forest Green
    '#d69e2e', // Golden
    '#dd6b20', // Orange
    '#e53e3e', // Red
    '#9f7aea', // Purple
    '#805ad5', // Violet
    '#ed64a6', // Pink
    '#f56565', // Light Red
    '#4fd1c7', // Cyan
    '#68d391'  // Light Green
  ];

  /**
   * Generate a deterministic color based on input string
   * Same input always returns the same color
   */
  static generateColorFromString(input: string): string {
    if (!input) return this.DARK_COLORS[0];

    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use absolute value and modulo to get array index
    const index = Math.abs(hash) % this.DARK_COLORS.length;
    return this.DARK_COLORS[index];
  }

  /**
   * Generate random dark color with HSL
   */
  static generateRandomDarkColor(config: ColorConfig = {}): string {
    const {
      saturation = 60 + Math.random() * 40, // 60-100%
      lightness = 20 + Math.random() * 25,  // 20-45% (dark range)
      opacity = 1
    } = config;

    const hue = Math.random() * 360; // 0-360 degrees

    if (opacity < 1) {
      return `hsla(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%, ${opacity})`;
    }

    return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
  }

  /**
   * Generate a gradient background
   */
  static generateGradientBackground(input: string): string {
    const color1 = this.generateColorFromString(input);
    const color2 = this.generateColorFromString(input + 'gradient');

    return `linear-gradient(135deg, ${color1}, ${color2})`;
  }

  /**
   * Get contrasting text color (white or black) for a given background
   */
  static getContrastingTextColor(backgroundColor: string): string {
    // For dark backgrounds, always return white
    // This is simplified since we're generating dark colors
    return '#ffffff';
  }

  /**
   * Generate color based on company/dish category
   */
  static generateCategoryColor(category: string): string {
    const categoryColors: Record<string, string> = {
      'tech': '#2563eb',
      'finance': '#059669',
      'healthcare': '#dc2626',
      'education': '#7c3aed',
      'food': '#ea580c',
      'retail': '#db2777',
      'media': '#0891b2',
      'consulting': '#4338ca',
      'startup': '#65a30d',
      'default': '#1f2937'
    };

    const key = category.toLowerCase();
    return categoryColors[key] || categoryColors['default'];
  }

  /**
   * Utility to lighten/darken a color
   */
  static adjustColorBrightness(color: string, percent: number): string {
    // Simple implementation - you might want to use a more sophisticated color manipulation library
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
}

/**
 * Convenience functions for direct use
 */
export const generateCompanyColor = ColorGenerator.generateColorFromString;
export const generateRandomDarkColor = ColorGenerator.generateRandomDarkColor;
export const generateGradientBG = ColorGenerator.generateGradientBackground;
export const getCategoryColor = ColorGenerator.generateCategoryColor;
