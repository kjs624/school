"use client";

import { useEffect, useRef } from "react";
import activities from "@/lib/activities.json";
import {
  CAREER_FIELDS,
  COMPETENCIES,
  KEYWORD_AREAS,
  TOP_CATEGORIES,
  VACATION_AREAS,
  filled,
  getCareer,
  getItems,
  getKeyword,
  getMap,
  getTop,
  newId,
  type ActivityItem,
  type CareerEntry,
} from "@/lib/schema";
import { AutoTextarea, Card, DownIcon, Field, ListIcon, PlusIcon, SectionHead, TagInput, TrashIcon, UpIcon, usePortfolio } from "./ui";

// 1. 키워드 ---------------------------------------------------------------
export function KeywordsSection({ num }: { num: number }) {
  const { store, sem } = usePortfolio();
  return (
    <>
      <SectionHead
        num={num}
        title="한 학기 동안 성장한 나를 키워드로"
        desc={`${sem}학기 동안의 나를 세 가지 영역에서 돌아보고, 키워드와 그 이유가 된 대표 경험을 적어 보세요.`}
      />
      <div className="stack">
        {KEYWORD_AREAS.map((a) => {
          const key = `kw:${sem}:${a.id}`;
          const v = getKeyword(store.data, sem, a.id);
          return (
            <Card key={key} title={a.title} subtitle={a.question} fieldKey={key} done={v.tags.length > 0 && filled(v.text)}>
              <Field label="키워드">
                <TagInput tags={v.tags} ariaLabel={`${a.title} 키워드`} onChange={(tags) => store.set(key, { ...v, tags })} />
              </Field>
              <Field label="이유 또는 대표 경험">
                <AutoTextarea value={v.text} ariaLabel={`${a.title} 이유 또는 대표 경험`} onChange={(text) => store.set(key, { ...v, text })} />
              </Field>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// 2. 진로 설계 -------------------------------------------------------------
export function CareerSection({ num }: { num: number }) {
  const { store } = usePortfolio();
  const c = getCareer(store.data);
  const update = (patch: Partial<CareerEntry>) => store.set("career", { ...c, ...patch });
  const fields = CAREER_FIELDS[c.mode];
  return (
    <>
      <SectionHead num={num} title="나의 진로 설계" desc="학기와 상관없이 하나로 관리됩니다. 진로가 바뀌면 언제든 고쳐 쓰세요." />
      <Card
        title={c.mode === "decided" ? "진로 방향이나 관심 직업이 있어요" : "아직 진로를 탐색하고 있어요"}
        aside={
          <div className="seg seg-sm" role="radiogroup" aria-label="진로 상태">
            <button type="button" role="radio" aria-checked={c.mode === "decided"} className={c.mode === "decided" ? "on" : ""} onClick={() => update({ mode: "decided" })}>
              관심 진로 있음
            </button>
            <button type="button" role="radio" aria-checked={c.mode === "exploring"} className={c.mode === "exploring" ? "on" : ""} onClick={() => update({ mode: "exploring" })}>
              탐색 중
            </button>
          </div>
        }
        fieldKey="career"
        done={fields.every((f) => filled(c[f.id as keyof CareerEntry]))}
      >
        {fields.map((f) => (
          <Field key={f.id} label={f.label} hint={"hint" in f ? f.hint : undefined}>
            <AutoTextarea
              value={c[f.id as keyof CareerEntry] as string}
              ariaLabel={f.label}
              minRows={f.rows}
              count={f.rows > 1}
              onChange={(v) => update({ [f.id]: v } as Partial<CareerEntry>)}
            />
          </Field>
        ))}
      </Card>
    </>
  );
}

// 3, 4. 활동 기록 (학급 활동 / 진로활동) -------------------------------------
type ListKind = "school" | "careerAct";

const LIST_COPY: Record<
  ListKind,
  {
    title: string;
    desc: string;
    detailLabel: string;
    textLabel: string;
    ex: { name: string; period: string; detail: string; text: string };
    extraKey: string;
    extraTitle: string;
  }
> = {
  school: {
    title: "학교·학급 활동 기록",
    desc: "반장, 부반장, 부장 활동, 학급 1인 1역(학급 봉사 포함), 체육대회, 학교폭력예방교육, 학급 특색활동 등을 기록합니다.",
    detailLabel: "나의 역할",
    textLabel: "주도적 행동과 활동을 통해 배우고 느낀 점 (성장, 변화)",
    ex: {
      name: "예) 학급 1인 1역 (기기 관리 담당)",
      period: "예) 3~7월",
      detail: "예) 핸드폰 수거 및 전자기기 관리",
      text: "예) 매 교시 수업 시작 전 빔프로젝터와 노트북을 연결하고, 오류 발생 시 담임 선생님께 신속히 보고하여 원활한 수업 흐름을 도움. 보이지 않는 곳에서의 성실함이 학급 공동체의 시간 절약에 크게 기여할 수 있음을 깨달음.",
    },
    extraKey: "school:pledge",
    extraTitle: "2학기 학급 공동체의 발전(또는 분위기 개선)을 위해 새롭게 도전하거나 더 발전시키고 싶은 역할과 구체적인 실행 다짐",
  },
  careerAct: {
    title: "진로활동 기록",
    desc: "진로 탐색, 강연, 진로 검사, 탐구 활동 등을 기록합니다. 오른쪽 활동 목록에서 가져오면 이름과 기간이 채워집니다.",
    detailLabel: "주요 내용",
    textLabel: "나의 탐구 과정과 진로 구체화에 미친 영향 (생각의 변화)",
    ex: {
      name: "예) SW 인재양성 프로그램 (기본과정)",
      period: "예) 5/2 ~ 6/27",
      detail: "예) 파이썬 기초, 데이터 분석, 인공지능 기초, 미니 프로젝트 진행",
      text: "예) 공공데이터를 활용한 우리 동네 미세먼지 예측 프로젝트에서 공공데이터 포털에서 CSV 데이터를 수집하고 파이썬으로 시각화 그래프를 구현함.",
    },
    extraKey: "careerAct:plan",
    extraTitle: "2학기에는 진로를 위해 무엇을 더 실천하고 싶나요?",
  },
};

export function ActivityListSection({
  num,
  kind,
  focusId,
  onFocused,
  onOpenPanel,
}: {
  num: number;
  kind: ListKind;
  focusId: string | null;
  onFocused: () => void;
  onOpenPanel: (type: "진로" | "자율") => void;
}) {
  const { store, files, sem } = usePortfolio();
  const copy = LIST_COPY[kind];
  const key = `${kind}:items`;
  const all = getItems(store.data, key);
  const items = all.filter((i) => i.sem === sem);

  const save = (next: ActivityItem[]) => store.set(key, next);
  const patch = (id: string, p: Partial<ActivityItem>) => save(all.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const add = () => save([...all, { id: newId(), sem, name: "", period: "", detail: "", text: "" }]);
  const move = (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    const other = items[idx + dir];
    if (!other) return;
    const a = all.findIndex((i) => i.id === id);
    const b = all.findIndex((i) => i.id === other.id);
    const next = [...all];
    [next[a], next[b]] = [next[b], next[a]];
    save(next);
  };
  const remove = async (it: ActivityItem) => {
    const n = files.byField.get(`item:${it.id}`)?.length ?? 0;
    const label = it.name || "이 활동";
    if (!confirm(`'${label}' 기록을 삭제할까요?${n ? ` 첨부 파일 ${n}개도 함께 삭제됩니다.` : ""}`)) return;
    save(all.filter((i) => i.id !== it.id));
    if (n) await files.removeField(`item:${it.id}`);
  };

  const extra = getMap(store.data, copy.extraKey);

  return (
    <>
      <SectionHead
        num={num}
        title={copy.title}
        desc={copy.desc}
        right={
          <div className="row-gap">
            <button type="button" className="btn btn-ghost" onClick={() => onOpenPanel(kind === "school" ? "자율" : "진로")}>
              <ListIcon />
              {kind === "school" ? "자율 활동 목록" : "진로 활동 목록"}
            </button>
            <button type="button" className="btn btn-primary" onClick={add}>
              <PlusIcon />
              직접 추가
            </button>
          </div>
        }
      />
      <div className="stack">
        {items.length === 0 && (
          <div className="empty">
            <p>{sem}학기 기록이 아직 없습니다.</p>
            <p className="muted">직접 추가하거나 활동 목록에서 가져오세요.</p>
          </div>
        )}
        {items.map((it, idx) => (
          <ActivityCard
            key={it.id}
            item={it}
            index={idx}
            total={items.length}
            copy={copy}
            autoFocus={focusId === it.id}
            onFocused={onFocused}
            onPatch={(p) => patch(it.id, p)}
            onMove={(d) => move(it.id, d)}
            onRemove={() => remove(it)}
          />
        ))}
        {sem === "1" && (
          <Card title={copy.extraTitle} fieldKey={copy.extraKey} done={filled(extra.text)}>
            <AutoTextarea value={extra.text ?? ""} ariaLabel={copy.extraTitle} onChange={(text) => store.set(copy.extraKey, { text })} />
          </Card>
        )}
      </div>
    </>
  );
}

function ActivityCard({
  item,
  index,
  total,
  copy,
  autoFocus,
  onFocused,
  onPatch,
  onMove,
  onRemove,
}: {
  item: ActivityItem;
  index: number;
  total: number;
  copy: (typeof LIST_COPY)[ListKind];
  autoFocus: boolean;
  onFocused: () => void;
  onPatch: (p: Partial<ActivityItem>) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!autoFocus || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const target = ref.current.querySelector<HTMLElement>(item.name ? "textarea" : "input");
    setTimeout(() => target?.focus({ preventScroll: true }), 350);
    onFocused();
  }, [autoFocus, item.name, onFocused]);

  return (
    <div ref={ref}>
      <Card
        fieldKey={`item:${item.id}`}
        done={filled(item.text)}
        title={
          <span className="item-head">
            <span className="item-idx">{index + 1}</span>
            <input
              className="input input-title"
              value={item.name}
              placeholder={copy.ex.name}
              aria-label="활동명"
              onChange={(e) => onPatch({ name: e.target.value })}
            />
          </span>
        }
        aside={
          <div className="row-gap tight">
            <button type="button" className="icon-btn" aria-label="위로" disabled={index === 0} onClick={() => onMove(-1)}>
              <UpIcon />
            </button>
            <button type="button" className="icon-btn" aria-label="아래로" disabled={index === total - 1} onClick={() => onMove(1)}>
              <DownIcon />
            </button>
            <button type="button" className="icon-btn danger" aria-label="삭제" onClick={onRemove}>
              <TrashIcon />
            </button>
          </div>
        }
      >
        <div className="grid-2">
          <Field label="시기">
            <input className="input" value={item.period} placeholder={copy.ex.period} aria-label="시기" onChange={(e) => onPatch({ period: e.target.value })} />
          </Field>
          <Field label={copy.detailLabel}>
            <AutoTextarea value={item.detail} placeholder={copy.ex.detail} ariaLabel={copy.detailLabel} minRows={1} count={false} onChange={(detail) => onPatch({ detail })} />
          </Field>
        </div>
        <Field label={copy.textLabel}>
          <AutoTextarea value={item.text} placeholder={copy.ex.text} ariaLabel={copy.textLabel} minRows={4} onChange={(text) => onPatch({ text })} />
        </Field>
      </Card>
    </div>
  );
}

// 5. 역량 -----------------------------------------------------------------
export function CompetencySection({ num }: { num: number }) {
  const { store, sem } = usePortfolio();
  return (
    <>
      <SectionHead
        num={num}
        title="학업 역량과 공동체 역량"
        desc="질문에 맞는 경험이 없으면 비워 두어도 괜찮습니다. 다음 학기에는 관련 경험을 만들어 보세요."
      />
      <div className="stack">
        {COMPETENCIES.map((c) => {
          const key = `cmp:${sem}:${c.id}`;
          const m = getMap(store.data, key);
          return (
            <Card
              key={key}
              title={
                <>
                  <span className={`pill pill-${c.group === "학업" ? "a" : "b"}`}>{c.group}</span>
                  {c.title}
                </>
              }
              subtitle={c.question}
              fieldKey={key}
              done={c.fields.every((f) => filled(m[f.id]))}
            >
              {c.fields.map((f) => (
                <Field key={f.id} label={f.label}>
                  <AutoTextarea value={m[f.id] ?? ""} placeholder={f.placeholder} ariaLabel={f.label} minRows={2} onChange={(v) => store.set(key, { ...m, [f.id]: v })} />
                </Field>
              ))}
            </Card>
          );
        })}
      </div>
    </>
  );
}

// 6. 방학 계획 -------------------------------------------------------------
export function VacationSection({ num }: { num: number }) {
  const { store, sem } = usePortfolio();
  const key = sem === "1" ? "vac:summer" : "vac:winter";
  const m = getMap(store.data, key);
  const summer = sem === "1";
  return (
    <>
      <SectionHead
        num={num}
        title={summer ? "알찬 여름방학 실행 계획" : "알찬 겨울방학 실행 계획"}
        desc={summer ? "1학기 배움을 바탕으로 여름방학을 설계하고, 2학기의 도약을 준비합니다." : "2학기 배움을 바탕으로 겨울방학을 설계하고, 2학년의 도약을 준비합니다."}
      />
      <div className="stack">
        {VACATION_AREAS.map((a) => (
          <Card key={a.id} title={a.title} subtitle="구체적인 실천 목표 및 방법" fieldKey={`${key}:${a.id}`} done={filled(m[a.id])}>
            <AutoTextarea value={m[a.id] ?? ""} ariaLabel={`${a.title} 실천 목표 및 방법`} onChange={(v) => store.set(key, { ...m, [a.id]: v })} />
          </Card>
        ))}
      </div>
    </>
  );
}

// 7. Top 5 ----------------------------------------------------------------
export function TopSection({ num }: { num: number }) {
  const { store } = usePortfolio();
  const rows = getTop(store.data);
  const save = (next: typeof rows) => store.set("top5", next);

  const written = [...getItems(store.data, "school:items"), ...getItems(store.data, "careerAct:items")].map((i) => i.name).filter(Boolean);
  const options = Array.from(new Set([...written, ...activities.map((a) => a.name)]));

  return (
    <>
      <SectionHead num={num} title="생활기록부에 꼭 기록하고 싶은 나의 성장" desc="위에 기록한 활동 중 생활기록부에 꼭 남기고 싶은 활동을 골라 순위를 정해 보세요." />
      <Card>
        <datalist id="top-options">
          {options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <ol className="top-list">
          {rows.map((r, i) => (
            <li className="top-row" key={i}>
              <span className="top-rank">Top {i + 1}</span>
              <select className="input top-cat" value={r.cat} aria-label={`Top ${i + 1} 활동 구분`} onChange={(e) => save(rows.map((x, j) => (j === i ? { ...x, cat: e.target.value } : x)))}>
                <option value="">구분</option>
                {TOP_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                className="input top-name"
                list="top-options"
                value={r.name}
                placeholder="활동 이름 (입력하면 위에 쓴 활동이 추천됩니다)"
                aria-label={`Top ${i + 1} 활동 이름`}
                onChange={(e) => save(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <span className="row-gap tight">
                <button type="button" className="icon-btn" aria-label="위로" disabled={i === 0} onClick={() => save(swap(rows, i, i - 1))}>
                  <UpIcon />
                </button>
                <button type="button" className="icon-btn" aria-label="아래로" disabled={i === 4} onClick={() => save(swap(rows, i, i + 1))}>
                  <DownIcon />
                </button>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}

function swap<T>(arr: T[], a: number, b: number): T[] {
  const next = [...arr];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
