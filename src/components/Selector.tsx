import {
  fetchAnswerExplanationAtom,
  fetchQuestionSelectorAtom,
  fetchTranslationSubjectChoiceAtom,
  toggleSelectedChoiceAtom,
} from "@/lib/atoms";
import { Choice } from "@/types/backend";
import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";
import SelectorButton from "./SelectorButton";
import { Skeleton } from "./ui/skeleton";

export default function Selector() {
  const [answerExplanation] = useAtom(fetchAnswerExplanationAtom);
  const [questionSelector] = useAtom(fetchQuestionSelectorAtom);
  const [, toggleSelectedChoice] = useAtom(toggleSelectedChoiceAtom);
  const [translationSubjectChoice] = useAtom(fetchTranslationSubjectChoiceAtom);

  // 回答・解説が生成中の場合は、選択肢をすべて非活性とする
  const isDisabledSelectorButtons = useMemo<boolean>(
    () => !!answerExplanation && answerExplanation.isSubmitting,
    [answerExplanation]
  );

  // idx番目の選択肢押下時の処理
  const onClickSelectButton = useCallback(
    (idx: number) => () => {
      // 回答・解説の生成開始後は選択状態を切り替えない
      if (answerExplanation) return;

      // idx番目の選択肢の選択状態を切り替え
      toggleSelectedChoice(idx);
    },
    [answerExplanation, toggleSelectedChoice]
  );

  return (
    <div className="space-y-4 m-4">
      {questionSelector
        ? questionSelector.choices.map((choice: Choice, idx: number) => (
            <SelectorButton
              key={idx}
              className={
                (answerExplanation &&
                  answerExplanation.correctFlags &&
                  answerExplanation.correctFlags[idx] &&
                  answerExplanation.isCorrect &&
                  questionSelector.choices[idx].isSelected) ||
                (answerExplanation &&
                  answerExplanation.correctFlags &&
                  answerExplanation.correctFlags[idx] &&
                  !answerExplanation.isCorrect)
                  ? "border-green-500 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900"
                  : answerExplanation &&
                    answerExplanation.correctFlags &&
                    !answerExplanation.correctFlags[idx] &&
                    questionSelector.choices[idx].isSelected
                  ? "border-red-500 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900"
                  : ""
              }
              disabled={isDisabledSelectorButtons}
              img={choice.img}
              onClick={onClickSelectButton(idx)}
              sentence={choice.sentence}
              translation={
                translationSubjectChoice &&
                translationSubjectChoice.choices[idx]
              }
              variant={
                questionSelector.choices[idx].isSelected &&
                (!answerExplanation || answerExplanation.isSubmitting)
                  ? "default"
                  : "outline"
              }
            />
          ))
        : Array.from({ length: 4 }).map((_, idx: number) => (
            <Skeleton key={idx} className="h-[86px] w-full rounded-lg" />
          ))}
    </div>
  );
}
