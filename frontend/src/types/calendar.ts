export interface CalendarEvent {
  summary: string;
  start: string; // ISO datetime ("2025-01-15T09:00:00+00:00") or date-only ("2025-01-15") for all-day
  end: string;
  description?: string;
  location?: string;
}

export interface CalendarEntry {
  entity: string;
  color?: string;
  name?: string;
}
