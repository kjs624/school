"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEntries } from "@/lib/useEntries";
import { useAttachments } from "@/lib/useAttachments";
import { getItems, newId, sectionProgress, sectionsFor, type ActivityItem, type Data, type SectionId, type Sem } from "@/lib/schema";
import ActivityPanel, { type RefActivity } from "./ActivityPanel";
import { ActivityListSection, CareerSection, CompetencySection, KeywordsSection, TopSection, VacationSection } from "./Sections";
import { ListIcon, MenuIcon, PortfolioContext, XIcon } from "./ui";

type Tab = "전체" | "진로" | "자율";

function readSem(): Sem {
  try {
    return localStorage.getItem("gp.sem") === "2" ? "2" : "1";
  } catch {
    return "1";
  }
}

export default function Portfolio({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const store = useEntries(supabase, userId);
  const files = useAttachments(supabase, userId);

  const [sem, setSemState] = useState<Sem>("1");
  useEffect(() => setSemState(readSem()), []);
  const setSem = (s: Sem) => {
    setSemState(s);
    try {
      localStorage.setItem("gp.sem", s);
    } catch {}
    window.scrollTo({ top: 0 });
  };

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<Tab>("전체");
  const [focusId, setFocusId] = useState<string | null>(null);
  const clearFocus = useCallback(() => setFocusId(null), []);
  const [active, setActive] = useState<SectionId>("keywords");
  const [menuOpen, setMenuOpen] = useState(false);
  const [keepalive, setKeepalive] = useState<string | null | undefined>(undefined);

  const sections = sectionsFor(sem);
  const progress = sections.map((s) => ({ ...s, p: sectionProgress(store.data, sem, s.id) }));
  const totalDone = progress.reduce((n, s) => n + s.p.done, 0);
  const totalAll = progress.reduce((n, s) => n + s.p.total, 0);
  const pct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;

  useEffect(() => {
    supabase
      .from("keepalive")
      .select("pinged_at")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setKeepalive((data?.pinged_at as string | undefined) ?? null));
  }, [supabase]);

  // 지금 보고 있는 섹션을 목차에 표시
  useEffect(() => {
    if (!store.loaded) return;
    const els = sections.map((s) => document.getElementById(`sec-${s.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id.replace("sec-", "") as SectionId);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.loaded, sem]);

  const goto = (id: SectionId) => {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openPanel = (t: Tab) => {
    setPanelTab(t);
    setPanelOpen(true);
  };

  const addFromRef = (a: RefActivity) => {
    const key = a.type === "진로" ? "careerAct:items" : "school:items";
    const item: ActivityItem = { id: newId(), sem, name: a.name, period: a.period.replace(/\s*\n\s*/g, " "), detail: "", text: "" };
    store.set(key, [...getItems(store.data, key), item]);
    setFocusId(item.id);
    if (window.matchMedia("(max-width: 1199px)").matches) setPanelOpen(false);
  };

  // 엑셀 불러오기 -----------------------------------------------------------
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState<{ status: "loading" } | { status: "ready"; data: Data } | { status: "error"; message: string } | null>(null);

  const onImportFile = async (file: File) => {
    setImporting({ status: "loading" });
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) setImporting({ status: "error", message: json.error ?? "불러오지 못했습니다." });
      else setImporting({ status: "ready", data: json.data as Data });
    } catch {
      setImporting({ status: "error", message: "불러오지 못했습니다. 인터넷 연결을 확인해 주세요." });
    }
  };

  const applyImport = (incoming: Data) => {
    const patch: Data = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (key.endsWith(":items")) {
        const cur = getItems(store.data, key);
        const names = new Set(cur.map((i) => `${i.sem}|${i.name.replace(/\s/g, "")}`));
        const fresh = (value as ActivityItem[]).filter((i) => !names.has(`${i.sem}|${i.name.replace(/\s/g, "")}`));
        if (fresh.length) patch[key] = [...cur, ...fresh];
      } else {
        patch[key] = value;
      }
    }
    store.setMany(patch);
    setImporting(null);
  };

  const ctx = useMemo(() => ({ store, files, sem }), [store, files, sem]);

  const isEmpty = store.loaded && Object.keys(store.data).length === 0;

  return (
    <PortfolioContext.Provider value={ctx}>
      <div className={`app${panelOpen ? " panel-open" : ""}`}>
        <header className="topbar">
          <div className="topbar-l">
            <p className="brand">성장 포트폴리오</p>
            <SaveBadge state={store.saveState} savedAt={store.savedAt} onRetry={store.retry} />
          </div>
          <div className="seg" role="tablist" aria-label="학기 선택">
            {(["1", "2"] as Sem[]).map((s) => (
              <button key={s} type="button" role="tab" aria-selected={sem === s} className={sem === s ? "on" : ""} onClick={() => setSem(s)}>
                {s}학기
              </button>
            ))}
          </div>
          <div className="topbar-r">
            <button type="button" className={`btn btn-ghost${panelOpen ? " is-on" : ""}`} onClick={() => setPanelOpen((o) => !o)} aria-pressed={panelOpen}>
              <ListIcon />
              <span className="hide-sm">활동 목록</span>
            </button>
            <div className="menu-wrap">
              <button type="button" className="icon-btn" aria-label="메뉴" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
                <MenuIcon />
              </button>
              {menuOpen && (
                <>
                  <div className="menu-scrim" onClick={() => setMenuOpen(false)} />
                  <div className="menu" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        fileRef.current?.click();
                      }}
                    >
                      엑셀에서 불러오기
                    </button>
                    <form action="/auth/signout" method="post">
                      <button type="submit" role="menuitem">
                        로그아웃
                      </button>
                    </form>
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </header>

        <nav className="toc-mobile" aria-label="섹션 바로가기">
          {progress.map((s) => (
            <button key={s.id} type="button" className={active === s.id ? "on" : ""} onClick={() => goto(s.id)}>
              {s.short}
              <span className="toc-badge">{s.p.label}</span>
            </button>
          ))}
        </nav>

        <div className="layout">
          <aside className="sidebar" aria-label="목차">
            <div className="prog">
              <div className="prog-top">
                <span>{sem}학기 작성률</span>
                <strong>{pct}%</strong>
              </div>
              <div className="prog-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>
            <ol className="toc">
              {progress.map((s, i) => (
                <li key={s.id}>
                  <button type="button" className={`toc-item${active === s.id ? " on" : ""}${s.p.done >= s.p.total ? " done" : ""}`} onClick={() => goto(s.id)}>
                    <span className="toc-num">{i + 1}</span>
                    <span className="toc-name">{s.short}</span>
                    <span className="toc-badge">{s.p.label}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="side-foot">
              <p>첨부 파일 {files.count}개</p>
              <p title="Supabase 무료 플랜은 7일 동안 활동이 없으면 일시 정지됩니다. 매일 자동으로 기록을 남겨 이를 막습니다.">
                서버 유지 기록{" "}
                {keepalive === undefined ? "확인 중" : keepalive === null ? "아직 없음" : new Date(keepalive).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </aside>

          <main className="main">
            {!store.loaded && !store.loadError && <div className="loading">불러오는 중</div>}
            {store.loadError && (
              <div className="empty">
                <p>{store.loadError}</p>
                <button type="button" className="btn btn-primary" onClick={store.reload}>
                  다시 시도
                </button>
              </div>
            )}
            {store.loaded && (
              <>
                <div className="intro">
                  <h1>나의 성장과 배움을 기록하다</h1>
                  <p>
                    이번 학기 동안 참여한 다양한 활동을 돌아보며, 내가 어떻게 배우고 성장했는지 생각해 봅시다. 구체적인 경험을 중심으로 작성하면 담임선생님과의 상담 및 생활기록부 작성에 도움이 됩니다.
                  </p>
                  <p className="intro-note">쓰는 즉시 자동 저장됩니다. 글자 수 옆의 바이트는 나이스 기준(한글 3, 영문·숫자·공백 1, 줄바꿈 2)입니다.</p>
                </div>
                {isEmpty && (
                  <div className="banner">
                    <div>
                      <p className="banner-title">기존 엑셀에 쓴 내용이 있나요?</p>
                      <p className="muted">원본 양식 엑셀 파일을 올리면 쓴 내용을 그대로 옮겨 옵니다.</p>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>
                      엑셀에서 불러오기
                    </button>
                  </div>
                )}
                {sections.map((s, i) => (
                  <section key={`${sem}-${s.id}`} id={`sec-${s.id}`} className="sec">
                    {s.id === "keywords" && <KeywordsSection num={i + 1} />}
                    {s.id === "career" && <CareerSection num={i + 1} />}
                    {(s.id === "school" || s.id === "careerAct") && (
                      <ActivityListSection num={i + 1} kind={s.id} focusId={focusId} onFocused={clearFocus} onOpenPanel={openPanel} />
                    )}
                    {s.id === "competency" && <CompetencySection num={i + 1} />}
                    {s.id === "vacation" && <VacationSection num={i + 1} />}
                    {s.id === "top5" && <TopSection num={i + 1} />}
                  </section>
                ))}
                <p className="end-note">{sem === "1" ? "2학기 내용은 위쪽의 2학기 버튼을 눌러 작성하세요." : "1학기 내용은 위쪽의 1학기 버튼에서 볼 수 있습니다."}</p>
              </>
            )}
          </main>

          {panelOpen && (
            <>
              <div className="panel-scrim" onClick={() => setPanelOpen(false)} />
              <ActivityPanel tab={panelTab} onTab={setPanelTab} onClose={() => setPanelOpen(false)} onAdd={addFromRef} />
            </>
          )}
        </div>

        {importing && <ImportDialog state={importing} onCancel={() => setImporting(null)} onApply={applyImport} />}
      </div>
    </PortfolioContext.Provider>
  );
}

function SaveBadge({ state, savedAt, onRetry }: { state: string; savedAt: Date | null; onRetry: () => void }) {
  if (state === "saving") return <span className="save is-saving">저장 중</span>;
  if (state === "error")
    return (
      <button type="button" className="save is-error" onClick={onRetry}>
        저장 실패, 다시 시도
      </button>
    );
  if (state === "saved" && savedAt)
    return <span className="save is-saved">저장됨 {savedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>;
  return <span className="save">자동 저장</span>;
}

function ImportDialog({
  state,
  onCancel,
  onApply,
}: {
  state: { status: "loading" } | { status: "ready"; data: Data } | { status: "error"; message: string };
  onCancel: () => void;
  onApply: (d: Data) => void;
}) {
  const summary =
    state.status === "ready"
      ? (() => {
          const d = state.data;
          const kw = Object.keys(d).filter((k) => k.startsWith("kw:")).length;
          const school = getItems(d, "school:items").length;
          const act = getItems(d, "careerAct:items").length;
          const cmp = Object.keys(d).filter((k) => k.startsWith("cmp:")).length;
          return [
            kw && `키워드 ${kw}개 영역`,
            d["career"] && "진로 설계",
            school && `학급 활동 ${school}개`,
            act && `진로활동 ${act}개`,
            cmp && `역량 질문 ${cmp}개`,
            (d["vac:summer"] || d["vac:winter"]) && "방학 계획",
            d["top5"] && "Top 5",
          ].filter(Boolean) as string[];
        })()
      : [];

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="엑셀에서 불러오기" onClick={onCancel}>
      <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <p className="modal-title">엑셀에서 불러오기</p>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onCancel}>
            <XIcon />
          </button>
        </header>
        <div className="modal-pad">
          {state.status === "loading" && <p className="muted">파일을 읽는 중</p>}
          {state.status === "error" && <p className="error-text">{state.message}</p>}
          {state.status === "ready" &&
            (summary.length === 0 ? (
              <p className="muted">불러올 내용을 찾지 못했습니다.</p>
            ) : (
              <>
                <p>아래 내용을 찾았습니다.</p>
                <ul className="import-list">
                  {summary.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p className="muted small">같은 칸에 이미 쓴 내용은 엑셀 내용으로 바뀝니다. 활동 기록은 이름이 겹치지 않는 것만 추가됩니다. 엑셀의 역량 질문은 1학기로 들어갑니다.</p>
              </>
            ))}
        </div>
        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            취소
          </button>
          {state.status === "ready" && summary.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => onApply(state.data)}>
              불러오기
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
