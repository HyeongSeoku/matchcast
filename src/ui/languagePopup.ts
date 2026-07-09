import blessed from "blessed";
import type { Locale } from "../i18n.js";

const OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: "ko", label: "한국어 (ko)" },
  { value: "en", label: "English (en)" },
  { value: "ja", label: "日本語 (ja)" },
  { value: "es", label: "Español (es)" },
];

/**
 * 화면 전환 없이 현재 화면 위에 뜨는 작은 언어 선택 팝업.
 * 순환 토글이 아니라 원하는 언어로 바로 골라 들어갈 수 있게 한다.
 */
export function showLanguagePopup(
  screen: blessed.Widgets.Screen,
  currentLocale: Locale,
  onSelect: (locale: Locale) => void,
  onCancel: () => void,
): void {
  const previouslyFocused = screen.focused;

  const box = blessed.list({
    top: "center",
    left: "center",
    width: 22,
    height: OPTIONS.length + 2,
    tags: true,
    keys: true,
    mouse: true,
    border: { type: "line" },
    label: " Language ",
    style: {
      border: { fg: "yellow" },
      selected: { inverse: true },
    },
    items: OPTIONS.map((o) => o.label),
  });

  screen.append(box);
  const currentIndex = OPTIONS.findIndex((o) => o.value === currentLocale);
  box.select(currentIndex === -1 ? 0 : currentIndex);
  box.focus();
  screen.render();

  const close = (): void => {
    screen.remove(box);
    previouslyFocused?.focus();
    screen.render();
  };

  box.on("select", (_item, index) => {
    const chosen = OPTIONS[index];
    close();
    if (chosen) onSelect(chosen.value);
  });

  box.key(["escape", "q"], () => {
    close();
    onCancel();
  });
}
