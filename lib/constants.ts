export const PLATFORMS = [
  { value: 'base', label: 'Base', icon: '🔷' },
  { value: 'farcaster', label: 'Farcaster', icon: '🟣' },
  { value: 'zora', label: 'Zora', icon: '🟠' },
  { value: 'twitter', label: 'Twitter (X)', icon: '🐦' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'other', label: 'Other', icon: '🌐' },
] as const;

export type Platform = (typeof PLATFORMS)[number]['value'];