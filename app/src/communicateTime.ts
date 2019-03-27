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
  // If the year changed, then communicate that.
  if (currentTime.getFullYear() !== time.getFullYear()) {
    const yearsAgo = currentTime.getFullYear() - time.getFullYear();
    return `${yearsAgo} year${yearsAgo === 1 ? "" : "s"} ago`;
  }

  // If the month changed, then communicate that.
  if (currentTime.getMonth() !== time.getMonth()) {
    const monthsAgo = currentTime.getMonth() - time.getMonth();
    return `${monthsAgo} month${monthsAgo === 1 ? "" : "s"} ago`;
  }

  // If the day changed, then communicate that.
  if (currentTime.getDate() !== time.getDate()) {
    const daysAgo = currentTime.getDate() - time.getDate();
    return `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
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
