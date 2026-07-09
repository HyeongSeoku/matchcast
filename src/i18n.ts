import type { MatchStatus, StatSection } from "./types/domain.js";

export type Locale = "ko" | "en" | "ja" | "es";

export const DEFAULT_LOCALE: Locale = "ko";

const LOCALE_VALUES: Locale[] = ["ko", "en", "ja", "es"];

export function isLocale(value: string): value is Locale {
  return (LOCALE_VALUES as string[]).includes(value);
}

/** toLocaleTimeString/toLocaleDateString 등에 넘길 BCP-47 태그 */
export function intlTag(locale: Locale): string {
  switch (locale) {
    case "ko":
      return "ko-KR";
    case "ja":
      return "ja-JP";
    case "es":
      return "es-ES";
    default:
      return "en-US";
  }
}

interface Messages {
  appDescription: string;
  cmdWatchDescription: string;
  cmdListDescription: string;
  cmdLiveDescription: string;
  cmdLiveLeagueArg: string;
  cmdLiveEventArg: string;
  langOption: string;
  noMatchesToday: string;
  invalidEventId: string;
  pickerLoading: (dateLabel: string) => string;
  pickerHeader: (dateLabel: string, count: number) => string;
  pickerHint: string;
  lastRefresh: (time: string) => string;
  lastUpdate: (time: string) => string;
  quitHint: string;
  groundLabel: string;
  eventsLabel: string;
  noEvents: string;
  possessionPending: string;
  possessionUnavailable: string;
  vsSeparator: string;
  statusLabels: Record<MatchStatus, string>;
  assist: (name: string) => string;
  substitutionFallback: (out: string, in_: string) => string;
  halfTimeText: string;
  fullTimeText: string;
  kickoffText: string;
  playerFallback: string;
  goalFallback: string;
  shotOnTargetText: (name: string) => string;
  cornerText: (team: string) => string;
  offsideText: (name: string) => string;
  varText: string;
  penaltyScoredText: (name: string) => string;
  penaltyMissedText: (name: string) => string;
  penaltySavedText: (name: string) => string;
  shootoutStartText: string;
  shootoutScoreSuffix: (home: number, away: number) => string;
  shootoutTabLabel: string;
  shootoutPanelLabel: string;
  shootoutUnavailable: string;
  statsLabel: string;
  statsShots: string;
  statsOnTarget: string;
  statsCorners: string;
  statsCards: string;
  statsUnavailable: string;
  statLabels: Record<string, string>;
  statSectionLabels: Record<StatSection, string>;
  gameInfo: (venue: string, city: string, attendance: string, referee: string) => string;
  infoPanelLabel: string;
  lineupLabel: string;
  formationLabel: (formation: string) => string;
  benchCountLabel: (count: number) => string;
  lineupUnavailable: string;
  recentFormLabel: string;
  formUnavailable: string;
  headToHeadLabel: string;
  headToHeadUnavailable: string;
  scrollHint: string;
}

