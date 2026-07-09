export type MatchStatus =
  | "SCHEDULED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED";

export interface Team {
  id: number;
  name: string;
  abbreviation: string;
}

export interface ScoreLine {
  home: number | null;
  away: number | null;
}

export interface MatchSummary {
  id: number;
  /** ESPN 리그 슬러그 (예: "eng.1"). summary 조회 시 필요 */
  leagueSlug: string;
  competition: string;
  utcDate: string;
  status: MatchStatus;
  /** ESPN이 보고한 마지막 경과 분(참고용). 화면 표시는 MatchClock을 쓴다 */
  minute: number | null;
  homeTeam: Team;
  awayTeam: Team;
  score: ScoreLine;
}

export type MatchEventType =
  | "GOAL"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "SUBSTITUTION"
  | "HALF_TIME"
  | "FULL_TIME"
  | "KICK_OFF"
  | "OTHER";

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  minute: number | null;
  /** 추가시간(스토피지 타임) 분. 예: 45+2 골이면 2 */
  extraMinute: number | null;
  team: "HOME" | "AWAY" | null;
  detail: string;
}

export interface GameInfo {
  venue: string | null;
  city: string | null;
  attendance: number | null;
  referee: string | null;
}

export interface MatchDetail extends MatchSummary {
  events: MatchEvent[];
  gameInfo: GameInfo;
}

/** 실시간으로 계산되는 경기 시계. 전/후반 45분 기준, injury는 추가시간 */
export interface MatchClock {
  minute: number | null;
  injury: number | null;
}

export interface PossessionStats {
  home: number;
  away: number;
  source: "api" | "pending" | "unavailable";
}

export interface StatPair {
  home: number;
  away: number;
}

export type StatSection = "attack" | "discipline" | "passing" | "defense";

/** label/sectionLabel은 espn.ts에서 현재 locale로 이미 번역해서 채운다 */
export interface StatRow {
  key: string;
  label: string;
  section: StatSection;
  home: number;
  away: number;
}

export interface MatchStats {
  rows: StatRow[];
  source: "api" | "unavailable";
}

export interface LineupPlayer {
  jersey: string;
  name: string;
  position: string;
}

export interface TeamLineup {
  formation: string | null;
  starters: LineupPlayer[];
  bench: LineupPlayer[];
}

export interface Lineups {
  home: TeamLineup;
  away: TeamLineup;
  source: "api" | "unavailable";
}

export interface FormEntry {
  opponent: string;
  score: string;
  result: "W" | "D" | "L";
}

export interface RecentForm {
  home: FormEntry[];
  away: FormEntry[];
  source: "api" | "unavailable";
}

export interface HeadToHeadEntry {
  date: string;
  homeTeamName: string;
  awayTeamName: string;
  score: string;
}

export interface HeadToHead {
  games: HeadToHeadEntry[];
  source: "api" | "unavailable";
}

export type PenaltyResult = "SCORED" | "MISSED" | "SAVED";
/** 골대 안에서 대략적인 높이. over는 크로스바를 넘긴 경우 */
export type PenaltyHeight = "high" | "mid" | "low" | "over";

export interface PenaltyKick {
  order: number;
  team: "HOME" | "AWAY";
  player: string;
  result: PenaltyResult;
  /** 골대 좌우 위치, ESPN 원본 goalPositionY(대략 0~100)를 그대로 사용 */
  xPct: number;
  height: PenaltyHeight;
}

export interface Shootout {
  kicks: PenaltyKick[];
  homeScore: number;
  awayScore: number;
  source: "api" | "unavailable";
}
