export interface ColorPreset {
  name: string;
  color_temp?: number;
  rgb?: [number, number, number];
}

export type ListItemFeature = 'brightness_slider' | { color_presets: ColorPreset[] };

export interface ListItemConfig {
  entity?: string;
  name?: string | Record<string, string>;
  caption?: string | Record<string, string>;
  icon?: string | Record<string, string>;
  state?: string | Record<string, string>;
  restriction?: string;
  features?: ListItemFeature[];
  refresh_interval?: number;
}
