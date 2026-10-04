import { Fragment, ReactNode } from "react";
import { Root, createRoot } from "react-dom/client";

/**
 * 同時に表示するトーストの最大数
 */
const TOAST_LIMIT = 3;

/**
 * 表示中のトースト1件
 */
type ToastEntry = {
  id: number;
  render: (close: () => void) => ReactNode;
};

let toasts: ToastEntry[] = [];
let toastCount = 0;
let toastRoot: Root | null = null;

/**
 * 表示中のトースト一覧を、アプリケーションとは独立したルートに描画する
 */
function renderToasts() {
  if (!toastRoot) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    toastRoot = createRoot(container);
  }

  // 固定ヘッダー(TopBar)と重ならないよう、ヘッダーの下に表示する
  toastRoot.render(
    toasts.length > 0 && (
      <div className="toast toast-top toast-end z-1000 mt-16">
        {toasts.map(({ id, render }) => (
          <Fragment key={id}>{render(() => closeToast(id))}</Fragment>
        ))}
      </div>
    ),
  );
}

/**
 * 指定したトーストを閉じる
 * @param id トーストのID
 */
function closeToast(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id);
  renderToasts();
}

/**
 * daisyUI の toast 内にトーストを表示する
 * @param render トーストを閉じる関数を受け取り、表示する alert を返す関数
 */
export function showToast(render: (close: () => void) => ReactNode) {
  toastCount += 1;
  toasts = [{ id: toastCount, render }, ...toasts].slice(0, TOAST_LIMIT);
  renderToasts();
}
