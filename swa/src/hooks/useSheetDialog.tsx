import { SheetDialogProps } from "@/types/props";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * シートを表示するダイアログのカスタムフック
 * @returns シートを表示するダイアログのカスタムフック
 */
export default function useSheetDialog({ children }: SheetDialogProps) {
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // 押下時にシートを表示する関数
  const handleClick = useCallback(() => {
    setIsMounted(true);
    setIsOpened(true);
  }, []);

  // 閉じるアニメーション開始
  const handleClose = useCallback(() => setIsOpened(false), []);

  // 閉じるアニメーション終了後にアンマウント
  const handleAnimationEnd = useCallback(() => {
    if (!isOpened) {
      setIsMounted(false);
    }
  }, [isOpened]);

  // エスケープキー押下時にシートを閉じる
  useEffect(() => {
    // シートがマウントされていない場合はキーボードイベントを監視しない
    if (!isMounted) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleClose, isMounted]);

  return {
    onClick: handleClick,
    SheetDialog:
      isMounted &&
      createPortal(
        <div className="fixed inset-0 z-100" role="dialog" aria-modal="true">
          <button
            type="button"
            className={`fixed inset-0 bg-black/80 ${
              isOpened
                ? "animate-sheet-overlay-in"
                : "animate-sheet-overlay-out"
            }`}
            aria-label="閉じる"
            onClick={handleClose}
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-101 max-h-[80vh] w-full min-h-[20vh] overflow-y-auto rounded-t-2xl border-t border-base-300 bg-base-100 p-4 text-base-content shadow-lg ${
              isOpened ? "animate-sheet-in" : "animate-sheet-out"
            }`}
            onAnimationEnd={handleAnimationEnd}
          >
            {children}
          </div>
        </div>,
        document.body,
      ),
  };
}
