import blessed from "blessed";
import type { Locale } from "../i18n.js";
import { t } from "../i18n.js";
import { showLanguagePopup } from "./languagePopup.js";
import type {
  GameInfo,
  HeadToHead,
  Lineups,
  MatchClock,
  MatchDetail,
  MatchStats,
  PossessionStats,
  RecentForm,
  Shootout,
} from "../types/domain.js";
import { renderScoreboard } from "./scoreboard.js";
import { renderEventsLog } from "./eventsLog.js";
import { renderPitch } from "./pitch.js";
import { renderInfoPanel } from "./infoPanel.js";
import { renderShootout } from "./shootout.js";

/** setContent는 스크롤 위치를 리셋하므로, 사용자가 스크롤해서 보고 있던 위치를 유지해준다 */
function setContentPreservingScroll(box: blessed.Widgets.BoxElement, content: string): void {
  const scroll = box.getScroll();
  box.setContent(content);
  box.scrollTo(scroll);
}

interface ScrollableInternals {
  reallyScrollable: boolean;
  getScrollPerc(): number;
}

/** 스크롤할 내용이 있을 때만 라벨에 [n%]를 붙여서 지금 어디쯤 보고 있는지 알려준다 */
function applyScrollLabel(box: blessed.Widgets.BoxElement, baseLabel: string): void {
  const internals = box as unknown as ScrollableInternals;
  if (internals.reallyScrollable) {
    const pct = Math.max(0, Math.min(100, Math.round(internals.getScrollPerc())));
    box.setLabel(` ${baseLabel.trim()} [${pct}%] `);
  } else {
    box.setLabel(baseLabel);
  }
}

const SCOREBOARD_HEIGHT = 4;
const STATUS_HEIGHT = 3;
const MIN_PANEL_ROWS = 5;
const MIN_PANEL_COLS = 16;
const RESIZE_STEP = 5;

export class TerminalUI {
  private readonly screen: blessed.Widgets.Screen;
  private readonly scoreboardBox: blessed.Widgets.BoxElement;
  private readonly groundBox: blessed.Widgets.BoxElement;
  private readonly shootoutTabBox: blessed.Widgets.BoxElement;
  private readonly infoBox: blessed.Widgets.BoxElement;
  private readonly eventsBox: blessed.Widgets.Log;
  private readonly statusBox: blessed.Widgets.BoxElement;
  private readonly focusables: blessed.Widgets.BoxElement[];
  private focusIndex = 0;
  private locale: Locale;
  private popupOpen = false;
  /** 그라운드가 (상단) 세로로 차지하는 비율, 나머지는 통계·라인업/이벤트 줄이 가져간다 */
  private groundHeightPct = 56;
  /** 하단 줄에서 통계·라인업이 가로로 차지하는 비율, 나머지는 이벤트가 가져간다 */
  private infoWidthPct = 50;
  /** 사용자가 한 번이라도 크기를 조절하면 그 뒤로는 relayout()이 터미널 리사이즈도 직접 챙긴다 */
  private customSized = false;
  private groundView: "pitch" | "shootout" = "pitch";
  private latestGroundParams: {
    homeName: string;
    awayName: string;
    possession: PossessionStats;
    gameInfo: GameInfo;
    lineups: Lineups;
    shootout: Shootout;
  } | null = null;

