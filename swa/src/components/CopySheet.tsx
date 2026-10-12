import {
  fetchAnswerExplanationAtom,
  fetchQuestionSelectorAtom,
} from "@/lib/atoms";
import {
  buildQuestionAnswerMarkdown,
  buildQuestionMarkdown,
} from "@/lib/markdown";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import CopySheetMarkdown from "./CopySheetMarkdown";

/**
 * コピー用シートのコンポーネント
 * @returns コピー用シートのコンポーネント
 */
export default function CopySheet() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const questionSelector = useAtomValue(fetchQuestionSelectorAtom);

  const questionMarkdown = useMemo<string | null>(
    () =>
      questionSelector
        ? buildQuestionMarkdown(
            questionSelector.subjects,
            questionSelector.choices,
          )
        : null,
    [questionSelector],
  );

  // 回答・回答のポイント・解説がすべて生成済みの場合のみ作成
  const questionAnswerMarkdown = useMemo<string | null>(
    () =>
      questionSelector &&
      answerExplanation &&
      !answerExplanation.isSubmitting &&
      answerExplanation.correctIdxes &&
      answerExplanation.answerKeyPoint &&
      answerExplanation.explanations
        ? buildQuestionAnswerMarkdown(
            questionSelector.subjects,
            questionSelector.choices,
            answerExplanation.correctIdxes,
            answerExplanation.answerKeyPoint,
            answerExplanation.explanations,
          )
        : null,
    [questionSelector, answerExplanation],
  );

  return (
    questionMarkdown !== null && (
      <>
        <CopySheetMarkdown
          title="問題・選択肢コピー用"
          markdown={questionMarkdown}
        />
        {questionAnswerMarkdown !== null && (
          <>
            <div className="divider my-6" />
            <CopySheetMarkdown
              title="問題・選択肢・回答・回答のポイント・解説コピー用"
              markdown={questionAnswerMarkdown}
            />
          </>
        )}
      </>
    )
  );
}
