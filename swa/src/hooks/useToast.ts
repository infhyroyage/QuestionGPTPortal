import { TOAST_LIMIT, Toast, toastsAtom } from "@/lib/toast";
import { useSetAtom } from "jotai";
import { useCallback } from "react";

let toastCount = 0;

/**
 * トーストを表示するためのカスタムフック
 * @returns トーストを追加する関数
 */
export default function useToast() {
  const setToasts = useSetAtom(toastsAtom);

  return useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${(toastCount += 1)}`;
      setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, TOAST_LIMIT));
      return id;
    },
    [setToasts]
  );
}
