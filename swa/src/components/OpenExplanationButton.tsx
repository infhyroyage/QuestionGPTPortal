import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { Info } from "lucide-react";
import useSheetDialog from "../hooks/useSheetDialog";
import ExplanationSheet from "./ExplanationSheet";

/**
 * 解説表示ボタンのコンポーネント
 * @returns 解説表示ボタンのコンポーネント
 */
export default function OpenExplanationButton() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);

  const { onClick, SheetDialog } = useSheetDialog({
    children: <ExplanationSheet />,
  });

  // 回答・解説を生成していない場合、または生成中の場合は、ボタンを非活性
  return (
    <>
      <div
        className="tooltip z-50 before:z-50 after:z-50 tooltip-top"
        data-tip="解説表示"
      >
        <button
          type="button"
          className="btn btn-primary btn-square"
          disabled={!answerExplanation || answerExplanation.isSubmitting}
          onClick={onClick}
        >
          <Info />
        </button>
      </div>
      {SheetDialog}
    </>
  );
}
