import { EventEmitter } from "node:events";
import type { EspnClient } from "../api/espn.js";
import type { Locale } from "../i18n.js";
import type {
  HeadToHead,
  Lineups,
  MatchClock,
  MatchDetail,
  MatchStats,
  MatchStatus,
  PossessionStats,
  RecentForm,
  Shootout,
} from "../types/domain.js";

const LIVE_POLL_INTERVAL_MS = 15_000;
const SCHEDULED_POLL_INTERVAL_MS = 30_000;
// 시계는 분 단위로만 보여주므로 250ms마다 다시 그릴 필요가 없다 (국기 이모지 포함 전체 스코어보드가
// 매번 다시 렌더링되면서 화면이 버벅이던 원인). 1초마다 계산만 해보고, 실제로 분이 바뀔 때만 그린다.
const TICK_INTERVAL_MS = 1_000;

const EMPTY_STATS: MatchStats = { rows: [], source: "unavailable" };
const EMPTY_LINEUP = { formation: null, starters: [], bench: [] };
const EMPTY_LINEUPS: Lineups = { home: EMPTY_LINEUP, away: EMPTY_LINEUP, source: "unavailable" };
const EMPTY_FORM: RecentForm = { home: [], away: [], source: "unavailable" };
const EMPTY_H2H: HeadToHead = { games: [], source: "unavailable" };
const EMPTY_SHOOTOUT: Shootout = { kicks: [], homeScore: 0, awayScore: 0, source: "unavailable" };

export interface MatchSnapshot {
  match: MatchDetail;
  possession: PossessionStats;
  stats: MatchStats;
  lineups: Lineups;
  recentForm: RecentForm;
  headToHead: HeadToHead;
  shootout: Shootout;
  clock: MatchClock;
}

export declare interface MatchStateManager {
  on(event: "update", listener: (snapshot: MatchSnapshot) => void): this;
  on(event: "tick", listener: (clock: MatchClock) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
}

export class MatchStateManager extends EventEmitter {
  private possession: PossessionStats = { home: 50, away: 50, source: "pending" };
  private stats: MatchStats = EMPTY_STATS;
  private lineups: Lineups = EMPTY_LINEUPS;
  private recentForm: RecentForm = EMPTY_FORM;
  private headToHead: HeadToHead = EMPTY_H2H;
  private shootout: Shootout = EMPTY_SHOOTOUT;
  private latestMatch: MatchDetail | null = null;

  private clockAnchorMs: number | null = null;
  private lastStatus: MatchStatus | null = null;
  private lastEmittedClock: MatchClock | null = null;

  private pollTimer?: ReturnType<typeof setInterval>;
  private tickTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly leagueSlug: string,
    private readonly eventId: number,
    private readonly client: EspnClient,
    private locale: Locale,
  ) {
    super();
  }

  setLocale(locale: Locale): void {
    this.locale = locale;
    void this.poll();
  }

  async start(): Promise<void> {
    await this.poll();
    this.tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS);

    if (this.latestMatch?.status === "FINISHED") return; // 종료된 경기는 한 번만 조회하고 끝

    const interval = this.latestMatch?.status === "SCHEDULED" ? SCHEDULED_POLL_INTERVAL_MS : LIVE_POLL_INTERVAL_MS;
    this.pollTimer = setInterval(() => void this.poll(), interval);
  }

  stop(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.tickTimer) clearInterval(this.tickTimer);
  }

  private async poll(): Promise<void> {
    try {
      const { match, possession, stats, lineups, recentForm, headToHead, shootout } = await this.client.getSnapshot(
        this.leagueSlug,
        this.eventId,
        this.locale,
      );
      this.updateClockAnchor(match);
      this.lastStatus = match.status;
      this.latestMatch = match;
      this.possession = possession;
      this.stats = stats;
      this.lineups = lineups;
      this.recentForm = recentForm;
      this.headToHead = headToHead;
      this.shootout = shootout;

      this.emitSnapshot(match);

      if (this.pollTimer && match.status !== "SCHEDULED" && this.lastStatus === "SCHEDULED") {
        clearInterval(this.pollTimer);
        this.pollTimer = setInterval(() => void this.poll(), LIVE_POLL_INTERVAL_MS);
      }
      if (match.status === "FINISHED" && this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = undefined;
      }
    } catch (error) {
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
    }
  }

  private updateClockAnchor(match: MatchDetail): void {
    const isFirstPoll = this.lastStatus === null;
    if (match.status !== "IN_PLAY") return;

    if (match.minute !== null) {
      // ESPN이 준 실측 분이 있으면 그걸로 매번 보정한다 (가장 정확함)
      this.clockAnchorMs = Date.now() - match.minute * 60_000;
      return;
    }
    if (isFirstPoll) {
      this.clockAnchorMs = Date.now();
      return;
    }
    if (this.lastStatus !== "IN_PLAY") {
      this.clockAnchorMs = this.lastStatus === "PAUSED" ? Date.now() - 45 * 60_000 : Date.now();
    }
  }

  private computeClock(match: MatchDetail): MatchClock {
    if (match.status === "PAUSED") return { minute: 45, injury: null };
    if (match.status === "FINISHED") return { minute: match.minute ?? 90, injury: null };
    if (match.status !== "IN_PLAY" || this.clockAnchorMs === null) return { minute: null, injury: null };

    const elapsedMin = (Date.now() - this.clockAnchorMs) / 60_000;
    const half = elapsedMin <= 45 ? 45 : 90;
    const minute = Math.min(Math.floor(Math.max(elapsedMin, 0)), half);
    const injury = elapsedMin > half ? Math.max(1, Math.ceil(elapsedMin - half)) : null;
    return { minute, injury };
  }

  private tick(): void {
    if (!this.latestMatch) return;
    const clock = this.computeClock(this.latestMatch);
    if (
      this.lastEmittedClock &&
      this.lastEmittedClock.minute === clock.minute &&
      this.lastEmittedClock.injury === clock.injury
    ) {
      return; // 화면에 보이는 값이 안 바뀌었으면 다시 그리지 않는다
    }
    this.lastEmittedClock = clock;
    this.emit("tick", clock);
  }

  private emitSnapshot(match: MatchDetail): void {
    const clock = this.computeClock(match);
    this.lastEmittedClock = clock;
    this.emit("update", {
      match,
      possession: this.possession,
      stats: this.stats,
      lineups: this.lineups,
      recentForm: this.recentForm,
      headToHead: this.headToHead,
      shootout: this.shootout,
      clock,
    });
  }
}
