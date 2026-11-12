export type Sem = "1" | "2";

export type KeywordEntry = { tags: string[]; text: string };
export type CareerEntry = {
  mode: "decided" | "exploring";
  career: string;
  motivation: string;
  interest: string;
  effort: string;
};
export type ActivityItem = {
  id: string;
  sem: Sem;
  name: string;
  period: string;
  detail: string; // 학급 활동: 나의 역할 / 진로활동: 주요 내용
  text: string;
};
export type TextMap = Record<string, string>;
export type TopRow = { cat: string; name: string };

export type Data = Record<string, unknown>;

// ---------------------------------------------------------------------------
// 키 이름 규칙
// kw:<학기>:<영역>       KeywordEntry
// career                 CareerEntry
// school:items           ActivityItem[]
// school:pledge          TextMap { text }
// careerAct:items        ActivityItem[]
// careerAct:plan         TextMap { text }
// cmp:<학기>:<질문>       TextMap
// vac:summer / vac:winter TextMap
// top5                   TopRow[]
// ---------------------------------------------------------------------------

export const KEYWORD_AREAS = [
  { id: "strength", title: "나의 강점", question: "나는 어떤 사람이었는가?" },
  { id: "learning", title: "배움의 모습", question: "나는 어떻게 배우고 탐구했는가?" },
  { id: "community", title: "공동체 속 역할", question: "나는 학급에서 어떤 역할을 했는가?" },
] as const;

export const CAREER_FIELDS = {
  decided: [
    { id: "career", label: "현재 가장 관심 있는 진로 (직업 또는 분야)", rows: 1 },
    {
      id: "motivation",
      label: "이 진로에 관심을 갖게 된 계기",
      hint: "교과수업, 독서, 진로활동, 자율활동, 동아리, 가족, 친구, 미디어 등을 참고해 구체적으로 작성하세요.",
      rows: 5,
    },
  ],
  exploring: [
    { id: "interest", label: "현재 가장 흥미를 느끼는 학습 분야 또는 사회적 문제(관심사)", rows: 3 },
    { id: "effort", label: "진로를 찾기 위해 시도했던 노력이나 경험", rows: 5 },
  ],
} as const;

export type SubField = { id: string; label: string; placeholder?: string };
export type Competency = { id: string; title: string; question: string; group: "학업" | "공동체"; fields: SubField[] };

export const COMPETENCIES: Competency[] = [
  {
    id: "curiosity",
    group: "학업",
    title: "지적 호기심과 주도적 탐구",
    question: "수업 중 호기심이 생겨 스스로 심화 탐구를 진행한 경험은 무엇인가요?",
    fields: [
      {
        id: "motive",
        label: "탐구 계기 (동기)",
        placeholder: "예) 통합과학 시간 '기후 변화' 단원을 배우고, 엘니뇨 현상의 물리적 메커니즘에 호기심이 생김",
      },
      {
        id: "process",
        label: "탐구 과정 (구체적 노력)",
        placeholder: "예) 관련 논문 요약본을 찾아보고 과학 잡지 내용을 참고하여 보고서를 작성함",
      },
      { id: "reflection", label: "배운 점 및 성찰 (성장)" },
    ],
  },
  {
    id: "attitude",
    group: "학업",
    title: "학업적 태도 및 성찰",
    question: "한 학기 동안 나만의 학습 계획을 세우고, 취약 과목의 문제를 극복하기 위해 노력한 구체적 사례를 적어주세요.",
    fields: [
      { id: "problem", label: "대상 과목 및 문제점" },
      {
        id: "effort",
        label: "내가 시도한 해결 노력",
        placeholder: "예) '매일 영단어 30개 암기 + 하루 3지문 완벽 분석'이라는 루틴을 세워 꾸준히 실천함",
      },
    ],
  },
  {
    id: "care",
    group: "공동체",
    title: "배려와 나눔",
    question: "학급 친구나 주변 사람들을 위해 대가 없이 실천한 배려나 나눔의 경험과 그로 인한 변화는 무엇인가요?",
    fields: [
      { id: "situation", label: "나의 배려가 필요했던 상황" },
      { id: "action", label: "내가 취한 구체적 행동" },
      { id: "change", label: "그 행동이 상대방과 나에게 준 변화" },
    ],
  },
  {
    id: "responsibility",
    group: "공동체",
    title: "성실성과 책임감",
    question: "학급에서 맡은 임무나 공동 과제에서 어려움이 생겼을 때, 회피하지 않고 끝까지 책임감 있게 완수한 경험은 무엇인가요?",
    fields: [
      { id: "role", label: "나에게 주어진 역할 / 책임" },
      { id: "problem", label: "발생한 문제 상황" },
      { id: "effort", label: "문제 극복과 책임을 다하기 위한 노력" },
    ],
  },
  {
    id: "collab",
    group: "공동체",
    title: "협업과 갈등 해결",
    question: "모둠 수행평가나 학급 행사 준비 중 의견 대립 등의 갈등이 발생했을 때, 어떻게 조율하여 해결했나요?",
    fields: [
      {
        id: "conflict",
        label: "당시의 갈등 상황",
        placeholder: "예) 발표 자료의 분량 조절 및 역할 배분 문제로 모둠원 간의 의견 대립 발생",
      },
      {
        id: "solution",
        label: "내가 제안한 해결책 및 의사소통 방식",
        placeholder: "예) 각자의 강점을 분석해 피드백 담당과 제작 담당을 재배치함",
      },
      { id: "result", label: "팀 활동의 최종 결과 및 느낀 점" },
    ],
  },
  {
    id: "community",
    group: "공동체",
    title: "공동체 기여",
    question: "소속된 공동체(학급, 동아리, 학교)의 긍정적인 변화나 단합을 위해 내가 주도적으로 기여한 행동은 무엇인가요?",
    fields: [
      {
        id: "action",
        label: "공동체를 위한 나의 행동",
        placeholder: "예) 시험 기간 예민해진 반 분위기를 풀기 위해 아침마다 칠판에 응원 문구를 적음",
      },
      { id: "change", label: "우리 공동체에 일어난 작은 변화" },
    ],
  },
];

