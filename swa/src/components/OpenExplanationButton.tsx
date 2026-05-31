import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import ExplanationSheetContent from "./ExplanationSheetContent";
import Tooltip from "./Tooltip";

/**
 * 解説表示ボタンのコンポーネント
 * @returns 解説表示ボタンのコンポーネント
 */
export default function OpenExplanationButton() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const [open, setOpen] = useState(false);

  // 回答・解説を生成していない場合、または生成中の場合は、解説表示ボタンを非活性とする
  // 回答済みの問題に遷移した場合は、explanationsが存在しなくてもanswerExplanationが存在すれば活性にする
  // (シート表示時に解説を取得する)
  const isDisabledOpenExplanationButton = useMemo<boolean>(
    () => !answerExplanation || answerExplanation.isSubmitting,
    [answerExplanation]
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, open]);

  return (
    <>
      <Tooltip tip="解説表示" position="top">
        <Button
          size="icon"
          disabled={isDisabledOpenExplanationButton}
          onClick={() => setOpen(true)}
        >
          <Info />
        </Button>
      </Tooltip>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
            <button
              type="button"
              className="fixed inset-0 bg-black/80"
              aria-label="閉じる"
              onClick={close}
            />
            <div className="fixed inset-x-0 bottom-0 z-[101] max-h-[80vh] w-full min-h-[20vh] overflow-y-auto rounded-t-2xl border-t border-base-300 bg-base-100 p-4 text-base-content shadow-lg">
              <ExplanationSheetContent />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
