import type { Locale } from "../i18n.js";
import { t } from "../i18n.js";
import type {
  GameInfo,
  HeadToHead,
  Lineups,
  MatchDetail,
  MatchEvent,
  MatchStats,
  MatchStatus,
  MatchSummary,
  PenaltyHeight,
  PossessionStats,
  RecentForm,
  Shootout,
  StatSection,
  Team,
  TeamLineup,
} from "../types/domain.js";

const BASE_URL = "http://site.api.espn.com/apis/site/v2/sports/soccer";

/** ESPN은 리그별로 URL이 나뉘어 있어, 메인 화면에 보여줄 리그를 직접 골라야 한다. */
export const FEATURED_LEAGUES: Array<{ slug: string; label: Record<Locale, string> }> = [
  { slug: "fifa.world", label: { ko: "월드컵", en: "World Cup", ja: "ワールドカップ", es: "Copa Mundial" } },
  {
    slug: "uefa.champions",
    label: { ko: "챔피언스리그", en: "Champions League", ja: "チャンピオンズリーグ", es: "Champions League" },
  },
  { slug: "uefa.europa", label: { ko: "유로파리그", en: "Europa League", ja: "ヨーロッパリーグ", es: "Europa League" } },
  { slug: "eng.1", label: { ko: "프리미어리그", en: "Premier League", ja: "プレミアリーグ", es: "Premier League" } },
  { slug: "esp.1", label: { ko: "라리가", en: "La Liga", ja: "ラ・リーガ", es: "La Liga" } },
  { slug: "ger.1", label: { ko: "분데스리가", en: "Bundesliga", ja: "ブンデスリーガ", es: "Bundesliga" } },
  { slug: "ita.1", label: { ko: "세리에A", en: "Serie A", ja: "セリエA", es: "Serie A" } },
  { slug: "fra.1", label: { ko: "리그1", en: "Ligue 1", ja: "リーグ・アン", es: "Ligue 1" } },
  { slug: "ned.1", label: { ko: "에레디비지에", en: "Eredivisie", ja: "エールディヴィジ", es: "Eredivisie" } },
  { slug: "por.1", label: { ko: "프리메이라리가", en: "Primeira Liga", ja: "プリメイラ・リーガ", es: "Primeira Liga" } },
  { slug: "eng.2", label: { ko: "챔피언십", en: "Championship", ja: "チャンピオンシップ", es: "Championship" } },
  { slug: "bra.1", label: { ko: "브라질 세리에A", en: "Brazil Série A", ja: "ブラジル・セリエA", es: "Brasileirão" } },
  { slug: "kor.1", label: { ko: "K리그1", en: "K League 1", ja: "Kリーグ1", es: "K League 1" } },
  { slug: "usa.1", label: { ko: "MLS", en: "MLS", ja: "MLS", es: "MLS" } },
  { slug: "jpn.1", label: { ko: "J리그", en: "J.League", ja: "Jリーグ", es: "J.League" } },
  { slug: "mex.1", label: { ko: "리가 MX", en: "Liga MX", ja: "リーガMX", es: "Liga MX" } },
  { slug: "arg.1", label: { ko: "아르헨티나 프리메라", en: "Argentine Primera", ja: "アルゼンチン・プリメーラ", es: "Liga Argentina" } },
  {
    slug: "conmebol.libertadores",
    label: { ko: "코파 리베르타도레스", en: "Copa Libertadores", ja: "コパ・リベルタドーレス", es: "Copa Libertadores" },
  },
];

