"use client";

import { useEffect, useRef, useState } from "react";
import type { Attachment } from "@/lib/useAttachments";
import { ClipIcon, FileIcon, ImageIcon, XIcon, usePortfolio } from "./ui";

function fmtSize(n: number) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

const isImage = (a: Attachment) => (a.mime ?? "").startsWith("image/");
const isPdf = (a: Attachment) => a.mime === "application/pdf" || a.name.toLowerCase().endsWith(".pdf");

export default function Attachments({ fieldKey }: { fieldKey: string }) {
  const { files } = usePortfolio();
  const list = files.byField.get(fieldKey) ?? [];
  const pending = files.uploads.filter((u) => u.field_key === fieldKey);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);

  const onFiles = (fl: FileList | null) => {
    if (fl && fl.length) files.upload(fieldKey, Array.from(fl));
  };

  return (
    <div
      className={`attach${drag ? " is-drag" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(e.dataTransfer.files);
      }}
    >
      <div className="attach-row">
        {list.map((a) => (
          <span className="chip" key={a.id}>
            <button type="button" className="chip-main" onClick={() => setPreview(a)} title="미리보기">
              {isImage(a) ? <ImageIcon /> : <FileIcon />}
              <span className="chip-name">{a.name}</span>
              <span className="chip-size">{fmtSize(a.size)}</span>
            </button>
            <button
              type="button"
              className="chip-x"
              aria-label={`${a.name} 삭제`}
              onClick={async () => {
                if (confirm(`'${a.name}' 파일을 삭제할까요? 되돌릴 수 없습니다.`)) await files.remove(a);
              }}
            >
              <XIcon />
            </button>
          </span>
        ))}
        {pending.map((u) => (
          <span className={`chip${u.error ? " is-error" : " is-pending"}`} key={u.tempId}>
            <span className="chip-main">
              <FileIcon />
              <span className="chip-name">{u.name}</span>
              <span className="chip-size">{u.error ?? "올리는 중"}</span>
            </span>
            {u.error && (
              <button type="button" className="chip-x" aria-label="닫기" onClick={() => files.dismissUpload(u.tempId)}>
                <XIcon />
              </button>
            )}
          </span>
        ))}
        <button type="button" className="attach-add" onClick={() => inputRef.current?.click()}>
          <ClipIcon />
          {list.length ? "파일 추가" : "관련 파일 첨부"}
        </button>
        <span className="attach-hint">끌어다 놓아도 됩니다</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {preview && <Preview a={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function Preview({ a, onClose }: { a: Attachment; onClose: () => void }) {
  const { files } = usePortfolio();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    files.signedUrl(a).then((u) => {
      if (!alive) return;
      if (u) setUrl(u);
      else setFailed(true);
    });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [a, files, onClose]);

  const download = async () => {
    const u = await files.signedUrl(a, true);
    if (u) window.location.href = u;
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={a.name} onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <p className="modal-title">{a.name}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={download}>
              내려받기
            </button>
            <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
              <XIcon />
            </button>
          </div>
        </header>
        <div className="modal-body">
          {failed && <p className="muted">파일을 열 수 없습니다.</p>}
          {!url && !failed && <p className="muted">불러오는 중</p>}
          {url && isImage(a) && <img src={url} alt={a.name} className="preview-img" />}
          {url && isPdf(a) && <iframe src={url} title={a.name} className="preview-pdf" />}
          {url && !isImage(a) && !isPdf(a) && (
            <div className="preview-none">
              <FileIcon />
              <p>이 형식은 미리보기를 지원하지 않습니다.</p>
              <button type="button" className="btn btn-primary" onClick={download}>
                내려받기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
