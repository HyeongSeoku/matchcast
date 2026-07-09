#!/usr/bin/env node
import { Command } from "commander";
import { EspnClient } from "./api/espn.js";
import { MatchStateManager } from "./state/matchState.js";
import { TerminalUI } from "./ui/screen.js";
import { MatchPicker } from "./ui/matchPicker.js";
import { zonedDayBounds, formatYMD } from "./util/date.js";
import { DEFAULT_LOCALE, intlTag, isLocale, t, type Locale } from "./i18n.js";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, findCountry, isCountryCode, type Country } from "./countries.js";
import type {
  HeadToHead,
  Lineups,
  MatchDetail,
  MatchStats,
  MatchSummary,
  PossessionStats,
  RecentForm,
  Shootout,
} from "./types/domain.js";

const EMPTY_STATS: MatchStats = { rows: [], source: "unavailable" };
const EMPTY_LINEUP = { formation: null, starters: [], bench: [] };
const EMPTY_LINEUPS: Lineups = { home: EMPTY_LINEUP, away: EMPTY_LINEUP, source: "unavailable" };
const EMPTY_FORM: RecentForm = { home: [], away: [], source: "unavailable" };
const EMPTY_H2H: HeadToHead = { games: [], source: "unavailable" };
const EMPTY_SHOOTOUT: Shootout = { kicks: [], homeScore: 0, awayScore: 0, source: "unavailable" };

const PICKER_REFRESH_MS = 30_000;
const MAX_EMPTY_DAY_SKIPS = 14;

function parseLocale(raw: string | undefined): Locale {
  return raw && isLocale(raw) ? raw : DEFAULT_LOCALE;
}

function parseCountry(raw: string | undefined): Country {
  return raw && isCountryCode(raw) ? findCountry(raw) : findCountry(DEFAULT_COUNTRY_CODE);
}

function runLiveView(
  match: MatchSummary,
  initialLocale: Locale,
  onExit: () => void,
  onBack: (locale: Locale) => void,
): void {
  const client = new EspnClient();
  let locale = initialLocale;
  const stateManager = new MatchStateManager(match.leagueSlug, match.id, client, locale);

  let homeName = match.homeTeam.abbreviation;
  let awayName = match.awayTeam.abbreviation;
  let latestMatch: MatchDetail | undefined;
  let latestPossession: PossessionStats = { home: 50, away: 50, source: "pending" };
  let latestStats: MatchStats = EMPTY_STATS;
  let latestLineups: Lineups = EMPTY_LINEUPS;
  let latestForm: RecentForm = EMPTY_FORM;
  let latestH2H: HeadToHead = EMPTY_H2H;
  let latestShootout: Shootout = EMPTY_SHOOTOUT;

  const ui = new TerminalUI(
    locale,
    () => {
      stateManager.stop();
      ui.destroy();
      onExit();
    },
    (chosen) => {
      locale = chosen;
      ui.setLocale(locale);
      stateManager.setLocale(locale);
    },
    () => {
      stateManager.stop();
      ui.destroy();
      onBack(locale);
    },
  );

  stateManager.on("update", (snapshot) => {
    homeName = snapshot.match.homeTeam.abbreviation;
    awayName = snapshot.match.awayTeam.abbreviation;
    latestMatch = snapshot.match;
    latestPossession = snapshot.possession;
    latestStats = snapshot.stats;
    latestLineups = snapshot.lineups;
    latestForm = snapshot.recentForm;
    latestH2H = snapshot.headToHead;
    latestShootout = snapshot.shootout;
    ui.updateScoreboard(snapshot.match, snapshot.clock, latestShootout);
    ui.updateEvents(snapshot.match);
    ui.updateGround({
      homeName,
      awayName,
      possession: latestPossession,
      gameInfo: snapshot.match.gameInfo,
      lineups: latestLineups,
      shootout: latestShootout,
    });
    ui.updateInfo({
      homeName,
      awayName,
      stats: latestStats,
      lineups: latestLineups,
      recentForm: latestForm,
      headToHead: latestH2H,
    });
    ui.setStatus(t(locale).lastUpdate(new Date().toLocaleTimeString(intlTag(locale))));
  });

  stateManager.on("tick", (clock) => {
    if (latestMatch) ui.updateScoreboard(latestMatch, clock, latestShootout);
  });

  stateManager.on("error", (error) => {
    ui.setStatus(`{red-fg}${error.message}{/red-fg}`);
  });

  void stateManager.start();
}

