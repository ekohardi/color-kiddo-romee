export type ToolType = 'fill' | 'crayon' | 'marker' | 'rainbow' | 'eraser';

export type BrushSize = 'sm' | 'md' | 'lg';

export type AppView = 'library' | 'studio' | 'import' | 'artbook';

export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
}

export interface ColoringTemplate {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium';
  source: 'starter' | 'custom';
  /** Transparent PNG or SVG data URL containing dark outlines only */
  lineArtUrl: string;
  createdAt: number;
}

export interface SavedArtwork {
  id: string;
  templateId: string;
  title: string;
  /** Flattened white-paper + paint + outline PNG data URL */
  previewDataUrl: string;
  /** Paint-only layer PNG data URL so kids can resume coloring */
  paintDataUrl: string;
  lineArtUrl: string;
  updatedAt: number;
}