export const VACATION_AREAS = [
  { id: "academic", title: "학업 역량 보완" },
  { id: "reading", title: "독서 활동" },
  { id: "habit", title: "규칙적 생활 (습관)" },
] as const;

export const TOP_CATEGORIES = ["자율", "진로", "동아리", "학업 역량", "공동체 역량", "교과", "기타"];

export type SectionId = "keywords" | "career" | "school" | "careerAct" | "competency" | "vacation" | "top5";

export function sectionsFor(sem: Sem): { id: SectionId; title: string; short: string }[] {
  const list: { id: SectionId; title: string; short: string }[] = [
    { id: "keywords", title: "성장한 나를 키워드로", short: "키워드" },
    { id: "career", title: "나의 진로 설계", short: "진로 설계" },
    { id: "school", title: "학교·학급 활동 기록", short: "학급 활동" },
    { id: "careerAct", title: "진로활동 기록", short: "진로활동" },
    { id: "competency", title: "학업·공동체 역량", short: "역량" },
    { id: "vacation", title: sem === "1" ? "여름방학 실행 계획" : "겨울방학 실행 계획", short: sem === "1" ? "여름방학" : "겨울방학" },
  ];
  if (sem === "2") list.push({ id: "top5", title: "생기부에 꼭 남기고 싶은 성장", short: "Top 5" });
  return list;
}

// ---------------------------------------------------------------------------
// 도우미
// ---------------------------------------------------------------------------

export function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function filled(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/** 나이스 기준 바이트 수: 한글 3, 영문·숫자·공백 1, 줄바꿈 2 */
export function neisBytes(s: string): number {
  let b = 0;
  for (const ch of s) {
    if (ch === "\n") b += 2;
    else if ((ch.codePointAt(0) ?? 0) <= 0x7f) b += 1;
    else b += 3;
  }
  return b;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function getKeyword(data: Data, sem: Sem, area: string): KeywordEntry {
  const v = data[`kw:${sem}:${area}`] as Partial<KeywordEntry> | undefined;
  return { tags: Array.isArray(v?.tags) ? v!.tags : [], text: str(v?.text) };
}

export function getCareer(data: Data): CareerEntry {
  const v = (data["career"] ?? {}) as Partial<CareerEntry>;
  return {
    mode: v.mode === "exploring" ? "exploring" : "decided",
    career: str(v.career),
    motivation: str(v.motivation),
    interest: str(v.interest),
    effort: str(v.effort),
  };
}

export function getItems(data: Data, key: string): ActivityItem[] {
  const v = data[key];
  return Array.isArray(v) ? (v as ActivityItem[]) : [];
}

export function getMap(data: Data, key: string): TextMap {
  const v = data[key];
  return v && typeof v === "object" && !Array.isArray(v) ? (v as TextMap) : {};
}

export function getTop(data: Data): TopRow[] {
  const v = data["top5"];
  const rows = Array.isArray(v) ? (v as TopRow[]) : [];
  return Array.from({ length: 5 }, (_, i) => ({ cat: str(rows[i]?.cat), name: str(rows[i]?.name) }));
}

export type Progress = { done: number; total: number; label: string };

export function sectionProgress(data: Data, sem: Sem, id: SectionId): Progress {
  switch (id) {
    case "keywords": {
      const done = KEYWORD_AREAS.filter((a) => {
        const k = getKeyword(data, sem, a.id);
        return k.tags.length > 0 && filled(k.text);
      }).length;
      return { done, total: 3, label: `${done}/3` };
    }
    case "career": {
      const c = getCareer(data);
      const fields = CAREER_FIELDS[c.mode];
      const done = fields.filter((f) => filled(c[f.id as keyof CareerEntry])).length;
      return { done, total: fields.length, label: `${done}/${fields.length}` };
    }
    case "school":
    case "careerAct": {
      const items = getItems(data, `${id}:items`).filter((i) => i.sem === sem);
      const written = items.filter((i) => filled(i.text)).length;
      const extraKey = id === "school" ? "school:pledge" : "careerAct:plan";
      const hasExtra = sem === "1";
      const extraDone = hasExtra && filled(getMap(data, extraKey).text) ? 1 : 0;
      const done = (written > 0 ? 1 : 0) + extraDone;
      return { done, total: hasExtra ? 2 : 1, label: `${items.length}개` };
    }
    case "competency": {
      const done = COMPETENCIES.filter((c) => {
        const m = getMap(data, `cmp:${sem}:${c.id}`);
        return c.fields.some((f) => filled(m[f.id]));
      }).length;
      return { done, total: COMPETENCIES.length, label: `${done}/${COMPETENCIES.length}` };
    }
    case "vacation": {
      const m = getMap(data, sem === "1" ? "vac:summer" : "vac:winter");
      const done = VACATION_AREAS.filter((a) => filled(m[a.id])).length;
      return { done, total: 3, label: `${done}/3` };
    }
    case "top5": {
      const done = getTop(data).filter((r) => filled(r.name)).length;
      return { done, total: 5, label: `${done}/5` };
    }
  }
}