  constructor(locale: Locale, onQuit: () => void, onLocaleChange: (locale: Locale) => void, onBack: () => void) {
    this.locale = locale;
    this.screen = blessed.screen({ smartCSR: true, title: "matchcast", fullUnicode: true });

    this.scoreboardBox = blessed.box({
      top: 0,
      left: 0,
      width: "100%",
      height: 4,
      tags: true,
      border: { type: "line" },
      style: { border: { fg: "white" } },
    });

    // 그라운드: 점유율 배경 + 포메이션 모양대로 그린 선수 마커만. 통계/라인업 텍스트는 별도 패널로 뺐다.
    this.groundBox = blessed.box({
      top: 4,
      left: 0,
      width: "100%",
      height: "56%-2",
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true,
      alwaysScroll: false,
      border: { type: "line" },
      label: t(locale).groundLabel,
      style: { border: { fg: "green" }, focus: { border: { fg: "yellow" } } },
      scrollbar: { ch: " ", track: { bg: "grey" }, style: { bg: "yellow" } },
    });

    // 승부차기까지 간 경기에서만 채워지는, 그라운드 테두리 우측 상단에 얹히는 탭
    this.shootoutTabBox = blessed.box({
      top: 4,
      right: 1,
      width: "shrink",
      height: 1,
      tags: true,
      content: "",
    });

    this.infoBox = blessed.box({
      top: "60%-2",
      left: 0,
      width: "50%",
      height: "40%-1",
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true,
      alwaysScroll: false,
      border: { type: "line" },
      label: t(locale).infoPanelLabel,
      style: { border: { fg: "cyan" }, focus: { border: { fg: "yellow" } } },
      scrollbar: { ch: " ", track: { bg: "grey" }, style: { bg: "yellow" } },
    });

    this.eventsBox = blessed.log({
      top: "60%-2",
      left: "50%",
      width: "50%",
      height: "40%-1",
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      border: { type: "line" },
      label: t(locale).eventsLabel,
      style: { border: { fg: "white" }, focus: { border: { fg: "yellow" } } },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { ch: " ", track: { bg: "grey" }, style: { bg: "yellow" } },
    });

    this.statusBox = blessed.box({
      bottom: 0,
      left: 0,
      width: "100%",
      height: 3,
      tags: true,
      border: { type: "line" },
      style: { border: { fg: "grey" } },
      content: `{grey-fg}${t(locale).quitHint}{/grey-fg}`,
    });

    this.screen.append(this.scoreboardBox);
    this.screen.append(this.groundBox);
    this.screen.append(this.shootoutTabBox);
    this.screen.append(this.infoBox);
    this.screen.append(this.eventsBox);
    this.screen.append(this.statusBox);

    this.focusables = [this.groundBox, this.infoBox, this.eventsBox];
    this.focusables[0]!.focus();

    this.groundBox.on("scroll", () => {
      applyScrollLabel(this.groundBox, t(this.locale).groundLabel);
      this.screen.render();
    });
    this.infoBox.on("scroll", () => {
      applyScrollLabel(this.infoBox, t(this.locale).infoPanelLabel);
      this.screen.render();
    });
    this.eventsBox.on("scroll", () => {
      applyScrollLabel(this.eventsBox, t(this.locale).eventsLabel);
      this.screen.render();
    });

    this.screen.key(["q", "C-c"], () => {
      if (!this.popupOpen) onQuit();
    });
    this.screen.key(["escape", "b"], () => {
      if (!this.popupOpen) onBack();
    });
    this.screen.key(["tab"], () => {
      if (this.popupOpen) return;
      this.focusIndex = (this.focusIndex + 1) % this.focusables.length;
      this.focusables[this.focusIndex]!.focus();
      this.screen.render();
    });
    this.screen.key(["p"], () => {
      if (this.popupOpen) return;
      if (!this.latestGroundParams || this.latestGroundParams.shootout.kicks.length === 0) return;
      this.groundView = this.groundView === "pitch" ? "shootout" : "pitch";
      this.renderGround();
    });
    this.screen.key(["l"], () => {
      if (this.popupOpen) return;
      this.popupOpen = true;
      showLanguagePopup(
        this.screen,
        this.locale,
        (chosen) => {
          this.popupOpen = false;
          onLocaleChange(chosen);
        },
        () => {
          this.popupOpen = false;
        },
      );
    });

    this.screen.key(["+", "="], () => {
      if (this.popupOpen) return;
      this.groundHeightPct = Math.min(80, this.groundHeightPct + RESIZE_STEP);
      this.customSized = true;
      this.relayout();
    });
    this.screen.key(["-", "_"], () => {
      if (this.popupOpen) return;
      this.groundHeightPct = Math.max(20, this.groundHeightPct - RESIZE_STEP);
      this.customSized = true;
      this.relayout();
    });
    this.screen.key(["]"], () => {
      if (this.popupOpen) return;
      this.infoWidthPct = Math.min(80, this.infoWidthPct + RESIZE_STEP);
      this.customSized = true;
      this.relayout();
    });
    this.screen.key(["["], () => {
      if (this.popupOpen) return;
      this.infoWidthPct = Math.max(20, this.infoWidthPct - RESIZE_STEP);
      this.customSized = true;
      this.relayout();
    });
    // 사용자가 크기를 한 번이라도 조절했으면, 터미널 창 자체가 리사이즈될 때도 같은 비율로 다시 배치한다
    this.screen.on("resize", () => {
      if (this.customSized) this.relayout();
    });
  }

