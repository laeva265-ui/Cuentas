import { ColorThemeId } from '../types';

export interface ThemeDefinition {
  id: ColorThemeId;
  name: string;
  subtitle: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgGradient: string;
  previewColors: [string, string, string]; // [primary, secondary, accent]
}

export const APP_THEMES: ThemeDefinition[] = [
  {
    id: 'navy',
    name: 'Azul FinFlow Clásico',
    subtitle: 'Banca tradicional institucional',
    badge: 'Original',
    primaryColor: '#0B1A2E',
    secondaryColor: '#1A3A5C',
    accentColor: '#D4A853',
    bgGradient: 'from-[#0B1A2E] via-[#122B4A] to-[#1A3A5C]',
    previewColors: ['#0B1A2E', '#1A3A5C', '#D4A853'],
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    subtitle: 'Prosperidad, patrimonio e inversión',
    badge: 'Popular',
    primaryColor: '#064E3B',
    secondaryColor: '#047857',
    accentColor: '#34D399',
    bgGradient: 'from-[#064E3B] via-[#047857] to-[#059669]',
    previewColors: ['#064E3B', '#047857', '#34D399'],
  },
  {
    id: 'burgundy',
    name: 'Borgoña Rubí',
    subtitle: 'Banca privada y tarjetas Black / Signature',
    badge: 'Premium',
    primaryColor: '#4C0519',
    secondaryColor: '#9F1239',
    accentColor: '#FDA4AF',
    bgGradient: 'from-[#4C0519] via-[#881337] to-[#BE123C]',
    previewColors: ['#4C0519', '#881337', '#FDA4AF'],
  },
  {
    id: 'gold',
    name: 'Dorado Imperial',
    subtitle: 'Lujo, prestigio y activos de alto valor',
    badge: 'Exclusivo',
    primaryColor: '#291E03',
    secondaryColor: '#5E4207',
    accentColor: '#FDE047',
    bgGradient: 'from-[#291E03] via-[#453205] to-[#785409]',
    previewColors: ['#291E03', '#5E4207', '#FDE047'],
  },
  {
    id: 'purple',
    name: 'Amatista Fintech',
    subtitle: 'Innovación neobancaria y modernidad',
    badge: 'Moderno',
    primaryColor: '#2E1065',
    secondaryColor: '#581C87',
    accentColor: '#D8B4FE',
    bgGradient: 'from-[#2E1065] via-[#4C1D95] to-[#6B21A8]',
    previewColors: ['#2E1065', '#4C1D95', '#D8B4FE'],
  },
  {
    id: 'slate',
    name: 'Titanio y Carbón',
    subtitle: 'Minimalismo ejecutivo y grafito ultra limpio',
    badge: 'Minimal',
    primaryColor: '#0F172A',
    secondaryColor: '#1E293B',
    accentColor: '#94A3B8',
    bgGradient: 'from-[#0F172A] via-[#1E293B] to-[#334155]',
    previewColors: ['#0F172A', '#1E293B', '#94A3B8'],
  },
  {
    id: 'ocean',
    name: 'Océano Zafiro',
    subtitle: 'Frescura, claridad y tecnología digital',
    badge: 'Fresco',
    primaryColor: '#082F49',
    secondaryColor: '#0369A1',
    accentColor: '#7DD3FC',
    bgGradient: 'from-[#082F49] via-[#0C4A6E] to-[#0284C7]',
    previewColors: ['#082F49', '#0C4A6E', '#7DD3FC'],
  },
];

export const getThemeById = (id?: ColorThemeId): ThemeDefinition => {
  return APP_THEMES.find((t) => t.id === id) || APP_THEMES[0];
};

export const applyAppTheme = (themeId: ColorThemeId = 'navy') => {
  try {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('finflow_app_theme', themeId);
  } catch (e) {
    console.error('Error applying theme:', e);
  }
};
