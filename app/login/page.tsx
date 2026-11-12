"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <main className="login">
      <form className="login-card" action={action}>
        <p className="login-eyebrow">성장 포트폴리오</p>
        <h1>나의 성장과 배움을 기록하다</h1>
        <label className="field-label" htmlFor="password">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete="current-password"
          autoFocus
          required
        />
        {state.error && <p className="login-error" role="alert">{state.error}</p>}
        <button className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "확인 중" : "들어가기"}
        </button>
      </form>
    </main>
  );
}