const ko: Messages = {
  appDescription: "터미널에서 축구 경기를 텍스트로 중계하는 CLI",
  cmdWatchDescription: "메인 화면 — 날짜별 경기 목록에서 골라서 시청 (기본 커맨드)",
  cmdListDescription: "오늘 경기 목록을 텍스트로 출력합니다 (스크립팅용)",
  cmdLiveDescription: "특정 경기로 바로 실시간 중계를 시청합니다",
  cmdLiveLeagueArg: "ESPN 리그 슬러그 (예: eng.1, fifa.world — matchcast list 또는 메인 화면에서 확인)",
  cmdLiveEventArg: "ESPN 이벤트 ID",
  langOption: "표시 언어 (ko/en/ja/es, 기본값 ko)",
  noMatchesToday: "오늘 예정된 경기가 없습니다.",
  invalidEventId: "eventId는 정수여야 합니다.",
  pickerLoading: () => "불러오는 중...",
  pickerHeader: (dateLabel, count) => `{bold}matchcast{/bold} — ${dateLabel} 경기 (${count}개)`,
  pickerHint: "↑↓ 이동 · Enter 시청 · ←/→ 날짜 이동 · l 언어 · c 국가 · r 새로고침 · q 종료",
  lastRefresh: (time) => `마지막 갱신: ${time}`,
  lastUpdate: (time) => `마지막 업데이트: ${time}`,
  quitHint: "Esc/b: 목록으로  ·  q: 종료  ·  l: 언어 전환",
  groundLabel: " 그라운드 (점유율) ",
  eventsLabel: " 이벤트 ",
  noEvents: "아직 이벤트가 없습니다.",
  possessionPending: "점유율: 첫 갱신 대기 중...",
  possessionUnavailable: "점유율: 아직 통계 없음",
  vsSeparator: "vs",
  statusLabels: {
    SCHEDULED: "예정",
    IN_PLAY: "진행중",
    PAUSED: "HT",
    FINISHED: "종료",
    SUSPENDED: "중단",
    POSTPONED: "연기",
    CANCELLED: "취소",
    AWARDED: "몰수",
  },
  assist: (name) => ` (도움: ${name})`,
  substitutionFallback: (out, in_) => `${out} → ${in_}`,
  halfTimeText: "⏸️ 전반 종료",
  fullTimeText: "🏁 경기 종료",
  kickoffText: "▶️ 킥오프",
  playerFallback: "선수",
  goalFallback: "득점",
  shotOnTargetText: (name) => `🎯 ${name} 유효슈팅`,
  cornerText: (team) => `🚩 코너킥 (${team})`,
  offsideText: (name) => `🚫 ${name} 오프사이드`,
  varText: "📺 VAR 판정 번복",
  penaltyScoredText: (name) => `⚽ ${name} 승부차기 성공`,
  penaltyMissedText: (name) => `❌ ${name} 승부차기 실축`,
  penaltySavedText: (name) => `🧤 ${name} 승부차기 선방당함`,
  shootoutStartText: "🥅 승부차기 시작",
  shootoutScoreSuffix: (home, away) => `(승부차기 ${home}-${away})`,
  shootoutTabLabel: " ⚽ 승부차기 [p] ",
  shootoutPanelLabel: " 승부차기 ",
  shootoutUnavailable: "승부차기 정보 없음",
  statsLabel: " 통계 ",
  statsShots: "슈팅",
  statsOnTarget: "유효슈팅",
  statsCorners: "코너킥",
  statsCards: "카드",
  statsUnavailable: "통계 데이터 없음",
  statLabels: {
    totalShots: "슈팅",
    shotsOnTarget: "유효슈팅",
    wonCorners: "코너킥",
    foulsCommitted: "파울",
    offsides: "오프사이드",
    saves: "선방",
    yellowCards: "옐로카드",
    redCards: "레드카드",
    penaltyKickGoals: "PK 성공",
    penaltyKickShots: "PK 시도",
    accuratePasses: "성공 패스",
    totalPasses: "전체 패스",
    passPct: "패스 성공률(%)",
    accurateCrosses: "성공 크로스",
    totalCrosses: "전체 크로스",
    crossPct: "크로스 성공률(%)",
    totalLongBalls: "롱볼 시도",
    accurateLongBalls: "롱볼 성공",
    longballPct: "롱볼 성공률(%)",
    blockedShots: "슈팅 차단",
    effectiveTackles: "성공 태클",
    totalTackles: "전체 태클",
    tacklePct: "태클 성공률(%)",
    interceptions: "인터셉트",
    effectiveClearance: "클리어링",
    totalClearance: "전체 클리어링 시도",
  },
  statSectionLabels: {
    attack: "⚔️ 공격",
    discipline: "🟨 파울/카드",
    passing: "🔀 패스",
    defense: "🛡️ 수비",
  },
  gameInfo: (venue, city, attendance, referee) => `🏟️ ${venue}${city ? `, ${city}` : ""}  👥 ${attendance}  🧑‍⚖️ ${referee}`,
  infoPanelLabel: " 통계 · 라인업 ",
  lineupLabel: " 라인업 ",
  formationLabel: (formation) => `포메이션 ${formation}`,
  benchCountLabel: (count) => `벤치 ${count}명`,
  lineupUnavailable: "라인업 정보 없음",
  recentFormLabel: "최근 5경기",
  formUnavailable: "최근 경기 정보 없음",
  headToHeadLabel: "상대전적",
  headToHeadUnavailable: "상대전적 정보 없음",
  scrollHint: "Tab 패널전환 · ↑↓ 스크롤 · +/- 상하비율 · [/] 좌우비율",
};

