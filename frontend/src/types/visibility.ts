export interface VisibilityCondition {
  entity?: string;
  state?: string;
  not?: string;
  above?: number;
  below?: number;
  template?: string;
}

export interface VisibilityConfig {
  match?: 'all' | 'any';
  conditions: VisibilityCondition[];
}
