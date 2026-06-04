/**
 * Shared date/time utilities used across booking and table screens.
 */

/** Returns a YYYY-MM-DD string for the given date using the local timezone. */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Returns true if the given date+time string is more than 1 minute in the past. */
export const isTimeInPast = (dateStr: string, timeStr: string): boolean => {
  const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
  return startDateTime.getTime() < Date.now() - 60000;
};