const en: Messages = {
  appDescription: "Watch football matches as live text commentary in your terminal",
  cmdWatchDescription: "Main screen — pick a match from the daily list (default command)",
  cmdListDescription: "Print today's matches as plain text (for scripting)",
  cmdLiveDescription: "Jump straight into live commentary for a specific match",
  cmdLiveLeagueArg: "ESPN league slug (e.g. eng.1, fifa.world — see `matchcast list` or the main screen)",
  cmdLiveEventArg: "ESPN event ID",
  langOption: "Display language (ko/en/ja/es, default ko)",
  noMatchesToday: "No matches scheduled today.",
  invalidEventId: "eventId must be an integer.",
  pickerLoading: () => "Loading...",
  pickerHeader: (dateLabel, count) => `{bold}matchcast{/bold} — ${dateLabel} (${count} matches)`,
  pickerHint: "↑↓ move · Enter watch · ←/→ change date · l language · c country · r refresh · q quit",
  lastRefresh: (time) => `Last refreshed: ${time}`,
  lastUpdate: (time) => `Last update: ${time}`,
  quitHint: "Esc/b: back  ·  q: quit  ·  l: switch language",
  groundLabel: " Ground (possession) ",
  eventsLabel: " Events ",
  noEvents: "No events yet.",
  possessionPending: "Possession: waiting for first update...",
  possessionUnavailable: "Possession: no stats yet",
  vsSeparator: "vs",
  statusLabels: {
    SCHEDULED: "Scheduled",
    IN_PLAY: "Live",
    PAUSED: "HT",
    FINISHED: "FT",
    SUSPENDED: "Suspended",
    POSTPONED: "Postponed",
    CANCELLED: "Cancelled",
    AWARDED: "Awarded",
  },
  assist: (name) => ` (assist: ${name})`,
  substitutionFallback: (out, in_) => `${out} → ${in_}`,
  halfTimeText: "⏸️ Half-time",
  fullTimeText: "🏁 Full-time",
  kickoffText: "▶️ Kick-off",
  playerFallback: "player",
  goalFallback: "Goal",
  shotOnTargetText: (name) => `🎯 ${name} shot on target`,
  cornerText: (team) => `🚩 Corner (${team})`,
  offsideText: (name) => `🚫 ${name} offside`,
  varText: "📺 VAR decision overturned",
  penaltyScoredText: (name) => `⚽ ${name} scores the penalty`,
  penaltyMissedText: (name) => `❌ ${name} misses the penalty`,
  penaltySavedText: (name) => `🧤 ${name}'s penalty saved`,
  shootoutStartText: "🥅 Penalty shootout begins",
  shootoutScoreSuffix: (home, away) => `(PSO ${home}-${away})`,
  shootoutTabLabel: " ⚽ Shootout [p] ",
  shootoutPanelLabel: " Shootout ",
  shootoutUnavailable: "No shootout data",
  statsLabel: " Stats ",
  statsShots: "Shots",
  statsOnTarget: "On target",
  statsCorners: "Corners",
  statsCards: "Cards",
  statsUnavailable: "No stats yet",
  statLabels: {
    totalShots: "Shots",
    shotsOnTarget: "On target",
    wonCorners: "Corners",
    foulsCommitted: "Fouls",
    offsides: "Offsides",
    saves: "Saves",
    yellowCards: "Yellow cards",
    redCards: "Red cards",
    penaltyKickGoals: "Penalties scored",
    penaltyKickShots: "Penalties taken",
    accuratePasses: "Passes completed",
    totalPasses: "Passes attempted",
    passPct: "Pass accuracy (%)",
    accurateCrosses: "Crosses completed",
    totalCrosses: "Crosses attempted",
    crossPct: "Cross accuracy (%)",
    totalLongBalls: "Long balls attempted",
    accurateLongBalls: "Long balls completed",
    longballPct: "Long ball accuracy (%)",
    blockedShots: "Blocked shots",
    effectiveTackles: "Tackles won",
    totalTackles: "Tackles attempted",
    tacklePct: "Tackle success (%)",
    interceptions: "Interceptions",
    effectiveClearance: "Clearances",
    totalClearance: "Clearance attempts",
  },
  statSectionLabels: {
    attack: "⚔️ Attack",
    discipline: "🟨 Fouls & cards",
    passing: "🔀 Passing",
    defense: "🛡️ Defense",
  },
  gameInfo: (venue, city, attendance, referee) => `🏟️ ${venue}${city ? `, ${city}` : ""}  👥 ${attendance}  🧑‍⚖️ ${referee}`,
  infoPanelLabel: " Stats · Lineups ",
  lineupLabel: " Lineups ",
  formationLabel: (formation) => `Formation ${formation}`,
  benchCountLabel: (count) => `Bench: ${count}`,
  lineupUnavailable: "No lineup data",
  recentFormLabel: "Last 5 games",
  formUnavailable: "No recent form data",
  headToHeadLabel: "Head to head",
  headToHeadUnavailable: "No head-to-head data",
  scrollHint: "Tab switch panel · ↑↓ scroll · +/- resize rows · [/] resize cols",
};

