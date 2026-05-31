import { useToast } from "@/hooks/use-toast";

/**
 * daisyUI の toast / alert で通知を表示する
 */
export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="toast toast-top toast-end z-100">
      {toasts
        .filter((toast) => toast.open !== false)
        .map((toast) => (
          <div
            key={toast.id}
            className={[
              "alert shadow-lg max-w-md",
              toast.variant === "destructive" ? "alert-error" : "alert-info",
            ].join(" ")}
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
