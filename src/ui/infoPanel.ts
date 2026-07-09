import type { Locale } from "../i18n.js";
import { t } from "../i18n.js";
import type { HeadToHead, Lineups, MatchStats, RecentForm, StatSection } from "../types/domain.js";

const RESULT_COLOR: Record<"W" | "D" | "L", string> = { W: "green", D: "grey", L: "red" };
const STAT_SECTION_ORDER: StatSection[] = ["attack", "discipline", "passing", "defense"];
const STAT_BAR_WIDTH = 14;

function statRow(label: string, home: number, away: number): string {
  const total = home + away;
  const homeBlocks = total > 0 ? Math.round((home / total) * STAT_BAR_WIDTH) : Math.round(STAT_BAR_WIDTH / 2);
  const bar = "█".repeat(homeBlocks) + "▒".repeat(STAT_BAR_WIDTH - homeBlocks);
  return `${label.padEnd(20)} {cyan-fg}${String(home).padStart(4)}{/cyan-fg} |${bar}| {magenta-fg}${String(away).padEnd(4)}{/magenta-fg}`;
}

function renderStats(stats: MatchStats, locale: Locale): string[] {
  const messages = t(locale);
  const lines: string[] = [`{bold}${messages.statsLabel.trim()}{/bold}`];
  if (stats.source !== "api" || stats.rows.length === 0) {
    lines.push(`{grey-fg}${messages.statsUnavailable}{/grey-fg}`);
    return lines;
  }
  for (const section of STAT_SECTION_ORDER) {
    const rows = stats.rows.filter((r) => r.section === section);
    if (rows.length === 0) continue;
    lines.push("");
    lines.push(`{underline}${messages.statSectionLabels[section]}{/underline}`);
    rows.forEach((row, i) => {
      if (i > 0) lines.push("");
      lines.push(statRow(row.label, row.home, row.away));
    });
  }
  return lines;
}

/** 선발 라인업 자체는 그라운드 그리드 위에 포메이션 모양으로 그려지므로, 여기서는 포메이션 이름 + 벤치만 보여준다 */
function renderTeamBench(name: string, lineup: Lineups["home"], color: string, locale: Locale): string[] {
  const messages = t(locale);
  const formationText = lineup.formation ? `  ${messages.formationLabel(lineup.formation)}` : "";
  const lines: string[] = [`{${color}-fg}{bold}${name}{/bold}{/${color}-fg}${formationText}`];
  if (lineup.bench.length === 0) {
    lines.push(`  {grey-fg}${messages.lineupUnavailable}{/grey-fg}`);
    return lines;
  }
  lines.push(`  {bold}${messages.benchCountLabel(lineup.bench.length)}{/bold}`);
  lines.push(`  ${lineup.bench.map((p) => `${p.jersey} ${p.name}`).join("  ·  ")}`);
  return lines;
}

function renderForm(name: string, results: RecentForm["home"], color: string, locale: Locale): string[] {
  const messages = t(locale);
  const lines: string[] = [`{${color}-fg}{bold}${name}{/bold}{/${color}-fg}`];
  if (results.length === 0) {
    lines.push(`  {grey-fg}${messages.formUnavailable}{/grey-fg}`);
    return lines;
  }
  for (const r of results) {
    const badgeColor = RESULT_COLOR[r.result];
    lines.push(`  {${badgeColor}-fg}{bold}${r.result}{/bold}{/${badgeColor}-fg} ${r.score}  vs ${r.opponent}`);
  }
  return lines;
}

/** 그라운드 패널과 분리된 "통계 · 라인업 · 최근폼 · 상대전적" 패널 */
export function renderInfoPanel(params: {
  homeName: string;
  awayName: string;
  stats: MatchStats;
  lineups: Lineups;
  recentForm: RecentForm;
  headToHead: HeadToHead;
  locale: Locale;
}): string {
  const messages = t(params.locale);
  const lines: string[] = [];

  lines.push(...renderStats(params.stats, params.locale));

  lines.push("");
  lines.push(`{bold}${messages.lineupLabel.trim()}{/bold}`);
  if (params.lineups.source !== "api") {
    lines.push(`{grey-fg}${messages.lineupUnavailable}{/grey-fg}`);
  } else {
    lines.push(...renderTeamBench(params.homeName, params.lineups.home, "cyan", params.locale));
    lines.push("");
    lines.push(...renderTeamBench(params.awayName, params.lineups.away, "magenta", params.locale));
  }

  lines.push("");
  lines.push(`{bold}${messages.recentFormLabel}{/bold}`);
  if (params.recentForm.source !== "api") {
    lines.push(`  {grey-fg}${messages.formUnavailable}{/grey-fg}`);
  } else {
    lines.push(...renderForm(params.homeName, params.recentForm.home, "cyan", params.locale));
    lines.push("");
    lines.push(...renderForm(params.awayName, params.recentForm.away, "magenta", params.locale));
  }

  lines.push("");
  lines.push(`{bold}${messages.headToHeadLabel}{/bold}`);
  if (params.headToHead.source !== "api" || params.headToHead.games.length === 0) {
    lines.push(`  {grey-fg}${messages.headToHeadUnavailable}{/grey-fg}`);
  } else {
    for (const g of params.headToHead.games) {
      const date = new Date(g.date).toLocaleDateString();
      lines.push(`  {grey-fg}${date}{/grey-fg}  ${g.homeTeamName} ${g.score} ${g.awayTeamName}`);
    }
  }

  return lines.join("\n");
}
