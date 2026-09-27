const units: [short: string, long: string, seconds: number][] = [
  ["y", "year", 365 * 24 * 60 * 60],
  ["mo", "month", 30 * 24 * 60 * 60],
  ["d", "day", 24 * 60 * 60],
  ["h", "hour", 60 * 60],
  ["min", "minute", 60],
  ["s", "second", 1],
];

export default function timeAgo(date: Date, long = false): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  for (const [short, name, secondsPerUnit] of units) {
    const interval = Math.floor(seconds / secondsPerUnit);
    if (interval >= 1) {
      return long ? `${interval} ${name}${interval > 1 ? "s" : ""} ago` : `${interval}${short}`;
    }
  }

  return long ? "just now" : "now";
}
