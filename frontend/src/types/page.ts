import type { Section } from './sections';
import type { VisibilityConfig } from './visibility';

export type Page = {
  id: string;
  name: string;
  icon: string;
  grid_size?: number;
  sections: (Section | 'break')[];
  background: BackgroundConfig;
  toolbar_background?: string | Record<string, string>;
  visibility?: VisibilityConfig;
};

export type BackgroundConfig = {
  image?: string;
  color?: string;
  style?: Record<string, string | number>;
};
