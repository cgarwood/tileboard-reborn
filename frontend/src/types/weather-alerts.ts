export interface WeatherAlert {
  id: string;
  event: string;
  headline: string | null;
  description: string | null;
  instruction: string | null;
  severity: string;
  urgency: string;
  certainty: string;
  status: string;
  messageType: string;
  areaDesc: string;
  sent: string;
  effective: string;
  onset: string | null;
  expires: string;
  ends: string | null;
  senderName: string;
}