/** boxscore에서 뽑아 통계 패널에 전부 보여줄 지표 키 (ESPN 원본 stat name과 동일) */
const STAT_KEYS: Array<{ key: string; section: StatSection }> = [
  { key: "totalShots", section: "attack" },
  { key: "shotsOnTarget", section: "attack" },
  { key: "wonCorners", section: "attack" },
  { key: "blockedShots", section: "attack" },
  { key: "penaltyKickGoals", section: "attack" },
  { key: "penaltyKickShots", section: "attack" },
  { key: "foulsCommitted", section: "discipline" },
  { key: "offsides", section: "discipline" },
  { key: "yellowCards", section: "discipline" },
  { key: "redCards", section: "discipline" },
  { key: "accuratePasses", section: "passing" },
  { key: "totalPasses", section: "passing" },
  { key: "passPct", section: "passing" },
  { key: "accurateCrosses", section: "passing" },
  { key: "totalCrosses", section: "passing" },
  { key: "crossPct", section: "passing" },
  { key: "totalLongBalls", section: "passing" },
  { key: "accurateLongBalls", section: "passing" },
  { key: "longballPct", section: "passing" },
  { key: "saves", section: "defense" },
  { key: "effectiveTackles", section: "defense" },
  { key: "totalTackles", section: "defense" },
  { key: "tacklePct", section: "defense" },
  { key: "interceptions", section: "defense" },
  { key: "effectiveClearance", section: "defense" },
  { key: "totalClearance", section: "defense" },
];

const PERCENT_KEYS = new Set(["passPct", "crossPct", "longballPct", "tacklePct"]);

function leagueLabel(slug: string, locale: Locale): string {
  return FEATURED_LEAGUES.find((l) => l.slug === slug)?.label[locale] ?? slug;
}

function utcDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

interface RawTeamRef {
  id: string;
  displayName: string;
  abbreviation: string;
}

interface RawCompetitor {
  homeAway: "home" | "away";
  team: RawTeamRef;
  score?: string;
}

interface RawStatusType {
  state: "pre" | "in" | "post";
  completed: boolean;
  description: string;
  detail: string;
  shortDetail: string;
}

interface RawScoreboardEvent {
  id: string;
  date: string;
  status: { type: RawStatusType };
  competitions: Array<{ competitors: RawCompetitor[] }>;
}

interface RawScoreboardResponse {
  events: RawScoreboardEvent[];
}

/** commentary[i].play — keyEvents와 형태는 비슷하지만 team이 id 없이 displayName만 준다 */
interface RawPlay {
  type: { text: string };
  text?: string;
  clock: { displayValue: string };
  team?: { displayName: string };
  participants?: Array<{ athlete: { displayName: string } }>;
  /** 승부차기 킥의 골대 내 좌우 위치(대략 0~100). ESPN이 값을 안 줄 때도 있다 */
  goalPositionY?: number;
}

interface RawCommentaryEntry {
  play?: RawPlay;
}

interface RawStatValue {
  name: string;
  displayValue: string;
}

interface RawBoxscoreTeam {
  team: { id: string };
  statistics: RawStatValue[];
}

interface RawRosterEntry {
  starter: boolean;
  jersey?: string;
  athlete: { displayName: string };
  position?: { abbreviation: string };
}

interface RawRosterTeam {
  homeAway: "home" | "away";
  formation?: string;
  roster: RawRosterEntry[];
}

interface RawFormEvent {
  score: string;
  gameResult: "W" | "D" | "L";
  opponent: { displayName: string };
}

interface RawFormTeam {
  team: { id: string };
  events: RawFormEvent[];
}

interface RawHeadToHeadEvent {
  gameDate: string;
  homeTeamId: string;
  awayTeamId: string;
  score: string;
  opponent: { displayName: string };
}

interface RawHeadToHeadTeam {
  team: { id: string; displayName: string };
  events: RawHeadToHeadEvent[];
}

interface RawGameInfo {
  venue?: { fullName?: string; address?: { city?: string } };
  attendance?: number;
  officials?: Array<{ displayName: string; position?: { name?: string } }>;
}

interface RawSummaryResponse {
  header: {
    competitions: Array<{
      date: string;
      status: { type: RawStatusType };
      competitors: RawCompetitor[];
    }>;
  };
  commentary?: RawCommentaryEntry[];
  boxscore?: { teams: RawBoxscoreTeam[] };
  rosters?: RawRosterTeam[];
  lastFiveGames?: RawFormTeam[];
  headToHeadGames?: RawHeadToHeadTeam[];
  gameInfo?: RawGameInfo;
}

