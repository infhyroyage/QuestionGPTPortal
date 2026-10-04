import { showToast } from "@/lib/toast";
import { CircleX } from "lucide-react";
import { useCallback } from "react";

/**
 * システムエラー用のトーストのカスタムフック
 * @returns システムエラー用のトーストのカスタムフック
 */
export default function useSystemErrorToast() {
  return useCallback((e: unknown) => {
    console.error(e);

    showToast((close) => (
      <div
        role="alert"
        className="alert alert-error alert-vertical sm:alert-horizontal max-w-[calc(100vw-2rem)] whitespace-normal shadow-lg sm:max-w-md"
      >
        <CircleX className="size-6 shrink-0" />
        <div>
          <h3 className="font-bold">システムエラー</h3>
          <p className="text-sm whitespace-pre-wrap break-all">
            {`以下をシステム管理者にご連絡ください:\n${String(e)}`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost"
          onClick={close}
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    ));
  }, []);
}
