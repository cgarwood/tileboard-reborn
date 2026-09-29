// Shared date/time formatters in the browser's default locale. Building an Intl.DateTimeFormat is
// expensive (toLocaleDateString/toLocaleTimeString with options builds a new one per call), so
// render paths should use these instead.

/** "3:45 PM" */
export const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** "03:45 PM" */
export const time2DigitFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

/** "3 PM" */
export const hourFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });

/** "Tue" */
export const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

/** "Tue, Sep 29" */
export const shortDateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

/** "Tuesday, September 29" */
export const longDateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});
