"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Data } from "./schema";

export type SaveState = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 700;

export function useEntries(supabase: SupabaseClient, userId: string) {
  const [data, setData] = useState<Data>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const latest = useRef<Data>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const chains = useRef(new Map<string, Promise<void>>());
  const inflight = useRef(0);
  const failed = useRef(new Set<string>());

  const load = useCallback(async () => {
    setLoadError(null);
    const { data: rows, error } = await supabase.from("entries").select("key, value");
    if (error) {
      setLoadError("내용을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.");
      return;
    }
    const next: Data = {};
    for (const r of rows ?? []) next[r.key as string] = r.value;
    latest.current = next;
    setData(next);
    setLoaded(true);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const settle = useCallback(() => {
    if (inflight.current === 0 && timers.current.size === 0) {
      if (failed.current.size > 0) setSaveState("error");
      else {
        setSaveState("saved");
        setSavedAt(new Date());
      }
    }
  }, []);

  const writeKeys = useCallback(
    (keys: string[]) => {
      for (const key of keys) {
        const t = timers.current.get(key);
        if (t) clearTimeout(t);
        timers.current.delete(key);
      }
      if (keys.length === 0) return;
      setSaveState("saving");
      // 같은 칸에 대한 저장은 순서대로 처리해서 이전 값이 나중 값을 덮어쓰지 않게 합니다.
      for (const key of keys) {
        const prev = chains.current.get(key) ?? Promise.resolve();
        const job = prev.then(async () => {
          inflight.current++;
          const { error } = await supabase
            .from("entries")
            .upsert(
              { owner_id: userId, key, value: latest.current[key] ?? null, updated_at: new Date().toISOString() },
              { onConflict: "owner_id,key" },
            );
          inflight.current--;
          if (error) failed.current.add(key);
          else failed.current.delete(key);
          settle();
        });
        chains.current.set(key, job);
      }
    },
    [supabase, userId, settle],
  );

  const set = useCallback(
    (key: string, value: unknown) => {
      latest.current = { ...latest.current, [key]: value };
      setData(latest.current);
      const t = timers.current.get(key);
      if (t) clearTimeout(t);
      timers.current.set(
        key,
        setTimeout(() => writeKeys([key]), DEBOUNCE_MS),
      );
      setSaveState("saving");
    },
    [writeKeys],
  );

  /** 여러 칸을 한 번에 바꾸고 바로 저장합니다 (엑셀 불러오기 등). */
  const setMany = useCallback(
    (patch: Data) => {
      latest.current = { ...latest.current, ...patch };
      setData(latest.current);
      writeKeys(Object.keys(patch));
    },
    [writeKeys],
  );

  const flush = useCallback(() => writeKeys([...timers.current.keys()]), [writeKeys]);
  const retry = useCallback(() => writeKeys([...failed.current]), [writeKeys]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timers.current.size > 0 || inflight.current > 0) {
        flush();
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [flush]);

  return useMemo(
    () => ({ data, loaded, loadError, reload: load, saveState, savedAt, set, setMany, retry }),
    [data, loaded, loadError, load, saveState, savedAt, set, setMany, retry],
  );
}

export type EntriesStore = ReturnType<typeof useEntries>;
