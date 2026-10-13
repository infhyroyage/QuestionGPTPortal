import {
  fetchAnswerExplanationAtom,
  fetchQuestionSelectorAtom,
} from "@/lib/atoms";
import {
  buildQuestionAnswerMarkdown,
  buildQuestionMarkdown,
} from "@/lib/markdown";
import { useAtomValue } from "jotai";
import CopySheetMarkdown from "./CopySheetMarkdown";

/**
 * コピー用シートのコンポーネント
 * @returns コピー用シートのコンポーネント
 */
export default function CopySheet() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const questionSelector = useAtomValue(fetchQuestionSelectorAtom);

  // 回答、回答のポイント、解説がすべて生成済みの場合のみ、
  // 問題・選択肢・回答・回答のポイント・解説コピー用を表示
  return (
    questionSelector && (
      <>
        <CopySheetMarkdown
          markdown={buildQuestionMarkdown(
            questionSelector.subjects,
            questionSelector.choices,
          )}
          title="問題・選択肢コピー用"
        />
        {answerExplanation &&
          answerExplanation.correctIdxes &&
          answerExplanation.answerKeyPoint &&
          answerExplanation.explanations && (
            <>
              <div className="divider my-6" />
              <CopySheetMarkdown
                markdown={buildQuestionAnswerMarkdown(
                  questionSelector.subjects,
                  questionSelector.choices,
                  answerExplanation.correctIdxes,
                  answerExplanation.answerKeyPoint,
                  answerExplanation.explanations,
                )}
                title="問題・選択肢・回答・回答のポイント・解説コピー用"
              />
            </>
          )}
      </>
    )
  );
}
