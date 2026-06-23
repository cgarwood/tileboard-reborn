import type { Section } from './sections';

export type Page = {
  id: string;
  name: string;
  icon: string;
  grid_size?: number;
  sections: (Section | 'break')[];
  background: BackgroundConfig;
  toolbar_background?: string | Record<string, string>;
  hide_from_nav?: boolean;
};

export type BackgroundConfig = {
  image?: string;
  color?: string;
  style?: Record<string, string | number>;
};
