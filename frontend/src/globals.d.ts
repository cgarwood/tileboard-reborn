declare module '*.css';
declare module '@fontsource/*' {}
declare module '@fontsource-variable/*' {}

/** Fully Kiosk Browser's JavaScript interface. Only present when running inside Fully Kiosk. */
interface FullyKiosk {
  getDeviceId(): string;
  getBatteryLevel(): number;
  isPlugged(): boolean;
  bind(event: string, jsCode: string): void;
  /** Volume of an Android audio stream, in percent (0-100) */
  getAudioVolume(stream: number): number;
  /** `level` in percent (0-100); Android rounds it to the stream's nearest volume step */
  setAudioVolume(level: number, stream: number): void;
}

interface Window {
  fully?: FullyKiosk;
}
