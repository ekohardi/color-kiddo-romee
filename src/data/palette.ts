import { ColorSwatch } from '../types/coloring';

export const CRAYON_PALETTE: ColorSwatch[] = [
  { id: 'coral', name: 'Coral Red', hex: '#FF4D3D' },
  { id: 'orange', name: 'Tangerine', hex: '#FF9626' },
  { id: 'yellow', name: 'Sunny Yellow', hex: '#FFD22E' },
  { id: 'green', name: 'Meadow Green', hex: '#26B872' },
  { id: 'teal', name: 'Mint Teal', hex: '#14B8A6' },
  { id: 'sky', name: 'Sky Blue', hex: '#38BDF8' },
  { id: 'blue', name: 'Ocean Blue', hex: '#2563EB' },
  { id: 'lavender', name: 'Lavender', hex: '#8B5CF6' },
  { id: 'pink', name: 'Bubblegum', hex: '#F45B9A' },
  { id: 'brown', name: 'Warm Brown', hex: '#9A5B3C' },
  { id: 'charcoal', name: 'Charcoal', hex: '#2A303C' },
  { id: 'cream', name: 'Paper White', hex: '#FFFFFF' },
];

export const BRUSH_RADII: Record<'sm' | 'md' | 'lg', number> = {
  sm: 10,
  md: 24,
  lg: 46,
};
