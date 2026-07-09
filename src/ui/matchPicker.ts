import blessed from "blessed";
import type { Locale } from "../i18n.js";
import { intlTag, t } from "../i18n.js";
import { showLanguagePopup } from "./languagePopup.js";
import { showCountryPopup } from "./countryPopup.js";
import { flagLabel } from "../util/countryFlags.js";
import { resultColors } from "./resultColor.js";
import type { Country } from "../countries.js";
import type { MatchSummary } from "../types/domain.js";

function formatRow(match: MatchSummary, locale: Locale, timeZone: string): string {
  const kickoff = new Date(match.utcDate).toLocaleTimeString(intlTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  const status = t(locale).statusLabels[match.status];
  const score = match.status === "SCHEDULED" ? "" : `${match.score.home ?? 0}-${match.score.away ?? 0}`;

  const homeLabel = flagLabel(match.homeTeam.abbreviation, match.homeTeam.name);
  const awayLabel = flagLabel(match.awayTeam.abbreviation, match.awayTeam.name);
  const plainTeams = `${homeLabel} vs ${awayLabel}`;
  const padding = " ".repeat(Math.max(0, 36 - plainTeams.length));
  const colors = resultColors(match);
  const teams = `{${colors.home}-fg}${homeLabel}{/${colors.home}-fg} vs {${colors.away}-fg}${awayLabel}{/${colors.away}-fg}${padding}`;

  return `{grey-fg}${kickoff}{/grey-fg}  {bold}${match.competition.padEnd(16)}{/bold}  ${teams}  {yellow-fg}${status}{/yellow-fg} ${score}`;
}

export class MatchPicker {
  private readonly screen: blessed.Widgets.Screen;
  private readonly headerBox: blessed.Widgets.BoxElement;
  private readonly list: blessed.Widgets.ListElement;
  private readonly statusBox: blessed.Widgets.BoxElement;
  private matches: MatchSummary[] = [];
  private dateLabel = "";
  private locale: Locale;
  private country: Country;
  private popupOpen = false;

  constructor(
    locale: Locale,
    country: Country,
    private readonly onSelect: (match: MatchSummary) => void,
    private readonly onQuit: () => void,
    private readonly onDateChange: (offsetDelta: number) => void,
    private readonly onRefresh: () => void,
    private readonly onLocaleChange: (locale: Locale) => void,
    private readonly onCountryChange: (country: Country) => void,
  ) {
    this.locale = locale;
    this.country = country;
    this.screen = blessed.screen({ smartCSR: true, title: "matchcast", fullUnicode: true });

    this.headerBox = blessed.box({
      top: 0,
      left: 0,
      width: "100%",
      height: 3,
      tags: true,
      border: { type: "line" },
      style: { border: { fg: "white" } },
    });

    // vi:true는 'l'을 리스트의 select(Enter)로 잡아버려서 언어 전환 키와 충돌하므로 끈다.
    this.list = blessed.list({
      top: 3,
      left: 0,
      width: "100%",
      height: "100%-6",
      tags: true,
      keys: true,
      mouse: true,
      border: { type: "line" },
      // 행 안에 이미 회색/cyan/magenta/yellow 색이 입혀져 있어서 고정 bg를 깔면 조합에 따라 대비가 나빠진다.
      // inverse는 원래 색을 그대로 반전시키니 어떤 조합이든 항상 잘 보인다.
      style: { selected: { inverse: true } },
    });

    this.statusBox = blessed.box({
      bottom: 0,
      left: 0,
      width: "100%",
      height: 3,
      tags: true,
      border: { type: "line" },
      style: { border: { fg: "grey" } },
    });

    this.screen.append(this.headerBox);
    this.screen.append(this.list);
    this.screen.append(this.statusBox);

    this.list.on("select", (_item, index) => {
      if (this.popupOpen) return;
      const match = this.matches[index];
      if (match) this.onSelect(match);
    });
    this.screen.key(["q", "C-c"], () => {
      if (!this.popupOpen) this.onQuit();
    });
    this.screen.key(["left"], () => {
      if (!this.popupOpen) this.onDateChange(-1);
    });
    this.screen.key(["right"], () => {
      if (!this.popupOpen) this.onDateChange(1);
    });
    this.screen.key(["r"], () => {
      if (!this.popupOpen) this.onRefresh();
    });
    this.screen.key(["l"], () => {
      if (this.popupOpen) return;
      this.popupOpen = true;
      showLanguagePopup(
        this.screen,
        this.locale,
        (chosen) => {
          this.popupOpen = false;
          this.onLocaleChange(chosen);
        },
        () => {
          this.popupOpen = false;
        },
      );
    });
    this.screen.key(["c"], () => {
      if (this.popupOpen) return;
      this.popupOpen = true;
      showCountryPopup(
        this.screen,
        this.country.code,
        (chosen) => {
          this.popupOpen = false;
          this.onCountryChange(chosen);
        },
        () => {
          this.popupOpen = false;
        },
      );
    });

    this.renderHeader();
    this.renderHint();
    this.list.focus();
    this.screen.render();
  }

  private renderHeader(): void {
    this.headerBox.setContent(
      `${t(this.locale).pickerHeader(this.dateLabel, this.matches.length)} {grey-fg}(${this.country.flag} ${this.country.name}){/grey-fg}`,
    );
  }

  private renderHint(extra = ""): void {
    this.statusBox.setContent(`{grey-fg}${t(this.locale).pickerHint}{/grey-fg}${extra ? `  ${extra}` : ""}`);
  }

  private renderList(): void {
    this.list.setItems(this.matches.map((m) => formatRow(m, this.locale, this.country.timeZone)) as unknown as string[]);
  }

  setLocale(locale: Locale): void {
    this.locale = locale;
    this.renderHeader();
    this.renderHint();
    this.renderList();
    this.screen.render();
  }

  setCountry(country: Country): void {
    this.country = country;
    this.renderHeader();
    this.renderList();
    this.screen.render();
  }

  setMatches(matches: MatchSummary[], dateLabel: string): void {
    this.matches = matches;
    this.dateLabel = dateLabel;
    this.renderHeader();
    this.renderList();
    if (matches.length > 0) this.list.select(0);
    this.screen.render();
  }

  setStatus(text: string): void {
    this.renderHint(text);
    this.screen.render();
  }

  destroy(): void {
    this.screen.destroy();
  }
}
