import type { MatchDetail, Shootout } from "../types/domain.js";

export interface ResultColors {
  home: string;
  away: string;
}

/**
 * 종료된 경기면 이긴 팀을 초록, 진 팀을 회색으로. 무승부/진행중/예정은 기존 홈(cyan)/원정(magenta) 색 유지.
 * 승부차기까지 갔으면 정규시간 스코어가 무승부여도 승부차기 결과로 승패색을 정한다.
 */
export function resultColors(match: Pick<MatchDetail, "status" | "score">, shootout?: Shootout): ResultColors {
  if (match.status !== "FINISHED" || match.score.home === null || match.score.away === null) {
    return { home: "cyan", away: "magenta" };
  }
  if (match.score.home !== match.score.away) {
    return match.score.home > match.score.away ? { home: "green", away: "grey" } : { home: "grey", away: "green" };
  }
  if (shootout && shootout.source === "api" && shootout.homeScore !== shootout.awayScore) {
    return shootout.homeScore > shootout.awayScore ? { home: "green", away: "grey" } : { home: "grey", away: "green" };
  }
  return { home: "white", away: "white" };
}
