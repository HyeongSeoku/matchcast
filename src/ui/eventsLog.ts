import type { Locale } from "../i18n.js";
import { t } from "../i18n.js";
import type { MatchEvent } from "../types/domain.js";

function formatMinute(minute: number | null, extraMinute: number | null): string {
  if (minute === null) return "  - ";
  const base = extraMinute ? `${minute}+${extraMinute}` : `${minute}`;
  return `${base.padStart(4, " ")}'`;
}

export function renderEventsLog(events: MatchEvent[], locale: Locale): string {
  if (events.length === 0) return `{grey-fg}${t(locale).noEvents}{/grey-fg}`;

  return events
    .map((event) => {
      const minute = formatMinute(event.minute, event.extraMinute);
      const color = event.team === "HOME" ? "cyan-fg" : event.team === "AWAY" ? "magenta-fg" : "white-fg";
      return `{${color}}${minute} ${event.detail}{/${color}}`;
    })
    .reverse()
    .join("\n");
}
