"use client";

import { useMemo, useState } from "react";
import activities from "@/lib/activities.json";
import { getItems } from "@/lib/schema";
import { CheckIcon, PlusIcon, SearchIcon, XIcon, usePortfolio } from "./ui";

export type RefActivity = (typeof activities)[number];
type Tab = "전체" | "진로" | "자율";

export default function ActivityPanel({
  tab,
  onTab,
  onClose,
  onAdd,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onClose: () => void;
  onAdd: (a: RefActivity) => void;
}) {
  const { store, sem } = usePortfolio();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const added = useMemo(() => {
    const names = [...getItems(store.data, "school:items"), ...getItems(store.data, "careerAct:items")]
      .filter((i) => i.sem === sem)
      .map((i) => i.name.replace(/\s/g, ""));
    return (name: string) => {
      const n = name.replace(/\s/g, "");
      return names.some((x) => x.includes(n) || (x.length > 3 && n.includes(x)));
    };
  }, [store.data, sem]);

  const list = activities.filter((a) => {
    if (tab !== "전체" && a.type !== tab) return false;
    if (!q.trim()) return true;
    const hay = `${a.name} ${a.subject} ${a.teacher} ${a.desc}`.toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  });

  return (
    <aside className="panel" aria-label="활동 목록">
      <header className="panel-head">
        <div>
          <p className="panel-title">학교 활동 목록</p>
          <p className="panel-sub">추가하면 {sem}학기 기록에 들어갑니다</p>
        </div>
        <button type="button" className="icon-btn" aria-label="활동 목록 닫기" onClick={onClose}>
          <XIcon />
        </button>
      </header>
      <div className="panel-tools">
        <label className="search">
          <SearchIcon />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="활동명, 교과, 선생님 검색" aria-label="활동 검색" />
        </label>
        <div className="seg seg-sm seg-fill" role="tablist">
          {(["전체", "진로", "자율"] as Tab[]).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => onTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <ul className="panel-list">
        {list.length === 0 && <li className="muted panel-empty">검색 결과가 없습니다.</li>}
        {list.map((a) => {
          const isAdded = added(a.name);
          const expanded = open === a.id;
          return (
            <li key={a.id} className="ref">
              <div className="ref-top">
                <span className={`pill pill-${a.type === "진로" ? "a" : "b"}`}>{a.type}</span>
                <p className="ref-name">{a.name}</p>
              </div>
              <p className="ref-meta">{[a.subject, a.teacher, a.period.replace(/\s*\n\s*/g, " ")].filter(Boolean).join("  ·  ")}</p>
              {a.desc && (
                <>
                  <p className={`ref-desc${expanded ? " open" : ""}`}>{a.desc}</p>
                  <button type="button" className="link-btn" onClick={() => setOpen(expanded ? null : a.id)}>
                    {expanded ? "접기" : "자세히"}
                  </button>
                </>
              )}
              <div className="ref-actions">
                {isAdded ? (
                  <span className="ref-added">
                    <CheckIcon />
                    기록함
                  </span>
                ) : null}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAdd(a)}>
                  <PlusIcon />
                  {a.type === "진로" ? "진로활동에 추가" : "학급 활동에 추가"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
