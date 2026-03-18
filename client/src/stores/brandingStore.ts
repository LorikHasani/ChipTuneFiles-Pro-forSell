import { create } from 'zustand';
import api from '../lib/api';
import type { BrandingSettings } from '../types';

const defaultBranding: BrandingSettings = {
  brand_name: 'ChipTuneFiles',
  logo_url: '',
  primary_color: '#171717',
  accent_color: '#404040',
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
      // Always use hardcoded neutral — ignore any color settings from DB
      const branding = {
        ...defaultBranding,
        ...data.settings,
        primary_color: '#171717',
        accent_color: '#404040',
      };
      set({ branding, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
}));
