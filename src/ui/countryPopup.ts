import blessed from "blessed";
import { COUNTRIES, type Country } from "../countries.js";

/** 언어 팝업과 동일한 패턴의 국가 선택 팝업. 국가는 표시 시각의 타임존을 결정한다. */
export function showCountryPopup(
  screen: blessed.Widgets.Screen,
  currentCode: string,
  onSelect: (country: Country) => void,
  onCancel: () => void,
): void {
  const previouslyFocused = screen.focused;

  const box = blessed.list({
    top: "center",
    left: "center",
    width: 30,
    height: Math.min(COUNTRIES.length + 2, 16),
    tags: true,
    keys: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    border: { type: "line" },
    label: " Country ",
    style: {
      border: { fg: "yellow" },
      selected: { inverse: true },
    },
    items: COUNTRIES.map((c) => `${c.flag} ${c.name}`),
  });

  screen.append(box);
  const currentIndex = COUNTRIES.findIndex((c) => c.code === currentCode);
  box.select(currentIndex === -1 ? 0 : currentIndex);
  box.focus();
  screen.render();

  const close = (): void => {
    screen.remove(box);
    previouslyFocused?.focus();
    screen.render();
  };

  box.on("select", (_item, index) => {
    const chosen = COUNTRIES[index];
    close();
    if (chosen) onSelect(chosen);
  });

  box.key(["escape", "q"], () => {
    close();
    onCancel();
  });
}
