import { Toast, toastsAtom } from "@/lib/toast";
import clsx from "clsx";
import { useAtom } from "jotai";

/**
 * daisyUI の toast / alert で通知を表示する
 * @returns トースト表示のコンポーネント
 */
export function Toaster() {
  const [toasts, setToasts] = useAtom(toastsAtom);

  // 指定したトーストを一覧から取り除く
  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

  return (
    <div className="toast toast-top toast-end z-100">
      {toasts.map((toast: Toast) => (
        <div
          key={toast.id}
          className={clsx(
            "alert shadow-lg max-w-md",
            toast.variant === "error" ? "alert-error" : "alert-info"
          )}
        >
          <div className="flex flex-col gap-1">
            {toast.title && <div className="font-bold">{toast.title}</div>}
            {toast.description && (
              <div className="text-sm">{toast.description}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {toast.action}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => dismiss(toast.id)}
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
