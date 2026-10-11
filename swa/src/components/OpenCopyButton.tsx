import useSheetDialog from "@/hooks/useSheetDialog";
import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { Copy } from "lucide-react";
import CopySheet from "./CopySheet";

/**
 * コピー表示ボタンのコンポーネント
 * @returns コピー表示ボタンのコンポーネント
 */
export default function OpenCopyButton() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);

  const { onClick, SheetDialog } = useSheetDialog({
    children: <CopySheet />,
  });

  // 回答・解説が生成中の場合のみ、ボタンを非活性
  return (
    <>
      <div
        className="tooltip z-50 before:z-50 after:z-50 tooltip-top"
        data-tip="コピー表示"
      >
        <button
          type="button"
          className="btn btn-primary btn-square"
          disabled={answerExplanation && answerExplanation.isSubmitting}
          onClick={onClick}
        >
          <Copy />
        </button>
      </div>
      {SheetDialog}
    </>
  );
}
