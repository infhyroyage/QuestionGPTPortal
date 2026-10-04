import { showToast } from "@/lib/toast";
import { TriangleAlert } from "lucide-react";
import { useCallback } from "react";

/**
 * 翻訳失敗用のトーストのカスタムフック
 * @returns 翻訳失敗用のトーストのカスタムフック
 */
export default function useTranslationFailedToast() {
  return useCallback((message: string, onClick: () => void) => {
    showToast((close) => (
      <div
        role="alert"
        className="alert alert-warning alert-vertical sm:alert-horizontal max-w-[calc(100vw-2rem)] whitespace-normal shadow-lg sm:max-w-md"
      >
        <TriangleAlert className="size-6 shrink-0" />
        <div>
          <h3 className="font-bold">翻訳失敗</h3>
          <p className="text-sm">{`${message}を翻訳できません`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              close();
              onClick();
            }}
          >
            やり直す
          </button>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={close}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
      </div>
    ));
  }, []);
}
