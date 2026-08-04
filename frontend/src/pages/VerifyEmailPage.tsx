import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../lib/api";

type State = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setMessage("No verification token found in the link."); return; }
    authApi.verifyEmail(token)
      .then(({ data }) => { setState("success"); setMessage(data.message); })
      .catch((err) => {
        if (err?.response?.status === 400) { setState("success"); setMessage("Your email is verified. You can sign in."); }
        else { setState("error"); setMessage(err?.response?.data?.detail ?? "Invalid or already used verification link."); }
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-white dark:bg-[#0D0F13]">
      <div className="text-center max-w-sm">
        {state === "loading" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cobalt-500 border-t-transparent" />
            <p className="text-sm text-ink/50 dark:text-[#9AA3B0]">Verifying your email…</p>
          </>
        )}
        {state === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
              <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-sans text-xl font-bold text-ink dark:text-[#F1F3F6] mb-2">Email verified</h1>
            <p className="text-sm text-ink/50 dark:text-[#9AA3B0] mb-6">{message}</p>
            <Link to="/login" className="btn-primary inline-flex">Sign in</Link>
          </>
        )}
        {state === "error" && (
          <>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-editorred/5 dark:bg-editorred/10">
              <svg className="h-7 w-7 text-editorred" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-sans text-xl font-bold text-ink dark:text-[#F1F3F6] mb-2">Verification failed</h1>
            <p className="text-sm text-ink/50 dark:text-[#9AA3B0] mb-6">{message}</p>
            <div className="flex flex-col gap-3 items-center">
              <Link to="/login" className="btn-primary inline-flex">Back to sign in</Link>
              <Link to="/register" className="text-sm text-cobalt-500 dark:text-cobalt-400 font-medium hover:underline">Create a new account</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