const ja: Messages = {
  appDescription: "ターミナルでサッカーの試合をテキスト中継するCLI",
  cmdWatchDescription: "メイン画面 — 日付ごとの試合一覧から選んで視聴（デフォルト）",
  cmdListDescription: "今日の試合一覧をテキストで出力します（スクリプト用）",
  cmdLiveDescription: "特定の試合のライブ中継にすぐ入ります",
  cmdLiveLeagueArg: "ESPNのリーグスラッグ（例: eng.1, fifa.world — matchcast list またはメイン画面で確認）",
  cmdLiveEventArg: "ESPNのイベントID",
  langOption: "表示言語（ko/en/ja/es、デフォルト ko）",
  noMatchesToday: "本日予定されている試合はありません。",
  invalidEventId: "eventIdは整数である必要があります。",
  pickerLoading: () => "読み込み中...",
  pickerHeader: (dateLabel, count) => `{bold}matchcast{/bold} — ${dateLabel} の試合（${count}件）`,
  pickerHint: "↑↓ 移動 · Enter 視聴 · ←/→ 日付移動 · l 言語 · c 国 · r 更新 · q 終了",
  lastRefresh: (time) => `最終更新: ${time}`,
  lastUpdate: (time) => `最終更新: ${time}`,
  quitHint: "Esc/b: 一覧へ  ·  q: 終了  ·  l: 言語切替",
  groundLabel: " グラウンド（ポゼッション） ",
  eventsLabel: " イベント ",
  noEvents: "まだイベントがありません。",
  possessionPending: "ポゼッション: 初回更新待ち...",
  possessionUnavailable: "ポゼッション: 統計データなし",
  vsSeparator: "vs",
  statusLabels: {
    SCHEDULED: "予定",
    IN_PLAY: "試合中",
    PAUSED: "HT",
    FINISHED: "終了",
    SUSPENDED: "中断",
    POSTPONED: "延期",
    CANCELLED: "中止",
    AWARDED: "没収",
  },
  assist: (name) => ` (アシスト: ${name})`,
  substitutionFallback: (out, in_) => `${out} → ${in_}`,
  halfTimeText: "⏸️ 前半終了",
  fullTimeText: "🏁 試合終了",
  kickoffText: "▶️ キックオフ",
  playerFallback: "選手",
  goalFallback: "ゴール",
  shotOnTargetText: (name) => `🎯 ${name} 枠内シュート`,
  cornerText: (team) => `🚩 コーナーキック（${team}）`,
  offsideText: (name) => `🚫 ${name} オフサイド`,
  varText: "📺 VAR判定訂正",
  penaltyScoredText: (name) => `⚽ ${name} PK成功`,
  penaltyMissedText: (name) => `❌ ${name} PK失敗`,
  penaltySavedText: (name) => `🧤 ${name} PK阻止される`,
  shootoutStartText: "🥅 PK戦開始",
  shootoutScoreSuffix: (home, away) => `(PK戦 ${home}-${away})`,
  shootoutTabLabel: " ⚽ PK戦 [p] ",
  shootoutPanelLabel: " PK戦 ",
  shootoutUnavailable: "PK戦データなし",
  statsLabel: " 統計 ",
  statsShots: "シュート",
  statsOnTarget: "枠内シュート",
  statsCorners: "コーナーキック",
  statsCards: "カード",
  statsUnavailable: "統計データなし",
  statLabels: {
    totalShots: "シュート",
    shotsOnTarget: "枠内シュート",
    wonCorners: "コーナーキック",
    foulsCommitted: "ファウル",
    offsides: "オフサイド",
    saves: "セーブ",
    yellowCards: "イエローカード",
    redCards: "レッドカード",
    penaltyKickGoals: "PK成功",
    penaltyKickShots: "PK試行",
    accuratePasses: "パス成功",
    totalPasses: "パス試行",
    passPct: "パス成功率(%)",
    accurateCrosses: "クロス成功",
    totalCrosses: "クロス試行",
    crossPct: "クロス成功率(%)",
    totalLongBalls: "ロングボール試行",
    accurateLongBalls: "ロングボール成功",
    longballPct: "ロングボール成功率(%)",
    blockedShots: "ブロック",
    effectiveTackles: "タックル成功",
    totalTackles: "タックル試行",
    tacklePct: "タックル成功率(%)",
    interceptions: "インターセプト",
    effectiveClearance: "クリア",
    totalClearance: "クリア試行",
  },
  statSectionLabels: {
    attack: "⚔️ 攻撃",
    discipline: "🟨 ファウル/カード",
    passing: "🔀 パス",
    defense: "🛡️ 守備",
  },
  gameInfo: (venue, city, attendance, referee) => `🏟️ ${venue}${city ? `, ${city}` : ""}  👥 ${attendance}  🧑‍⚖️ ${referee}`,
  infoPanelLabel: " 統計・ラインナップ ",
  lineupLabel: " ラインナップ ",
  formationLabel: (formation) => `フォーメーション ${formation}`,
  benchCountLabel: (count) => `控え ${count}名`,
  lineupUnavailable: "ラインナップ情報なし",
  recentFormLabel: "直近5試合",
  formUnavailable: "直近の試合データなし",
  headToHeadLabel: "対戦成績",
  headToHeadUnavailable: "対戦成績データなし",
  scrollHint: "Tab パネル切替 · ↑↓ スクロール · +/- 上下比率 · [/] 左右比率",
};

