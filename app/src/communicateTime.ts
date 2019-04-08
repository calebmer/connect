/**
 * [thin space (U+2009)](https://graphemica.com/2009)
 */
const thinSpace = "\u2009";

/**
 * Communicates a time to a user.
 *
 * The units of time that are most relevant to a human will change as the time
 * moves further into the past. For example, for a time that occurred 5 years
 * ago the precise hour will matter less to a human then the fact that the time
 * occurred 5 years ago.
 *
 * Takes both a time to display and the “current time” which we will measure
 * the time to display against.
 */
export function communicateTime(currentTime: Date, time: Date): string {
  const millisecondsAgo = currentTime.getTime() - time.getTime();
  const daysAgo = millisecondsAgo / 1000 / 60 / 60 / 24;

  // If the year changed, then communicate that.
  if (currentTime.getFullYear() !== time.getFullYear()) {
    const n = currentTime.getFullYear() - time.getFullYear();
    return `${n}${thinSpace}year${n === 1 ? "" : "s"}`;
  }

  // If the month changed, then communicate that.
  //
  // However, only communicate the months if the date was more than 30 days ago.
  // Because today could be the first day of a new month. In that case we don’t
  // want to say “1 month ago”.
  if (currentTime.getMonth() !== time.getMonth() && daysAgo >= 30) {
    const n = currentTime.getMonth() - time.getMonth();
    return `${n}${thinSpace}month${n === 1 ? "" : "s"}`;
  }

  // If the day changed, then communicate that.
  if (currentTime.getDate() !== time.getDate()) {
    const n = Math.max(1, Math.floor(daysAgo));
    return `${n}${thinSpace}day${n === 1 ? "" : "s"}`;
  }

  // Otherwise, return the time in hours/minutes.
  const hours = time.getHours();
  const minutes = time.getMinutes();
  if (hours === 0) {
    return `12:${minutes}am`;
  } else if (hours === 12) {
    return `12:${minutes}pm`;
  } else if (hours > 12) {
    return `${hours - 12}:${minutes}pm`;
  } else {
    return `${hours}:${minutes}am`;
  }
}
