import { create } from 'zustand';
import api from '../lib/api';
import type { BrandingSettings } from '../types';

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
      // Always use hardcoded red — ignore any color settings from DB
      const branding = {
        ...defaultBranding,
        ...data.settings,
        primary_color: '#dc2626',
        accent_color: '#b91c1c',
      };
      set({ branding, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
}));
