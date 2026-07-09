export interface YMD {
  y: number;
  m: number;
  d: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatYMD(ymd: YMD): string {
  return `${ymd.y}-${pad2(ymd.m)}-${pad2(ymd.d)}`;
}

/** 실제 타임존 변환이 아니라 순수 달력 계산이라 UTC 트릭을 써도 안전하다 */
function addDays(ymd: YMD, days: number): YMD {
  const utc = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d + days));
  return { y: utc.getUTCFullYear(), m: utc.getUTCMonth() + 1, d: utc.getUTCDate() };
}

function zonePartsAt(date: Date, timeZone: string): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
}

/** date라는 순간을 timeZone에서 "벽시계"로 읽었을 때와, 그걸 그대로 UTC로 해석했을 때의 차이(ms) */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = zonePartsAt(date, timeZone);
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return asUtc - date.getTime();
}

/** "timeZone에서 ymd 00:00:00"에 해당하는 실제 UTC 순간을 구한다 (라이브러리 없이 Intl만으로) */
function zonedMidnightToUtc(ymd: YMD, timeZone: string): Date {
  const guess = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 0, 0, 0));
  const offset = zoneOffsetMs(guess, timeZone);
  return new Date(guess.getTime() - offset);
}

export function zonedTodayYMD(timeZone: string): YMD {
  const p = zonePartsAt(new Date(), timeZone);
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day) };
}

/**
 * offsetDays만큼 떨어진 "그 나라 기준 하루"의 [start, end) UTC 범위.
 * ESPN의 dates= 파라미터는 UTC 하루 단위라, 이 나라의 하루가 UTC 이틀에 걸칠 수 있어서
 * (예: 한국 새벽 0~8시대는 UTC로 전날) 이 범위로 직접 필터링해야 정확하다.
 */
export function zonedDayBounds(offsetDays: number, timeZone: string): { start: Date; end: Date; ymd: YMD } {
  const ymd = addDays(zonedTodayYMD(timeZone), offsetDays);
  const start = zonedMidnightToUtc(ymd, timeZone);
  const end = zonedMidnightToUtc(addDays(ymd, 1), timeZone);
  return { start, end, ymd };
}
