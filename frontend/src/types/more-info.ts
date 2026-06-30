export interface MoreInfoConfig {
  disabled?: boolean;
  entity_id?: string;
  title?: string | Record<string, string>;
  subtitle?: string | Record<string, string>;
  header_background?: string | Record<string, string>;
  chart?: false;
  chart_hours?: number;
  chart_min?: number;
  chart_max?: number;
}