const es: Messages = {
  appDescription: "Sigue partidos de fútbol como comentario en texto en tu terminal",
  cmdWatchDescription: "Pantalla principal — elige un partido de la lista diaria (comando por defecto)",
  cmdListDescription: "Imprime los partidos de hoy en texto plano (para scripts)",
  cmdLiveDescription: "Entra directamente al comentario en vivo de un partido",
  cmdLiveLeagueArg: "Slug de liga de ESPN (ej. eng.1, fifa.world — ver `matchcast list` o la pantalla principal)",
  cmdLiveEventArg: "ID de evento de ESPN",
  langOption: "Idioma (ko/en/ja/es, por defecto ko)",
  noMatchesToday: "No hay partidos programados hoy.",
  invalidEventId: "eventId debe ser un número entero.",
  pickerLoading: () => "Cargando...",
  pickerHeader: (dateLabel, count) => `{bold}matchcast{/bold} — ${dateLabel} (${count} partidos)`,
  pickerHint: "↑↓ mover · Enter ver · ←/→ cambiar fecha · l idioma · c país · r actualizar · q salir",
  lastRefresh: (time) => `Última actualización: ${time}`,
  lastUpdate: (time) => `Última actualización: ${time}`,
  quitHint: "Esc/b: volver  ·  q: salir  ·  l: cambiar idioma",
  groundLabel: " Campo (posesión) ",
  eventsLabel: " Eventos ",
  noEvents: "Todavía no hay eventos.",
  possessionPending: "Posesión: esperando primer dato...",
  possessionUnavailable: "Posesión: sin estadísticas aún",
  vsSeparator: "vs",
  statusLabels: {
    SCHEDULED: "Programado",
    IN_PLAY: "En vivo",
    PAUSED: "Descanso",
    FINISHED: "Finalizado",
    SUSPENDED: "Suspendido",
    POSTPONED: "Aplazado",
    CANCELLED: "Cancelado",
    AWARDED: "Adjudicado",
  },
  assist: (name) => ` (asistencia: ${name})`,
  substitutionFallback: (out, in_) => `${out} → ${in_}`,
  halfTimeText: "⏸️ Descanso",
  fullTimeText: "🏁 Fin del partido",
  kickoffText: "▶️ Saque inicial",
  playerFallback: "jugador",
  goalFallback: "Gol",
  shotOnTargetText: (name) => `🎯 ${name} disparo a puerta`,
  cornerText: (team) => `🚩 Córner (${team})`,
  offsideText: (name) => `🚫 ${name} fuera de juego`,
  varText: "📺 Decisión revocada por VAR",
  penaltyScoredText: (name) => `⚽ ${name} anota el penalti`,
  penaltyMissedText: (name) => `❌ ${name} falla el penalti`,
  penaltySavedText: (name) => `🧤 Penalti de ${name} atajado`,
  shootoutStartText: "🥅 Comienza la tanda de penaltis",
  shootoutScoreSuffix: (home, away) => `(Penaltis ${home}-${away})`,
  shootoutTabLabel: " ⚽ Penaltis [p] ",
  shootoutPanelLabel: " Penaltis ",
  shootoutUnavailable: "Sin datos de la tanda de penaltis",
  statsLabel: " Estadísticas ",
  statsShots: "Disparos",
  statsOnTarget: "A puerta",
  statsCorners: "Córners",
  statsCards: "Tarjetas",
  statsUnavailable: "Sin estadísticas aún",
  statLabels: {
    totalShots: "Disparos",
    shotsOnTarget: "A puerta",
    wonCorners: "Córners",
    foulsCommitted: "Faltas",
    offsides: "Fueras de juego",
    saves: "Paradas",
    yellowCards: "Tarjetas amarillas",
    redCards: "Tarjetas rojas",
    penaltyKickGoals: "Penaltis anotados",
    penaltyKickShots: "Penaltis lanzados",
    accuratePasses: "Pases completados",
    totalPasses: "Pases intentados",
    passPct: "Precisión de pase (%)",
    accurateCrosses: "Centros completados",
    totalCrosses: "Centros intentados",
    crossPct: "Precisión de centros (%)",
    totalLongBalls: "Balones largos intentados",
    accurateLongBalls: "Balones largos completados",
    longballPct: "Precisión balón largo (%)",
    blockedShots: "Disparos bloqueados",
    effectiveTackles: "Entradas ganadas",
    totalTackles: "Entradas intentadas",
    tacklePct: "Éxito en entradas (%)",
    interceptions: "Intercepciones",
    effectiveClearance: "Despejes",
    totalClearance: "Intentos de despeje",
  },
  statSectionLabels: {
    attack: "⚔️ Ataque",
    discipline: "🟨 Faltas y tarjetas",
    passing: "🔀 Pase",
    defense: "🛡️ Defensa",
  },
  gameInfo: (venue, city, attendance, referee) => `🏟️ ${venue}${city ? `, ${city}` : ""}  👥 ${attendance}  🧑‍⚖️ ${referee}`,
  infoPanelLabel: " Estadísticas · Alineaciones ",
  lineupLabel: " Alineaciones ",
  formationLabel: (formation) => `Formación ${formation}`,
  benchCountLabel: (count) => `Suplentes: ${count}`,
  lineupUnavailable: "Sin datos de alineación",
  recentFormLabel: "Últimos 5 partidos",
  formUnavailable: "Sin datos de forma reciente",
  headToHeadLabel: "Historial de enfrentamientos",
  headToHeadUnavailable: "Sin datos de enfrentamientos",
  scrollHint: "Tab cambiar panel · ↑↓ desplazar · +/- proporción vertical · [/] horizontal",
};

const MESSAGES: Record<Locale, Messages> = { ko, en, ja, es };

export function t(locale: Locale): Messages {
  return MESSAGES[locale];
}
