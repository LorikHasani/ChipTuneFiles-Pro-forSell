import { create } from 'zustand';
import api from '../lib/api';
import type { BrandingSettings } from '../types';

// Convert hex color to RGB values for CSS variables
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '220 38 38'; // default red
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

// Generate color shades from a base hex color
function generateColorShades(hex: string): Record<string, string> {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.split(' ').map(Number);

  return {
    '50': `${Math.min(255, r + 200)} ${Math.min(255, g + 200)} ${Math.min(255, b + 200)}`,
    '100': `${Math.min(255, r + 170)} ${Math.min(255, g + 170)} ${Math.min(255, b + 170)}`,
    '200': `${Math.min(255, r + 130)} ${Math.min(255, g + 130)} ${Math.min(255, b + 130)}`,
    '300': `${Math.min(255, r + 80)} ${Math.min(255, g + 80)} ${Math.min(255, b + 80)}`,
    '400': `${Math.min(255, r + 40)} ${Math.min(255, g + 40)} ${Math.min(255, b + 40)}`,
    '500': rgb,
    '600': `${Math.max(0, r - 20)} ${Math.max(0, g - 20)} ${Math.max(0, b - 20)}`,
    '700': `${Math.max(0, r - 50)} ${Math.max(0, g - 50)} ${Math.max(0, b - 50)}`,
    '800': `${Math.max(0, r - 80)} ${Math.max(0, g - 80)} ${Math.max(0, b - 80)}`,
    '900': `${Math.max(0, r - 110)} ${Math.max(0, g - 110)} ${Math.max(0, b - 110)}`,
    '950': `${Math.max(0, r - 140)} ${Math.max(0, g - 140)} ${Math.max(0, b - 140)}`,
  };
}

function applyBrandingColors(primaryColor: string) {
  const shades = generateColorShades(primaryColor);
  const root = document.documentElement;
  Object.entries(shades).forEach(([shade, value]) => {
    root.style.setProperty(`--color-primary-${shade}`, value);
  });
}

const defaultBranding: BrandingSettings = {
  brand_name: 'ChipTuneFiles',
  logo_url: '',
  primary_color: '#dc2626',
  accent_color: '#b91c1c',
  contact_email: '',
  currency_symbol: '€',
  support_url: '',
};

interface BrandingState {
  branding: BrandingSettings;
  isLoaded: boolean;
  loadBranding: () => Promise<void>;
}

export const useBrandingStore = create<BrandingState>((set) => ({
  branding: defaultBranding,
  isLoaded: false,

  loadBranding: async () => {
    try {
      const { data } = await api.get<{ settings: BrandingSettings }>('/settings/branding');
      const branding = { ...defaultBranding, ...data.settings };
      applyBrandingColors(branding.primary_color);
      set({ branding, isLoaded: true });
    } catch {
      // Use defaults
      applyBrandingColors(defaultBranding.primary_color);
      set({ isLoaded: true });
    }
  },
}));
