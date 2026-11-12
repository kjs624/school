"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const email = process.env.OWNER_EMAIL;
  if (!email) return { error: "서버 설정(OWNER_EMAIL)이 비어 있습니다." };
  if (!password) return { error: "비밀번호를 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 429) return { error: "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." };
    return { error: "비밀번호가 맞지 않습니다." };
  }
  redirect("/");
}
