import type { Locale } from "../i18n.js";
import { t } from "../i18n.js";
import type { GameInfo, Lineups, LineupPlayer, PossessionStats } from "../types/domain.js";
import { flagEmoji } from "../util/countryFlags.js";

const WIDTH = 76;
const HEIGHT = 21;
const CENTER_ROW = Math.floor(HEIGHT / 2);
const CENTER_COL = Math.floor(WIDTH / 2);

type Owner = "home" | "away" | null;

function buildStructure(): string[][] {
  const grid: string[][] = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => " "));

  for (let row = 0; row < HEIGHT; row++) {
    grid[row]![CENTER_COL] = "¦";
  }

  const ringPoints: Array<[number, number]> = [
    [-3, 0], [3, 0], [0, -5], [0, 5],
    [-3, -3], [3, -3], [-3, 3], [3, 3],
  ];
  for (const [dRow, dCol] of ringPoints) {
    const row = CENTER_ROW + dRow;
    const col = CENTER_COL + dCol;
    if (row >= 0 && row < HEIGHT && col >= 0 && col < WIDTH) grid[row]![col] = "·";
  }

  drawBox(grid, 0, CENTER_ROW - 5, 9, CENTER_ROW + 5);
  drawBox(grid, WIDTH - 10, CENTER_ROW - 5, WIDTH - 1, CENTER_ROW + 5);

  return grid;
}

function drawBox(grid: string[][], left: number, top: number, right: number, bottom: number): void {
  for (let col = left; col <= right; col++) {
    if (top >= 0) grid[top]![col] = "─";
    if (bottom < HEIGHT) grid[bottom]![col] = "─";
  }
  for (let row = top; row <= bottom; row++) {
    if (row < 0 || row >= HEIGHT) continue;
    if (left > 0) grid[row]![left] = "│";
    if (right < WIDTH) grid[row]![right] = "│";
  }
}

function overlayText(grid: string[][], owner: Owner[][], row: number, startCol: number, text: string, side: Owner): void {
  for (let i = 0; i < text.length; i++) {
    const col = startCol + i;
    if (row < 0 || row >= HEIGHT || col < 0 || col >= WIDTH) continue;
    grid[row]![col] = text[i]!;
    owner[row]![col] = side;
  }
}

type PositionLine = "gk" | "def" | "mid" | "fwd";

function lineOf(abbr: string): PositionLine {
  const a = abbr.toUpperCase();
  if (a === "G" || a.includes("GK") || a.includes("GOALKEEPER")) return "gk";
  if (a.startsWith("CD") || a.endsWith("B") || a === "CB" || a === "SW") return "def";
  if (a.includes("M")) return "mid";
  return "fwd";
}

function sideKey(abbr: string): number {
  const a = abbr.toUpperCase();
  if (a.includes("L")) return -1;
  if (a.includes("R")) return 1;
  return 0;
}

interface PlacedPlayer {
  row: number;
  col: number;
  jersey: string;
  name: string;
}

/** formation 없이도(포지션만으로) 라인을 나눠 배치한다 — GK -> 수비 -> 미드 -> 공격 순으로 자기 진영 골대에서 중앙선 쪽으로 */
function placeFormation(players: LineupPlayer[], side: "home" | "away"): PlacedPlayer[] {
  const groups: Record<PositionLine, LineupPlayer[]> = { gk: [], def: [], mid: [], fwd: [] };
  for (const p of players) groups[lineOf(p.position)].push(p);

  const order: PositionLine[] = ["gk", "def", "mid", "fwd"];
  const activeGroups = order.filter((g) => groups[g].length > 0);
  if (activeGroups.length === 0) return [];

  const marginX = 4;
  const innerLimit = CENTER_COL - 9;
  const placed: PlacedPlayer[] = [];

  activeGroups.forEach((groupKey, i) => {
    const t = activeGroups.length === 1 ? 0 : i / (activeGroups.length - 1);
    const xFromOwnGoal = Math.round(marginX + t * (innerLimit - marginX));
    const col = side === "home" ? xFromOwnGoal : WIDTH - 1 - xFromOwnGoal;

    const linePlayers = [...groups[groupKey]].sort((a, b) => sideKey(a.position) - sideKey(b.position));
    const n = linePlayers.length;
    linePlayers.forEach((p, j) => {
      const rowT = n === 1 ? 0.5 : (j + 0.5) / n;
      const row = Math.round(2 + rowT * (HEIGHT - 5));
      placed.push({ row, col, jersey: p.jersey, name: p.name });
    });
  });

  return placed;
}