  /** 절대 행/열 기준으로 패널 크기를 다시 계산한다 (퍼센트 문자열 대신 직접 계산해서 +/-/[/] 로 조절 가능하게) */
  private relayout(): void {
    // 실제 TTY가 없으면 screen.width/height가 1처럼 비정상적으로 작게 나올 수 있어 최소값을 강제한다
    // (그렇지 않으면 아래 계산에서 음수 너비/높이가 나와 blessed가 깨질 수 있다)
    const screenHeight = Math.max(Number(this.screen.height) || 0, SCOREBOARD_HEIGHT + STATUS_HEIGHT + MIN_PANEL_ROWS * 2);
    const screenWidth = Math.max(Number(this.screen.width) || 0, MIN_PANEL_COLS * 2);
    const middleHeight = screenHeight - SCOREBOARD_HEIGHT - STATUS_HEIGHT;

    const groundHeight = Math.max(MIN_PANEL_ROWS, Math.min(middleHeight - MIN_PANEL_ROWS, Math.round((this.groundHeightPct / 100) * middleHeight)));
    const bottomHeight = middleHeight - groundHeight;
    const bottomTop = SCOREBOARD_HEIGHT + groundHeight;

    const infoWidth = Math.max(MIN_PANEL_COLS, Math.min(screenWidth - MIN_PANEL_COLS, Math.round((this.infoWidthPct / 100) * screenWidth)));
    const eventsWidth = Math.max(MIN_PANEL_COLS, screenWidth - infoWidth);

    this.groundBox.top = SCOREBOARD_HEIGHT;
    this.groundBox.left = 0;
    this.groundBox.width = screenWidth;
    this.groundBox.height = groundHeight;

    this.infoBox.top = bottomTop;
    this.infoBox.left = 0;
    this.infoBox.width = infoWidth;
    this.infoBox.height = bottomHeight;

    this.eventsBox.top = bottomTop;
    this.eventsBox.left = infoWidth;
    this.eventsBox.width = eventsWidth;
    this.eventsBox.height = bottomHeight;

    this.screen.render();
  }

  setLocale(locale: Locale): void {
    this.locale = locale;
    applyScrollLabel(this.groundBox, t(locale).groundLabel);
    applyScrollLabel(this.infoBox, t(locale).infoPanelLabel);
    applyScrollLabel(this.eventsBox, t(locale).eventsLabel);
    this.screen.render();
  }

  updateScoreboard(match: MatchDetail, clock: MatchClock, shootout?: Shootout): void {
    this.scoreboardBox.setContent(renderScoreboard(match, clock, this.locale, shootout));
    this.screen.render();
  }

  updateEvents(match: MatchDetail): void {
    this.eventsBox.setContent(renderEventsLog(match.events, this.locale));
    applyScrollLabel(this.eventsBox, t(this.locale).eventsLabel);
    this.screen.render();
  }

  updateGround(params: {
    homeName: string;
    awayName: string;
    possession: PossessionStats;
    gameInfo: GameInfo;
    lineups: Lineups;
    shootout: Shootout;
  }): void {
    this.latestGroundParams = params;
    const hasShootout = params.shootout.source === "api" && params.shootout.kicks.length > 0;
    if (!hasShootout) this.groundView = "pitch"; // 승부차기 데이터가 사라지면(다른 경기로 전환 등) 강제로 원상복귀
    this.shootoutTabBox.setContent(
      hasShootout
        ? this.groundView === "shootout"
          ? `{inverse}${t(this.locale).shootoutTabLabel}{/inverse}`
          : `{yellow-fg}${t(this.locale).shootoutTabLabel}{/yellow-fg}`
        : "",
    );
    this.renderGround();
  }

  private renderGround(): void {
    if (!this.latestGroundParams) return;
    const params = this.latestGroundParams;
    const content =
      this.groundView === "shootout"
        ? renderShootout({
            shootout: params.shootout,
            homeAbbr: params.homeName,
            awayAbbr: params.awayName,
            locale: this.locale,
          })
        : renderPitch({
            homeName: params.homeName,
            awayName: params.awayName,
            possession: params.possession,
            gameInfo: params.gameInfo,
            lineups: params.lineups,
            locale: this.locale,
          });
    setContentPreservingScroll(this.groundBox, content);
    applyScrollLabel(this.groundBox, t(this.locale).groundLabel);
    this.screen.render();
  }

  updateInfo(params: {
    homeName: string;
    awayName: string;
    stats: MatchStats;
    lineups: Lineups;
    recentForm: RecentForm;
    headToHead: HeadToHead;
  }): void {
    setContentPreservingScroll(
      this.infoBox,
      renderInfoPanel({
        homeName: params.homeName,
        awayName: params.awayName,
        stats: params.stats,
        lineups: params.lineups,
        recentForm: params.recentForm,
        headToHead: params.headToHead,
        locale: this.locale,
      }),
    );
    applyScrollLabel(this.infoBox, t(this.locale).infoPanelLabel);
    this.screen.render();
  }

  setStatus(text: string): void {
    this.statusBox.setContent(`{grey-fg}${t(this.locale).quitHint}  ·  ${t(this.locale).scrollHint}{/grey-fg}  |  ${text}`);
    this.screen.render();
  }

  destroy(): void {
    this.screen.destroy();
  }
}
