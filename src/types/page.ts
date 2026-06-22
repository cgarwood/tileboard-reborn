import type { Section } from './sections';

export type Page = {
  id: string;
  name: string;
  icon: string;
  gridSize?: number;
  sections: (Section | 'break')[];
  background: BackgroundConfig;
  toolbarBackground?: string | Record<string, string>;
};

export type BackgroundConfig = {
  image?: string;
  color?: string;
  style?: Record<string, string | number>;
};
