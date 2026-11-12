"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { EntriesStore } from "@/lib/useEntries";
import type { AttachmentStore } from "@/lib/useAttachments";
import { neisBytes, type Sem } from "@/lib/schema";
import Attachments from "./Attachments";

type Ctx = { store: EntriesStore; files: AttachmentStore; sem: Sem };
export const PortfolioContext = createContext<Ctx | null>(null);
export function usePortfolio() {
  const c = useContext(PortfolioContext);
  if (!c) throw new Error("PortfolioContext missing");
  return c;
}

export function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 3,
  count = true,
  id,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  count?: boolean;
  id?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + 2}px`;
    };
    fit();
    // 화면 폭이 바뀌면 줄바꿈이 달라지므로 높이를 다시 맞춥니다.
    let w = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== w) {
        w = el.clientWidth;
        fit();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);
  const chars = [...value].length;
  return (
    <div className="ta-wrap">
      <textarea
        ref={ref}
        id={id}
        aria-label={ariaLabel}
        className={`textarea${count ? "" : " no-count"}`}
        rows={minRows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {count && (
        <div className="ta-count" aria-live="off">
          {chars.toLocaleString()}자 <span className="dot">·</span> {neisBytes(value).toLocaleString()}바이트
        </div>
      )}
    </div>
  );
}

export function TagInput({
  tags,
  onChange,
  placeholder = "키워드 입력 후 Enter",
  ariaLabel,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const commit = (raw: string) => {
    const parts = raw
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !tags.includes(s));
    if (parts.length) onChange([...tags, ...parts]);
    setDraft("");
  };
  return (
    <div className="tags" onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
      {tags.map((t) => (
        <span className="tag" key={t}>
          {t}
          <button
            type="button"
            className="tag-x"
            aria-label={`${t} 삭제`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(tags.filter((x) => x !== t));
            }}
          >
            <XIcon />
          </button>
        </span>
      ))}
      <input
        className="tag-input"
        value={draft}
        aria-label={ariaLabel}
        placeholder={tags.length ? "" : placeholder}
        onChange={(e) => {
          const v = e.target.value;
          if (/[,，、]$/.test(v)) commit(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => draft && commit(draft)}
      />
    </div>
  );
}

export function Card({
  title,
  subtitle,
  aside,
  fieldKey,
  done,
  children,
  id,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  fieldKey?: string;
  done?: boolean;
  children: ReactNode;
  id?: string;
}) {
  return (
    <article className={`card${done ? " is-done" : ""}`} id={id}>
      {(title || aside) && (
        <header className="card-head">
          <div className="card-titles">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {aside && <div className="card-aside">{aside}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
      {fieldKey && <Attachments fieldKey={fieldKey} />}
    </article>
  );
}

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {hint && <p className="field-hint">{hint}</p>}
      {children}
    </div>
  );
}

export function SectionHead({ num, title, desc, right }: { num: number; title: string; desc?: ReactNode; right?: ReactNode }) {
  return (
    <div className="sec-head">
      <div>
        <p className="sec-num">{String(num).padStart(2, "0")}</p>
        <h2 className="sec-title">{title}</h2>
        {desc && <p className="sec-desc">{desc}</p>}
      </div>
      {right && <div className="sec-right">{right}</div>}
    </div>
  );
}

// 아이콘 (선 아이콘, 이모티콘 대신 사용)
const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
export const XIcon = () => (
  <svg {...iconProps} width={12} height={12}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const ClipIcon = () => (
  <svg {...iconProps}>
    <path d="M21 11.5l-8.6 8.6a5 5 0 01-7.1-7.1l8.6-8.6a3.3 3.3 0 014.7 4.7l-8.6 8.6a1.7 1.7 0 01-2.4-2.4l7.9-7.9" />
  </svg>
);
export const PlusIcon = () => (
  <svg {...iconProps}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const ListIcon = () => (
  <svg {...iconProps}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
export const TrashIcon = () => (
  <svg {...iconProps}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);
export const UpIcon = () => (
  <svg {...iconProps}>
    <path d="M6 15l6-6 6 6" />
  </svg>
);
export const DownIcon = () => (
  <svg {...iconProps}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const FileIcon = () => (
  <svg {...iconProps}>
    <path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z" />
    <path d="M14 3v5h5" />
  </svg>
);
export const ImageIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M21 16l-5-5-9 9" />
  </svg>
);
export const MenuIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);
export const SearchIcon = () => (
  <svg {...iconProps}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
export const CheckIcon = () => (
  <svg {...iconProps} width={14} height={14}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);
