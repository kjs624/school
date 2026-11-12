"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Attachment = {
  id: string;
  field_key: string;
  name: string;
  path: string;
  size: number;
  mime: string | null;
  created_at: string;
};

export type Upload = { tempId: string; field_key: string; name: string; error?: string };

const BUCKET = "attachments";
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

function extOf(name: string): string {
  const m = /\.([A-Za-z0-9]{1,10})$/.exec(name);
  return m ? `.${m[1].toLowerCase()}` : "";
}

export function useAttachments(supabase: SupabaseClient, userId: string) {
  const [list, setList] = useState<Attachment[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);

  useEffect(() => {
    supabase
      .from("attachments")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => setList((data as Attachment[]) ?? []));
  }, [supabase]);

  const byField = useMemo(() => {
    const m = new Map<string, Attachment[]>();
    for (const a of list) {
      const arr = m.get(a.field_key) ?? [];
      arr.push(a);
      m.set(a.field_key, arr);
    }
    return m;
  }, [list]);

  const upload = useCallback(
    async (fieldKey: string, files: File[]) => {
      for (const file of files) {
        const tempId = crypto.randomUUID();
        if (file.size > MAX_FILE_BYTES) {
          setUploads((u) => [...u, { tempId, field_key: fieldKey, name: file.name, error: "50MB를 넘는 파일은 올릴 수 없습니다." }]);
          continue;
        }
        setUploads((u) => [...u, { tempId, field_key: fieldKey, name: file.name }]);
        // 저장소 경로에는 한글을 쓸 수 없어서 무작위 이름을 쓰고, 원래 이름은 목록 테이블에 저장합니다.
        const path = `${userId}/${crypto.randomUUID()}${extOf(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (upErr) {
          setUploads((u) => u.map((x) => (x.tempId === tempId ? { ...x, error: "업로드에 실패했습니다." } : x)));
          continue;
        }
        const { data, error } = await supabase
          .from("attachments")
          .insert({ owner_id: userId, field_key: fieldKey, name: file.name, path, size: file.size, mime: file.type || null })
          .select()
          .single();
        if (error || !data) {
          await supabase.storage.from(BUCKET).remove([path]);
          setUploads((u) => u.map((x) => (x.tempId === tempId ? { ...x, error: "업로드에 실패했습니다." } : x)));
          continue;
        }
        setList((l) => [...l, data as Attachment]);
        setUploads((u) => u.filter((x) => x.tempId !== tempId));
      }
    },
    [supabase, userId],
  );

  const dismissUpload = useCallback((tempId: string) => {
    setUploads((u) => u.filter((x) => x.tempId !== tempId));
  }, []);

  const remove = useCallback(
    async (a: Attachment) => {
      const { error } = await supabase.storage.from(BUCKET).remove([a.path]);
      if (error) return false;
      await supabase.from("attachments").delete().eq("id", a.id);
      setList((l) => l.filter((x) => x.id !== a.id));
      return true;
    },
    [supabase],
  );

  const removeField = useCallback(
    async (fieldKey: string) => {
      const targets = list.filter((a) => a.field_key === fieldKey);
      for (const a of targets) await remove(a);
    },
    [list, remove],
  );

  const signedUrl = useCallback(
    async (a: Attachment, download = false) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(a.path, 60 * 60, download ? { download: a.name } : undefined);
      return data?.signedUrl ?? null;
    },
    [supabase],
  );

  return useMemo(
    () => ({ byField, uploads, upload, dismissUpload, remove, removeField, signedUrl, count: list.length }),
    [byField, uploads, upload, dismissUpload, remove, removeField, signedUrl, list.length],
  );
}

export type AttachmentStore = ReturnType<typeof useAttachments>;