function runPicker(initialLocale: Locale, initialCountry: Country): void {
  const client = new EspnClient();
  let locale = initialLocale;
  let country = initialCountry;
  let dateOffset = 0;
  let refreshTimer: ReturnType<typeof setInterval> | undefined;

  const picker = new MatchPicker(
    locale,
    country,
    (match) => {
      if (refreshTimer) clearInterval(refreshTimer);
      picker.destroy();
      runLiveView(
        match,
        locale,
        () => process.exit(0),
        (backLocale) => runPicker(backLocale, country),
      );
    },
    () => {
      if (refreshTimer) clearInterval(refreshTimer);
      picker.destroy();
      process.exit(0);
    },
    (delta) => {
      dateOffset += delta;
      void refresh(delta >= 0 ? 1 : -1);
    },
    () => void refresh(0),
    (chosen) => {
      locale = chosen;
      picker.setLocale(locale);
      void refresh(0);
    },
    (chosen) => {
      country = chosen;
      picker.setCountry(country);
      void refresh(0);
    },
  );

  /** direction !== 0이면, 그 날짜에 경기가 하나도 없을 때 같은 방향으로 계속 넘어가서 경기 있는 날짜를 찾는다. */
  async function refresh(direction: -1 | 0 | 1): Promise<void> {
    try {
      let range = zonedDayBounds(dateOffset, country.timeZone);
      picker.setStatus(t(locale).pickerLoading(formatYMD(range.ymd)));
      let matches = await client.listFixturesByDate(range, locale);

      if (matches.length === 0 && direction !== 0) {
        for (let i = 0; i < MAX_EMPTY_DAY_SKIPS && matches.length === 0; i++) {
          dateOffset += direction;
          range = zonedDayBounds(dateOffset, country.timeZone);
          picker.setStatus(t(locale).pickerLoading(formatYMD(range.ymd)));
          matches = await client.listFixturesByDate(range, locale);
        }
      }

      picker.setMatches(matches, formatYMD(range.ymd));
      picker.setStatus(t(locale).lastRefresh(new Date().toLocaleTimeString(intlTag(locale), { timeZone: country.timeZone })));
    } catch (error) {
      picker.setStatus(`{red-fg}${error instanceof Error ? error.message : error}{/red-fg}`);
    }
  }

  void refresh(1);
  refreshTimer = setInterval(() => void refresh(0), PICKER_REFRESH_MS);
}

const program = new Command();

program
  .name("matchcast")
  .description("Watch football live text commentary in your terminal / 터미널 축구 텍스트 중계")
  .option("--lang <locale>", "ko/en/ja/es (default: ko)", DEFAULT_LOCALE)
  .option(
    "--country <code>",
    `Country code for match times, e.g. KR/US/GB/JP/ES/MX (default: ${DEFAULT_COUNTRY_CODE}). Options: ${COUNTRIES.map((c) => c.code).join(",")}`,
    DEFAULT_COUNTRY_CODE,
  )
  .version("0.1.0");

program
  .command("watch", { isDefault: true })
  .description("Main screen — pick a match from the daily list (default) / 메인 화면")
  .action(() => {
    const opts = program.opts();
    runPicker(parseLocale(opts.lang as string | undefined), parseCountry(opts.country as string | undefined));
  });

program
  .command("list")
  .description("Print today's matches as plain text / 오늘 경기 목록 텍스트 출력")
  .action(async () => {
    const opts = program.opts();
    const locale = parseLocale(opts.lang as string | undefined);
    const country = parseCountry(opts.country as string | undefined);
    const client = new EspnClient();
    const matches = await client.listFixturesByDate(zonedDayBounds(0, country.timeZone), locale);
    if (matches.length === 0) {
      console.log(t(locale).noMatchesToday);
      return;
    }
    for (const m of matches) {
      console.log(
        `${m.leagueSlug}:${m.id}\t${m.competition}\t${m.homeTeam.name} vs ${m.awayTeam.name}\t${m.status}\t${new Date(m.utcDate).toLocaleString(intlTag(locale), { timeZone: country.timeZone })}`,
      );
    }
  });

program
  .command("live")
  .argument("<leagueSlug>", "ESPN league slug (e.g. eng.1, fifa.world)")
  .argument("<eventId>", "ESPN event ID")
  .description("Jump straight into live commentary for a match / 특정 경기 바로 시청")
  .action(async (leagueSlug: string, eventIdArg: string) => {
    const locale = parseLocale(program.opts().lang as string | undefined);
    const eventId = Number(eventIdArg);
    if (!Number.isInteger(eventId)) {
      console.error(t(locale).invalidEventId);
      process.exitCode = 1;
      return;
    }
    const client = new EspnClient();
    const { match } = await client.getSnapshot(leagueSlug, eventId, locale);
    runLiveView(match, locale, () => process.exit(0), () => process.exit(0));
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
