export interface VAATheme {
  background: string
  text: string
  accent: string
  border: string
  themeColorMeta: string
}

// Rothko — deep reds and blacks, colour field painting
export const THEME_ROTHKO: VAATheme = {
  background: '#8B1A1A',
  text: '#F5E6D3',
  accent: '#2C0A0A',
  border: '#F5E6D3',
  themeColorMeta: '#8B1A1A',
}

// Mondrian — primary colours, De Stijl
export const THEME_MONDRIAN: VAATheme = {
  background: '#F5F0E8',
  text: '#1A1A1A',
  accent: '#D4380A',
  border: '#1A1A1A',
  themeColorMeta: '#F5F0E8',
}

// Yves Klein — IKB blue, monochrome
export const THEME_KLEIN: VAATheme = {
  background: '#002FA7',
  text: '#F0EDE6',
  accent: '#FFD700',
  border: '#F0EDE6',
  themeColorMeta: '#002FA7',
}

// Basquiat — raw, urban, crown motifs
export const THEME_BASQUIAT: VAATheme = {
  background: '#1A1A1A',
  text: '#F5C518',
  accent: '#CC3300',
  border: '#F5C518',
  themeColorMeta: '#1A1A1A',
}

// Georgia O'Keeffe — desert bleached bone and sage
export const THEME_OKEEFFE: VAATheme = {
  background: '#E8DCC8',
  text: '#3D2B1F',
  accent: '#7A9E7E',
  border: '#3D2B1F',
  themeColorMeta: '#E8DCC8',
}

// Malevich — Suprematism, black square on white
export const THEME_MALEVICH: VAATheme = {
  background: '#F2EFE9',
  text: '#0D0D0D',
  accent: '#C8102E',
  border: '#0D0D0D',
  themeColorMeta: '#F2EFE9',
}

// Hockney — California pool, saturated leisure
export const THEME_HOCKNEY: VAATheme = {
  background: '#00A3CC',
  text: '#FFFFFF',
  accent: '#F5E642',
  border: '#FFFFFF',
  themeColorMeta: '#00A3CC',
}

// Turner — atmospheric fog, sublime landscape
export const THEME_TURNER: VAATheme = {
  background: '#C4B49A',
  text: '#2A2018',
  accent: '#E8720C',
  border: '#2A2018',
  themeColorMeta: '#C4B49A',
}

// Kusama — infinite dots, hot pink obsession
export const THEME_KUSAMA: VAATheme = {
  background: '#FF0066',
  text: '#F5F5F5',
  accent: '#FFD700',
  border: '#F5F5F5',
  themeColorMeta: '#FF0066',
}

// Hopper — American loneliness, diner light at night
export const THEME_HOPPER: VAATheme = {
  background: '#1C2B3A',
  text: '#F0D080',
  accent: '#4A7C59',
  border: '#F0D080',
  themeColorMeta: '#1C2B3A',
}

export const VAA_THEME_SEQUENCE: readonly VAATheme[] = [
  THEME_ROTHKO,
  THEME_MONDRIAN,
  THEME_KLEIN,
  THEME_BASQUIAT,
  THEME_OKEEFFE,
  THEME_MALEVICH,
  THEME_HOCKNEY,
  THEME_TURNER,
  THEME_KUSAMA,
  THEME_HOPPER,
] as const
