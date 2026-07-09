import type { Locale } from "../i18n.js";
import { t } from "../i18n.js";
import type { MatchClock, MatchDetail, MatchStatus, Shootout } from "../types/domain.js";
import { flagLabel } from "../util/countryFlags.js";
import { resultColors } from "./resultColor.js";

function formatClock(status: MatchStatus, clock: MatchClock, locale: Locale): string {
  const messages = t(locale);
  if (status !== "IN_PLAY") return messages.statusLabels[status];
  if (clock.minute === null) return "-";
  return clock.injury ? `${clock.minute}+${clock.injury}'` : `${clock.minute}'`;
}

export function renderScoreboard(match: MatchDetail, clock: MatchClock, locale: Locale, shootout?: Shootout): string {
  const messages = t(locale);
  const home = flagLabel(match.homeTeam.abbreviation, match.homeTeam.name);
  const away = flagLabel(match.awayTeam.abbreviation, match.awayTeam.name);
  const homeScore = match.score.home ?? 0;
  const awayScore = match.score.away ?? 0;
  const clockText = formatClock(match.status, clock, locale);
  const colors = resultColors(match, shootout);
  const shootoutSuffix =
    shootout && shootout.source === "api" && shootout.kicks.length > 0
      ? `  {yellow-fg}${messages.shootoutScoreSuffix(shootout.homeScore, shootout.awayScore)}{/yellow-fg}`
      : "";

  return [
    `{bold}${match.competition}{/bold}`,
    `{${colors.home}-fg}{bold}${home}{/bold}{/${colors.home}-fg}  ${homeScore} - ${awayScore}${shootoutSuffix}  {${colors.away}-fg}{bold}${away}{/bold}{/${colors.away}-fg}    {yellow-fg}${clockText}{/yellow-fg}`,
  ].join("\n");
}
