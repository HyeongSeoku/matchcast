# matchcast

Watch football/soccer matches as live text commentary in your terminal. Inspired by [Playball](https://github.com/paaatrick/playball) (the MLB equivalent).

**[English](#english)** | **[한국어](#한국어)**

---

## English

### No API key required

Uses ESPN's unofficial (hidden) sports API (`site.api.espn.com`) — no signup, no API key. Just `npm install` and run.

- ✅ Score, live minute + stoppage time (e.g. `90'+2'`), HT/FT
- ✅ **Play-by-play commentary** — goals (scorer + assist), cards, substitutions (with clear direction), plus shots on target, corners, offsides, and VAR decisions, pulled straight from ESPN's full commentary feed
- ✅ **26 match stats** — shots/shots on target/corners/fouls/offsides/saves/cards/penalties/pass·cross·long-ball accuracy/tackles/interceptions/clearances, all shown as side-by-side bars
- ✅ **Match info** — venue, city, attendance, referee
- ✅ **Lineups & formation** — both teams' starting XI (jersey number + position) drawn on the pitch, plus bench count
- ✅ **Recent form & head-to-head** — each team's last 5 results, and the two teams' all-time meetings
- ✅ **Penalty shootouts** — if regulation ends level and it goes to penalties, the scoreboard shows `(PSO 4-3)` and every kick is logged in the event feed. A `[p]` tab in the top-right of the Ground panel switches to a goal-mouth diagram showing who shot where, and whether it was scored, missed, or saved
- ✅ **Browse past matches** — just change the date to replay any finished match (no rate limit, so you can look up anything, anytime)
- ⚠️ Ground panel — **not real-time ball tracking.** Instead, it shades the pitch cyan (home) / magenta (away) proportional to possession %, with the split line and percentages shown live.

**Heads up**: this is an unofficial endpoint ESPN uses internally for its own app/site — there's no public documentation, and it can change or get blocked without notice. It's plenty solid for a personal hobby project, just keep that in mind.

### Install & run

```bash
cd ~/Side/matchcast
npm install
npm run build
node dist/index.js
```

### Usage

Leagues on the main screen: World Cup, Champions League, Europa League, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Primeira Liga, Championship, Brazilian Série A, K League 1, MLS, **J1 League, Liga MX, Argentine Primera, Copa Libertadores**.

```bash
# Main screen — pick a match from the daily list (default when run with no args)
node dist/index.js
# ↑↓ move between matches · Enter to watch · ←/→ change date (past/future, empty days are auto-skipped)
# l language popup · c country popup · r refresh · q quit

# Inside the live match screen:
# Esc or b to go back to the list, q to quit the whole app

# Set language + country directly via flags
node dist/index.js --lang ja --country JP

# Print today's matches as plain text (for scripting)
node dist/index.js list

# Jump straight to a match if you already know the league slug + event ID
node dist/index.js live <leagueSlug> <eventId>
# e.g. node dist/index.js live fifa.world 760507
```

During development you can run directly with tsx: `npm run dev` / `npm run dev -- list`.

Opening a finished (FT) match fetches once and stops — no polling, good for replaying past matches. Live matches refresh every 15 seconds.

### Live screen layout

```
┌─────────────────────── Scoreboard ────────────────────────┐
┌──────────────────────── Ground ───────────────────────────┐
│ Venue / attendance / referee                               │
│                                                              │
│      Possession-shaded pitch with formation markers         │
│                                                              │
├──────────────────────┬────────────────────────────────────┤
│  Stats · Lineups       │  Events — commentary feed          │
│  ⚔️ Attack · 🟨 Cards · │                                    │
│  🔀 Passing · 🛡️ Defense│                                    │
│  Formation/bench, form, │                                    │
│  H2H         (scrolls)  │                            (scrolls)│
└──────────────────────┴────────────────────────────────────┘
```

All three panels — **Ground** (pitch graphic only), **Stats · Lineups**, and **Events** — scroll independently: `Tab` cycles focus, and the focused panel scrolls with `↑↓` (or `j`/`k`, `Ctrl+d`/`u` for half-page). When there's more content than fits, the panel title shows the current position like `[34%]`, and a scrollbar thumb appears on the right border. Events auto-scrolls to the bottom as new ones come in.

**Panel sizes are also adjustable**: `+`/`-` change the vertical split between the Ground panel and the bottom row, `[`/`]` change the horizontal split between Stats·Lineups and Events, in 5% steps. Once you resize anything, that ratio is kept even if you resize the terminal window afterward.

Starting lineups aren't a text list — they're **drawn directly on the Ground grid in formation shape**: each player shows as `(jersey number)` + surname, with defense/midfield/attack lines automatically inferred from position data.

If a match goes to penalties, a `⚽ Shootout [p]` tab appears in the top-right corner of the Ground panel — press `p` to toggle between the normal Ground view (formation + possession) and the goal-mouth diagram. The diagram plots each kick in order inside the goal frame (or above it, if it went over the bar), followed by a per-player list of scored/missed/saved below.

### Language

Run with `--lang ko` (default) / `en` / `ja` / `es`, or switch anytime with the `l` key popup during use. UI labels, icons, status text, and possession copy all switch language.

Note: ESPN's raw goal/card/substitution commentary text is always in English (e.g. "Haji Wright replaces Folarin Balogun.") — no matter which language you pick, that specific sentence isn't translated. There's no live machine translation for it.

### Country / timezone

**Independent of language**, pick a country via `--country <code>` or the `c` key popup during use. Kickoff times and the "today" reference date both switch to that country's real IANA timezone (regardless of your OS timezone).

Supported countries (18 total):
- Korean: 🇰🇷 KR
- English-speaking: 🇺🇸 US 🇬🇧 GB 🇨🇦 CA 🇦🇺 AU 🇳🇿 NZ 🇮🇪 IE 🇿🇦 ZA 🇮🇳 IN
- Japanese: 🇯🇵 JP
- Spanish-speaking: 🇪🇸 ES 🇲🇽 MX 🇦🇷 AR 🇨🇴 CO 🇨🇱 CL 🇵🇪 PE 🇻🇪 VE 🇺🇾 UY

Default is Korea (KR). Internally, ESPN's `dates=` param is a UTC calendar day, and a chosen country's local day can straddle two UTC days (e.g. an early-morning KST kickoff falls on the previous UTC day). Naively querying by date string used to shift those matches a day off — it's now computed by querying every UTC date that overlaps the country's local day, then filtering to matches whose actual kickoff instant falls inside that exact range (using only `Intl.DateTimeFormat`, no timezone library).

When you page dates with `←/→` and land on a day with no matches, it keeps stepping in the same direction automatically until it finds one (up to 14 days).

Quit with `q` or `Ctrl+C`.

---

## 한국어

### API 키가 필요 없습니다

ESPN의 비공식(hidden) 스포츠 API를 씁니다 (`site.api.espn.com`) — 회원가입도, API 키 발급도 필요 없습니다. `npm install` 후 바로 실행하면 됩니다.

- ✅ 스코어, 실시간 분(minute) + 추가시간(예: `90'+2'`), HT/FT
- ✅ **플레이별 코멘터리** — 골(득점자+도움) / 카드 / 교체(선수 교체 방향까지 명확히) 뿐 아니라 유효슈팅·코너킥·오프사이드·VAR 판정까지, ESPN의 전체 코멘터리 피드를 그대로 씁니다
- ✅ **경기 통계 26종** — 슈팅/유효슈팅/코너/파울/오프사이드/선방/카드/PK/패스·크로스·롱볼 성공률/태클/인터셉트/클리어링까지 ESPN이 주는 박스스코어를 전부 팀별 막대 비교로 보여줍니다
- ✅ **경기 정보** — 경기장, 도시, 관중수, 주심
- ✅ **라인업 & 포메이션** — 양팀 선발 11명(등번호+포지션)을 그라운드 위에 그려서 보여주고, 벤치 인원수도 표시합니다
- ✅ **최근 폼 & 상대전적** — 양팀 최근 5경기 결과, 두 팀의 역대 맞대결 기록
- ✅ **승부차기** — 정규시간 무승부로 승부차기까지 가면 스코어보드에 `(승부차기 4-3)`처럼 표기되고, 킥별로 이벤트 로그에도 기록됩니다. 그라운드 패널 우측 상단에 뜨는 `[p]` 탭으로 골대 다이어그램(누가/어디로/성공·실축·선방)도 볼 수 있습니다
- ✅ **과거 경기 조회** — 날짜만 바꾸면 지난 경기도 그대로 다시 볼 수 있습니다 (요청 한도가 없어서 언제든 조회 가능)
- ⚠️ 그라운드 화면 — **실시간 볼 트래킹이 아닙니다.** 대신 점유율 %만큼 그라운드를 홈(cyan)/원정(magenta) 구역으로 나눠 칠하고, 그 경계선과 각 구역에 퍼센트를 표시합니다.

**주의할 점**: 이건 ESPN이 자기 앱/웹사이트용으로 쓰는 비공식 엔드포인트라 공식 문서가 없고, 예고 없이 바뀌거나 막힐 수 있습니다. 개인 용도의 취미 프로젝트로는 충분히 실용적이지만, 이 점은 감안해주세요.

### 설치 및 실행

```bash
cd ~/Side/matchcast
npm install
npm run build
node dist/index.js
```

### 사용법

메인 화면 리그 목록: 월드컵, 챔피언스리그, 유로파리그, 프리미어리그, 라리가, 분데스리가, 세리에A, 리그1, 에레디비지에, 프리메이라리가, 챔피언십, 브라질 세리에A, K리그1, MLS, **J리그, 리가 MX, 아르헨티나 프리메라, 코파 리베르타도레스**.

```bash
# 메인 화면 — 날짜별 경기 목록에서 골라서 시청 (인자 없이 실행하면 기본으로 이게 뜸)
node dist/index.js
# ↑↓ 경기 이동 · Enter 시청 · ←/→ 날짜 이동(과거/미래, 경기 없는 날짜는 자동으로 건너뜀)
# l 언어 팝업 · c 국가 팝업 · r 새로고침 · q 종료

# 경기 상세(라이브 화면)에서는
# Esc 또는 b 로 목록으로 돌아가고, q는 앱 전체 종료

# 언어 + 국가를 커맨드로 바로 지정
node dist/index.js --lang ja --country JP

# 오늘 경기 목록을 텍스트로만 보고 싶을 때 (스크립팅용)
node dist/index.js list

# 리그 슬러그 + 경기 ID를 이미 알고 있으면 메인 화면 없이 바로 시청
node dist/index.js live <leagueSlug> <eventId>
# 예: node dist/index.js live fifa.world 760507
```

개발 중에는 `npm run dev` / `npm run dev -- list` 처럼 tsx로 바로 실행할 수 있습니다.

종료된(FT) 경기를 열면 폴링 없이 한 번만 조회하고 멈춥니다 — 과거 경기 다시보기에 적합합니다. 진행중인 경기는 15초 간격으로 갱신됩니다.

### 라이브 화면 레이아웃

```
┌─────────────────────── 스코어보드 ───────────────────────┐
┌─────────────────────── 그라운드 ─────────────────────────┐
│ 경기장/관중/심판                                          │
│                                                           │
│      선수 마커를 포메이션 모양대로 그린 점유율 피치         │
│                                                           │
├──────────────────────┬────────────────────────────────────┤
│  통계 · 라인업          │  이벤트 — 코멘터리 피드            │
│  ⚔️공격·🟨카드·🔀패스·   │                                    │
│  🛡️수비 (섹션별 26종)   │                                    │
│  포메이션/벤치·최근폼·   │                                    │
│  상대전적    (스크롤)    │                            (스크롤)│
└──────────────────────┴────────────────────────────────────┘
```

**그라운드**(피치 그래픽 전용) · **통계·라인업** · **이벤트** 세 패널 모두 스크롤됩니다: `Tab`으로 포커스를 옮기고, 포커스된 패널에서 `↑↓`(또는 `j`/`k`, `Ctrl+d`/`u`로 반 페이지)로 스크롤하세요. 스크롤할 내용이 있으면 패널 제목 옆에 `[34%]`처럼 현재 위치가 표시되고, 테두리 오른쪽에도 스크롤바가 뜹니다. 이벤트는 새 이벤트가 들어오면 자동으로 맨 아래로도 내려갑니다.

**패널 크기도 조절 가능**합니다: `+`/`-`로 그라운드 대 하단 줄의 상하 비율을, `[`/`]`로 통계·라인업 대 이벤트의 좌우 비율을 5%씩 조절할 수 있습니다. 한 번이라도 조절하면 그 뒤로 터미널 창 크기를 바꿔도 같은 비율을 유지합니다.

선발 라인업은 텍스트 목록이 아니라 **그라운드 그리드 위에 포메이션 모양 그대로** 그려집니다 — 각 선수는 `(등번호)` + 성(姓)으로 표시되고, 포지션 데이터를 분석해 수비/미드필드/공격 라인을 자동으로 나눠 배치합니다.

경기가 승부차기까지 갔으면 그라운드 패널 우측 상단에 `⚽ 승부차기 [p]` 탭이 뜹니다 — `p` 키로 평소 그라운드(포메이션+점유율) 화면과 골대 다이어그램 화면을 전환할 수 있습니다. 다이어그램은 각 킥을 순서대로 골대 안(또는 크로스바 위로 넘어갔으면 그 위)에 표시하고, 아래에 선수별 성공/실축/막힘 목록을 보여줍니다.

### 언어

`--lang ko`(기본값) / `en` / `ja` / `es` 로 실행하거나, 실행 중 `l` 키로 뜨는 팝업에서 바로 골라 전환할 수 있습니다. UI 라벨·아이콘·상태 문구·점유율 문구는 전부 바뀝니다.

단, ESPN이 주는 골/카드/교체 원문 코멘터리 자체는 항상 영어입니다 (예: "Haji Wright replaces Folarin Balogun."). 어떤 언어를 골라도 이 문장 자체가 번역되진 않습니다 — 실시간 기계번역까지는 지원하지 않습니다.

### 국가 / 시간대

**언어와 별개로** `--country <코드>` 또는 실행 중 `c` 키 팝업으로 국가를 고를 수 있습니다. 고른 국가의 실제 IANA 타임존으로 경기 킥오프 시각과 "오늘 날짜" 기준이 전부 바뀝니다 (OS 타임존과 무관하게 동작).

지원 국가(총 18개):
- 한국어권: 🇰🇷 KR
- 영어권: 🇺🇸 US 🇬🇧 GB 🇨🇦 CA 🇦🇺 AU 🇳🇿 NZ 🇮🇪 IE 🇿🇦 ZA 🇮🇳 IN
- 일본어권: 🇯🇵 JP
- 스페인어권: 🇪🇸 ES 🇲🇽 MX 🇦🇷 AR 🇨🇴 CO 🇨🇱 CL 🇵🇪 PE 🇻🇪 VE 🇺🇾 UY

기본값은 한국(KR)입니다. 내부적으로 ESPN의 `dates=` 파라미터는 UTC 하루 단위라, 고른 국가의 하루가 UTC 이틀에 걸치는 경우(예: 한국 새벽 0~8시대 킥오프는 UTC로는 전날)가 있습니다. 이걸 그냥 날짜 문자열로 조회하면 새벽 경기가 하루 밀려서 잡히는 문제가 있었는데, 지금은 그 나라 기준 하루와 겹치는 UTC 날짜를 전부 조회한 다음 실제 킥오프 시각이 그 범위 안에 들어오는 경기만 걸러내는 방식으로 계산합니다 (`Intl.DateTimeFormat`만 쓰고 별도 타임존 라이브러리는 안 씀).

`←/→`로 날짜를 넘길 때 그 날짜에 경기가 하나도 없으면 자동으로 같은 방향으로 계속 넘어가서 경기 있는 날짜를 찾습니다 (최대 14일).

종료는 `q` 또는 `Ctrl+C`.