function drawPlayers(grid: string[][], owner: Owner[][], players: LineupPlayer[], side: "home" | "away"): void {
  for (const p of placeFormation(players, side)) {
    const marker = `(${p.jersey})`;
    overlayText(grid, owner, p.row, p.col - Math.floor(marker.length / 2), marker, side);
    const shortName = (p.name.split(" ").pop() ?? p.name).slice(0, 7);
    overlayText(grid, owner, p.row + 1, p.col - Math.floor(shortName.length / 2), shortName, side);
  }
}

function gameInfoLine(info: GameInfo, locale: Locale): string | null {
  if (!info.venue && !info.referee) return null;
  const messages = t(locale);
  return messages.gameInfo(
    info.venue ?? "-",
    info.city ?? "",
    info.attendance !== null ? info.attendance.toLocaleString() : "-",
    info.referee ?? "-",
  );
}

export function renderPitch(params: {
  homeName: string;
  awayName: string;
  possession: PossessionStats;
  gameInfo: GameInfo;
  lineups: Lineups;
  locale: Locale;
}): string {
  const messages = t(params.locale);
  const hasData = params.possession.source === "api";
  const homePct = hasData ? params.possession.home : 50;
  const awayPct = hasData ? params.possession.away : 50;
  const splitCol = Math.min(WIDTH - 1, Math.max(1, Math.round((homePct / 100) * WIDTH)));

  const grid = buildStructure();
  const owner: Owner[][] = Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => null));

  if (params.lineups.source === "api") {
    drawPlayers(grid, owner, params.lineups.home.starters, "home");
    drawPlayers(grid, owner, params.lineups.away.starters, "away");
  }

  const lines: string[] = [];

  const infoLine = gameInfoLine(params.gameInfo, params.locale);
  if (infoLine) {
    lines.push(`{grey-fg}${infoLine}{/grey-fg}`);
    lines.push("");
  }

  for (let row = 0; row < HEIGHT; row++) {
    let line = "";
    for (let col = 0; col < WIDTH; col++) {
      const owned = owner[row]![col];
      const ch = grid[row]![col]!;
      if (owned) {
        const color = owned === "home" ? "cyan" : "magenta";
        line += `{${color}-fg}{bold}${ch}{/bold}{/${color}-fg}`;
      } else if (col === splitCol) {
        line += hasData ? "{yellow-fg}{bold}┃{/bold}{/yellow-fg}" : "{grey-fg}┊{/grey-fg}";
      } else if (ch === " ") {
        const zoneColor = col < splitCol ? "cyan" : "magenta";
        line += `{${zoneColor}-fg}░{/${zoneColor}-fg}`;
      } else {
        line += `{grey-fg}${ch}{/grey-fg}`;
      }
    }
    lines.push(line);
  }
  if (params.lineups.source !== "api") {
    lines.push(`{grey-fg}${messages.lineupUnavailable}{/grey-fg}`);
  }

  lines.push("");
  if (!hasData) {
    const message = params.possession.source === "pending" ? messages.possessionPending : messages.possessionUnavailable;
    lines.push(`{grey-fg}${message}{/grey-fg}`);
  } else {
    const homeFlag = flagEmoji(params.homeName);
    const awayFlag = flagEmoji(params.awayName);
    const home = `${homeFlag ? `${homeFlag} ` : ""}${params.homeName}`;
    const away = `${awayFlag ? `${awayFlag} ` : ""}${params.awayName}`;
    const barWidth = 30;
    const homeBlocks = Math.round((homePct / 100) * barWidth);
    const bar = "█".repeat(homeBlocks) + "▒".repeat(barWidth - homeBlocks);
    lines.push(
      `{cyan-fg}${home}{/cyan-fg} {cyan-fg}${homePct.toFixed(0)}%{/cyan-fg} |${bar}| {magenta-fg}${awayPct.toFixed(0)}%{/magenta-fg} {magenta-fg}${away}{/magenta-fg}`,
    );
  }

  return lines.join("\n");
}
