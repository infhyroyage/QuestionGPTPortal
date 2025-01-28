import {
  fetchAnswerExplanationAtom,
  fetchQuestionSelectorAtom,
  fetchTranslationInitAtom,
  toggleSelectedChoiceAtom,
} from "@/lib/atoms";
import { Choice } from "@/types/backend";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function Selector() {
  const [answerExplanation] = useAtom(fetchAnswerExplanationAtom);
  const [questionSelector] = useAtom(fetchQuestionSelectorAtom);
  const [, toggleSelectedChoice] = useAtom(toggleSelectedChoiceAtom);
  const [translationInit] = useAtom(fetchTranslationInitAtom);

  // idx番目の選択肢押下時の処理
  const onClickSelector = useCallback(
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
            <Button
              key={idx}
              variant={
                questionSelector.choices[idx].isSelected ? "default" : "outline"
              }
              className="flex flex-col py-4 pl-4 h-full space-y-1 whitespace-normal text-left"
              disabled={!!answerExplanation}
              onClick={onClickSelector(idx)}
            >
              <p className="leading-7">{choice.sentence}</p>
              {translationInit ? (
                <p className="text-sm text-muted-foreground">
                  {translationInit.choices[idx]}
                </p>
              ) : (
                <Skeleton className="h-5 w-full" />
              )}
            </Button>
          ))
        : Array.from({ length: 4 }).map((_, idx: number) => (
            <Skeleton key={idx} className="h-[86px] w-full rounded-lg" />
          ))}
    </div>
  );
}