function mapStatus(type: RawStatusType): MatchStatus {
  if (type.state === "pre") return "SCHEDULED";
  if (type.state === "post") return "FINISHED";
  if (type.shortDetail === "HT" || type.description.toLowerCase().includes("halftime")) return "PAUSED";
  return "IN_PLAY";
}

/** ESPN 실제 포맷: "63'" -> {minute:63, injury:null}, "90'+2'" -> {minute:90, injury:2} */
function parseClock(shortDetail: string): { minute: number | null; injury: number | null } {
  const match = /^(\d+)'(?:\+(\d+)')?$/.exec(shortDetail.trim());
  if (!match?.[1]) return { minute: null, injury: null };
  return { minute: Number(match[1]), injury: match[2] ? Number(match[2]) : null };
}

function toTeam(raw: RawTeamRef): Team {
  return { id: Number(raw.id), name: raw.displayName, abbreviation: raw.abbreviation };
}

function scoreOf(competitors: RawCompetitor[], homeAway: "home" | "away"): number | null {
  const c = competitors.find((x) => x.homeAway === homeAway);
  return c?.score !== undefined ? Number(c.score) : null;
}

function teamOf(competitors: RawCompetitor[], homeAway: "home" | "away"): RawCompetitor {
  const c = competitors.find((x) => x.homeAway === homeAway);
  if (!c) throw new Error(`${homeAway} team not found`);
  return c;
}

function statValue(team: RawBoxscoreTeam | undefined, name: string): number {
  const raw = team?.statistics.find((s) => s.name === name)?.displayValue;
  return raw !== undefined ? Number(raw) : 0;
}

