import type { Locale } from "../i18n.js";
import { t } from "../i18n.js";
import type { PenaltyHeight, PenaltyKick, Shootout } from "../types/domain.js";

const WIDTH = 60;
const INSIDE_HEIGHT = 7;
const OVER_ROW_LABEL = "over the bar";

const RESULT_COLOR: Record<PenaltyKick["result"], string> = {
  SCORED: "green",
  MISSED: "red",
  SAVED: "yellow",
};

// 골대 그리드 안에서 쓰는 기호. 전부 폭 1칸짜리라야 테두리 정렬이 안 깨진다 (이모지는 2칸을 먹어서 못 씀)
const GRID_SYMBOL: Record<PenaltyKick["result"], string> = {
  SCORED: "●",
  MISSED: "✗",
  SAVED: "S",
};

// 아래 범례 목록은 정렬 제약이 없어서 이모지를 그대로 쓸 수 있다 — 장갑이 "막힘"이라는 걸 훨씬 직관적으로 보여준다
const LEGEND_SYMBOL: Record<PenaltyKick["result"], string> = {
  SCORED: "✓",
  MISSED: "✗",
  SAVED: "🧤",
};

function teamColor(team: PenaltyKick["team"]): string {
  return team === "HOME" ? "cyan" : "magenta";
}

function rowForHeight(height: PenaltyHeight): number {
  switch (height) {
    case "high":
      return 1;
    case "low":
      return INSIDE_HEIGHT - 2;
    default:
      return Math.floor(INSIDE_HEIGHT / 2);
  }
}

function buildFrame(): string[][] {
  const grid: string[][] = Array.from({ length: INSIDE_HEIGHT }, () => Array.from({ length: WIDTH }, () => " "));
  return grid;
}

export function renderShootout(params: { shootout: Shootout; homeAbbr: string; awayAbbr: string; locale: Locale }): string {
  const messages = t(params.locale);
  const { shootout } = params;

  if (shootout.source !== "api" || shootout.kicks.length === 0) {
    return `{grey-fg}${messages.shootoutUnavailable}{/grey-fg}`;
  }

  const overKicks = shootout.kicks.filter((k) => k.height === "over");
  const framedKicks = shootout.kicks.filter((k) => k.height !== "over");

  const grid = buildFrame();
  const orderAt: (number | undefined)[][] = Array.from({ length: INSIDE_HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => undefined),
  );

  // 실제 골대 좌표(xPct)가 대부분 중앙 근처(46~54)에 몰려있어서, 그대로 칸에 매핑하면 같은 칸에 겹쳐
  // 뒤에 그린 킥이 앞의 걸 지워버린다. 그래서 같은 높이(row)를 공유하는 킥끼리는 xPct 순서만 유지한 채
  // 폭 전체에 고르게 펼쳐서 배치한다 — 정밀한 좌표보다 "전부 다 보이는 것"을 우선한다.
  const rowGroups = new Map<number, PenaltyKick[]>();
  for (const kick of framedKicks) {
    const row = rowForHeight(kick.height);
    const group = rowGroups.get(row) ?? [];
    group.push(kick);
    rowGroups.set(row, group);
  }

  const margin = 3;
  for (const [row, group] of rowGroups) {
    group.sort((a, b) => a.xPct - b.xPct);
    group.forEach((kick, i) => {
      const t = group.length === 1 ? 0.5 : i / (group.length - 1);
      const col = Math.round(margin + t * (WIDTH - 1 - margin * 2));
      orderAt[row]![col] = kick.order;
    });
  }

  const lines: string[] = [];

  if (overKicks.length > 0) {
    const markers = overKicks
      .map((k) => {
        const color = teamColor(k.team);
        return `{${color}-fg}{bold}${GRID_SYMBOL[k.result]}${k.order}{/bold}{/${color}-fg}`;
      })
      .join(" ");
    lines.push(`{grey-fg}${OVER_ROW_LABEL} ↑{/grey-fg}  ${markers}`);
  }

  lines.push(`{grey-fg}┌${"─".repeat(WIDTH)}┐{/grey-fg}`);
  for (let row = 0; row < INSIDE_HEIGHT; row++) {
    let line = "{grey-fg}│{/grey-fg}";
    for (let col = 0; col < WIDTH; col++) {
      const order = orderAt[row]![col];
      if (order !== undefined) {
        const kick = shootout.kicks.find((k) => k.order === order)!;
        const marker = `${GRID_SYMBOL[kick.result]}${order}`;
        const color = teamColor(kick.team);
        line += `{${color}-fg}{bold}${marker}{/bold}{/${color}-fg}`;
        col += marker.length - 1;
      } else {
        line += grid[row]![col];
      }
    }
    line += "{grey-fg}│{/grey-fg}";
    lines.push(line);
  }
  lines.push(`{grey-fg}└${"─".repeat(WIDTH)}┘{/grey-fg}  {grey-fg}(ground){/grey-fg}`);

  lines.push("");
  lines.push(
    `{cyan-fg}{bold}${params.homeAbbr}{/bold}{/cyan-fg} ${shootout.homeScore} - ${shootout.awayScore} {magenta-fg}{bold}${params.awayAbbr}{/bold}{/magenta-fg}`,
  );
  lines.push("");

  for (const kick of shootout.kicks) {
    const color = teamColor(kick.team);
    const resultColor = RESULT_COLOR[kick.result];
    lines.push(
      `{grey-fg}${kick.order}.{/grey-fg} {${color}-fg}${kick.team === "HOME" ? params.homeAbbr : params.awayAbbr}{/${color}-fg} ${kick.player}  {${resultColor}-fg}${LEGEND_SYMBOL[kick.result]}{/${resultColor}-fg}`,
    );
  }

  return lines.join("\n");
}
