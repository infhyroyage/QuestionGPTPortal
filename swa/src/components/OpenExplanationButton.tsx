import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import { useId, useMemo } from "react";
import ExplanationSheetContent from "./ExplanationSheetContent";
import Tooltip from "./Tooltip";

/**
 * 解説表示ボタンのコンポーネント
 * @returns 解説表示ボタンのコンポーネント
 */
export default function OpenExplanationButton() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const drawerId = useId();

  // 回答・解説を生成していない場合、または生成中の場合は、解説表示ボタンを非活性とする
  // 回答済みの問題に遷移した場合は、explanationsが存在しなくてもanswerExplanationが存在すれば活性にする
  // (シート表示時に解説を取得する)
  const isDisabledOpenExplanationButton = useMemo<boolean>(
    () => !answerExplanation || answerExplanation.isSubmitting,
    [answerExplanation]
  );

  return (
    <div className="drawer drawer-bottom">
      <input id={drawerId} type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        <Tooltip tip="解説表示">
          <label
            htmlFor={drawerId}
            className={`btn btn-square ${isDisabledOpenExplanationButton ? "btn-disabled" : ""}`}
            aria-disabled={isDisabledOpenExplanationButton}
            onClick={(e) => {
              if (isDisabledOpenExplanationButton) {
                e.preventDefault();
              }
            }}
          >
            <Info />
          </label>
        </Tooltip>
      </div>
      <div className="drawer-side z-50">
        <label htmlFor={drawerId} className="drawer-overlay" aria-label="閉じる" />
        <div className="menu bg-base-100 text-base-content min-h-[20vh] max-h-[80vh] w-full p-4 overflow-y-auto rounded-t-2xl">
          <ExplanationSheetContent />
        </div>
      </div>
    </div>
  );
}