export class EspnClient {
  private async fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`ESPN 요청 실패: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  }

  /**
   * range: 사용자가 선택한 국가 기준 "그 하루"의 [start, end) UTC 범위 (util/date.ts의 zonedDayBounds 참고).
   * ESPN의 dates= 파라미터는 UTC 하루 단위라, 그 나라의 하루가 UTC 이틀에 걸칠 수 있다
   * (예: KST 00:00~08:59는 전날 UTC에 속함 — 새벽 경기가 엉뚱한 날짜에 잡히던 버그).
   * 그래서 겹치는 UTC 날짜를 전부 조회한 뒤, 실제 킥오프 시각이 그 범위 안에 드는 경기만 남긴다.
   */
  async listFixturesByDate(range: { start: Date; end: Date }, locale: Locale): Promise<MatchSummary[]> {
    const dayStart = range.start;
    const dayEnd = range.end;
    const utcDates = new Set([utcDateString(dayStart), utcDateString(new Date(dayEnd.getTime() - 1))]);

    const results = await Promise.allSettled(
      FEATURED_LEAGUES.flatMap((league) =>
        [...utcDates].map(async (dateStr) => {
          const data = await this.fetchJson<RawScoreboardResponse>(
            `${BASE_URL}/${league.slug}/scoreboard?dates=${dateStr}`,
          );
          return data.events.map((e) => this.toMatchSummary(e, league.slug, league.label[locale]));
        }),
      ),
    );

    const byId = new Map<number, MatchSummary>();
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const match of r.value) {
        const kickoff = new Date(match.utcDate);
        if (kickoff >= dayStart && kickoff < dayEnd) byId.set(match.id, match);
      }
    }
    return [...byId.values()].sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  }

  private toMatchSummary(e: RawScoreboardEvent, leagueSlug: string, label: string): MatchSummary {
    const competitors = e.competitions[0]?.competitors ?? [];
    const clock = parseClock(e.status.type.shortDetail);
    return {
      id: Number(e.id),
      leagueSlug,
      competition: label,
      utcDate: e.date,
      status: mapStatus(e.status.type),
      minute: clock.minute,
      homeTeam: toTeam(teamOf(competitors, "home").team),
      awayTeam: toTeam(teamOf(competitors, "away").team),
      score: { home: scoreOf(competitors, "home"), away: scoreOf(competitors, "away") },
    };
  }

  async getSnapshot(
    leagueSlug: string,
    eventId: number,
    locale: Locale,
  ): Promise<{
    match: MatchDetail;
    possession: PossessionStats;
    stats: MatchStats;
    lineups: Lineups;
    recentForm: RecentForm;
    headToHead: HeadToHead;
    shootout: Shootout;
  }> {
    const data = await this.fetchJson<RawSummaryResponse>(`${BASE_URL}/${leagueSlug}/summary?event=${eventId}`);
    const competition = data.header.competitions[0];
    if (!competition) throw new Error(`ESPN: event ${eventId} not found`);

    const clock = parseClock(competition.status.type.shortDetail);
    const homeTeam = toTeam(teamOf(competition.competitors, "home").team);
    const awayTeam = toTeam(teamOf(competition.competitors, "away").team);

    const match: MatchDetail = {
      id: eventId,
      leagueSlug,
      competition: leagueLabel(leagueSlug, locale),
      utcDate: competition.date,
      status: mapStatus(competition.status.type),
      minute: clock.minute,
      homeTeam,
      awayTeam,
      score: {
        home: scoreOf(competition.competitors, "home"),
        away: scoreOf(competition.competitors, "away"),
      },
      events: this.toEventsFromCommentary(data.commentary ?? [], homeTeam.name, locale),
      gameInfo: this.toGameInfo(data.gameInfo),
    };

    return {
      match,
      possession: this.toPossession(data.boxscore, homeTeam.id),
      stats: this.toStats(data.boxscore, homeTeam.id, locale),
      lineups: this.toLineups(data.rosters),
      recentForm: this.toRecentForm(data.lastFiveGames, homeTeam.id),
      headToHead: this.toHeadToHead(data.headToHeadGames),
      shootout: this.toShootout(data.commentary ?? [], homeTeam.name),
    };
  }

  /** 승부차기까지 간 경우, 코멘터리에서 개별 킥(누가/골좌우위치/성공여부)을 뽑는다 */
  private toShootout(raw: RawCommentaryEntry[], homeTeamName: string): Shootout {
    const kicks: Array<{ team: "HOME" | "AWAY"; player: string; result: "SCORED" | "MISSED" | "SAVED"; xPct: number; height: PenaltyHeight }> = [];

    for (const entry of raw) {
      const play = entry.play;
      if (!play) continue;
      const typeText = play.type.text.toLowerCase();
      if (!typeText.startsWith("penalty - ")) continue;

      const result = typeText.includes("scored") ? "SCORED" : typeText.includes("saved") ? "SAVED" : "MISSED";
      const team: "HOME" | "AWAY" = play.team?.displayName === homeTeamName ? "HOME" : "AWAY";
      const player = play.participants?.[0]?.athlete.displayName ?? "?";
      const text = (play.text ?? "").toLowerCase();

      let height: PenaltyHeight = "mid";
      if (text.includes("bar") || text.includes("too high") || text.includes("over the")) height = "over";
      else if (text.includes("top")) height = "high";
      else if (text.includes("bottom") || text.includes("low")) height = "low";

      const xPct = typeof play.goalPositionY === "number" ? Math.max(0, Math.min(100, play.goalPositionY)) : 50;

      kicks.push({ team, player, result, xPct, height });
    }

    if (kicks.length === 0) return { kicks: [], homeScore: 0, awayScore: 0, source: "unavailable" };

    const homeScore = kicks.filter((k) => k.team === "HOME" && k.result === "SCORED").length;
    const awayScore = kicks.filter((k) => k.team === "AWAY" && k.result === "SCORED").length;

    return {
      kicks: kicks.map((k, i) => ({ order: i + 1, ...k })),
      homeScore,
      awayScore,
      source: "api",
    };
  }

  /**
   * commentary는 keyEvents의 상위 호환이라(골/카드/교체 포함 + 유효슈팅/코너/오프사이드/VAR까지) 이것만 쓴다.
   * play.team에는 id가 없어서 팀 이름 문자열로 홈/원정을 구분한다.
   */
  private toEventsFromCommentary(raw: RawCommentaryEntry[], homeTeamName: string, locale: Locale): MatchEvent[] {
    const messages = t(locale);
    return raw
      .map((entry, index) => {
        const play = entry.play;
        if (!play) return null;

        const side: "HOME" | "AWAY" | null = play.team ? (play.team.displayName === homeTeamName ? "HOME" : "AWAY") : null;
        const clock = parseClock(play.clock.displayValue || "0'");
        const typeText = play.type.text.toLowerCase();
        const names = (play.participants ?? []).map((p) => p.athlete.displayName);

        let type: MatchEvent["type"] | null = null;
        let detail: string | null = null;

        if (typeText.includes("goal") && !typeText.includes("goal kick")) {
          type = "GOAL";
          const assistText = names[1] ? messages.assist(names[1]) : "";
          detail = `⚽ ${names[0] ?? messages.goalFallback}${assistText}`;
        } else if (typeText.includes("yellow card")) {
          type = "YELLOW_CARD";
          detail = `🟨 ${names[0] ?? messages.playerFallback}`;
        } else if (typeText.includes("red card")) {
          type = "RED_CARD";
          detail = `🟥 ${names[0] ?? messages.playerFallback}`;
        } else if (typeText.includes("substitution")) {
          type = "SUBSTITUTION";
          // ESPN 원문은 항상 영어: "Substitution, USA. Haji Wright replaces Folarin Balogun." -> 팀 접두사만 제거
          detail = play.text
            ? `🔄 ${play.text.replace(/^Substitution,\s*[^.]+\.\s*/i, "")}`
            : `🔄 ${messages.substitutionFallback(names[1] ?? "?", names[0] ?? "?")}`;
        } else if (typeText.includes("halftime")) {
          type = "HALF_TIME";
          detail = messages.halfTimeText;
        } else if (typeText.includes("full time") || typeText.includes("end regular time")) {
          type = "FULL_TIME";
          detail = messages.fullTimeText;
        } else if (typeText.includes("kickoff")) {
          type = "KICK_OFF";
          detail = messages.kickoffText;
        } else if (typeText === "shot on target") {
          type = "OTHER";
          detail = messages.shotOnTargetText(names[0] ?? messages.playerFallback);
        } else if (typeText.includes("corner")) {
          type = "OTHER";
          detail = messages.cornerText(play.team?.displayName ?? "?");
        } else if (typeText.includes("offside")) {
          type = "OTHER";
          detail = messages.offsideText(names[0] ?? messages.playerFallback);
        } else if (typeText.startsWith("var")) {
          type = "OTHER";
          detail = messages.varText;
        } else if (typeText.includes("penalty - scored")) {
          type = "GOAL";
          detail = messages.penaltyScoredText(names[0] ?? messages.playerFallback);
        } else if (typeText.includes("penalty - missed")) {
          type = "OTHER";
          detail = messages.penaltyMissedText(names[0] ?? messages.playerFallback);
        } else if (typeText.includes("penalty - saved")) {
          type = "OTHER";
          detail = messages.penaltySavedText(names[0] ?? messages.playerFallback);
        } else if (typeText.includes("start shootout")) {
          type = "OTHER";
          detail = messages.shootoutStartText;
        }

        if (!type || !detail) return null;

        const event: MatchEvent = {
          id: `espn-${index}-${clock.minute}-${typeText}-${names[0] ?? ""}`,
          type,
          minute: clock.minute,
          extraMinute: clock.injury,
          team: side,
          detail,
        };
        return event;
      })
      .filter((e): e is MatchEvent => e !== null);
  }

  private toPossession(boxscore: RawSummaryResponse["boxscore"], homeTeamId: number): PossessionStats {
    if (!boxscore) return { home: 50, away: 50, source: "unavailable" };
    const homeStats = boxscore.teams.find((t) => Number(t.team.id) === homeTeamId);
    const awayStats = boxscore.teams.find((t) => Number(t.team.id) !== homeTeamId);
    const home = homeStats?.statistics.find((s) => s.name === "possessionPct")?.displayValue;
    const away = awayStats?.statistics.find((s) => s.name === "possessionPct")?.displayValue;

    if (home === undefined || away === undefined) return { home: 50, away: 50, source: "unavailable" };
    return { home: Number(home), away: Number(away), source: "api" };
  }

  private toStats(boxscore: RawSummaryResponse["boxscore"], homeTeamId: number, locale: Locale): MatchStats {
    if (!boxscore) return { rows: [], source: "unavailable" };
    const home = boxscore.teams.find((t) => Number(t.team.id) === homeTeamId);
    const away = boxscore.teams.find((t) => Number(t.team.id) !== homeTeamId);
    const labels = t(locale).statLabels;

    const rows = STAT_KEYS.map(({ key, section }) => {
      const homeRaw = statValue(home, key);
      const awayRaw = statValue(away, key);
      const isPct = PERCENT_KEYS.has(key);
      return {
        key,
        label: labels[key] ?? key,
        section,
        home: isPct ? Math.round(homeRaw * 100) : homeRaw,
        away: isPct ? Math.round(awayRaw * 100) : awayRaw,
      };
    });

    return { rows, source: "api" };
  }

  private toLineups(rosters: RawRosterTeam[] | undefined): Lineups {
    if (!rosters || rosters.length < 2) {
      const empty: TeamLineup = { formation: null, starters: [], bench: [] };
      return { home: empty, away: empty, source: "unavailable" };
    }

    const toLineup = (side: "home" | "away"): TeamLineup => {
      const raw = rosters.find((r) => r.homeAway === side);
      const starters = (raw?.roster ?? [])
        .filter((p) => p.starter)
        .map((p) => ({ jersey: p.jersey ?? "", name: p.athlete.displayName, position: p.position?.abbreviation ?? "" }));
      const bench = (raw?.roster ?? [])
        .filter((p) => !p.starter)
        .map((p) => ({ jersey: p.jersey ?? "", name: p.athlete.displayName, position: p.position?.abbreviation ?? "" }));
      return { formation: raw?.formation ?? null, starters, bench };
    };

    return { home: toLineup("home"), away: toLineup("away"), source: "api" };
  }

  private toRecentForm(lastFive: RawFormTeam[] | undefined, homeTeamId: number): RecentForm {
    if (!lastFive || lastFive.length === 0) return { home: [], away: [], source: "unavailable" };

    const toForm = (entries: RawFormEvent[] | undefined) =>
      (entries ?? []).map((e) => ({ opponent: e.opponent.displayName, score: e.score, result: e.gameResult }));

    const homeEntry = lastFive.find((t) => Number(t.team.id) === homeTeamId);
    const awayEntry = lastFive.find((t) => Number(t.team.id) !== homeTeamId);

    return { home: toForm(homeEntry?.events), away: toForm(awayEntry?.events), source: "api" };
  }

  private toHeadToHead(headToHead: RawHeadToHeadTeam[] | undefined): HeadToHead {
    const entry = headToHead?.[0];
    if (!entry || entry.events.length === 0) return { games: [], source: "unavailable" };

    return {
      games: entry.events.map((e) => {
        const isHome = e.homeTeamId === entry.team.id;
        return {
          date: e.gameDate,
          homeTeamName: isHome ? entry.team.displayName : e.opponent.displayName,
          awayTeamName: isHome ? e.opponent.displayName : entry.team.displayName,
          score: e.score,
        };
      }),
      source: "api",
    };
  }

  private toGameInfo(raw: RawGameInfo | undefined): GameInfo {
    return {
      venue: raw?.venue?.fullName ?? null,
      city: raw?.venue?.address?.city ?? null,
      attendance: raw?.attendance ?? null,
      referee: raw?.officials?.find((o) => o.position?.name === "Referee")?.displayName ?? raw?.officials?.[0]?.displayName ?? null,
    };
  }
}
