import {
  fetchAnswerExplanationAtom,
  fetchQuestionSelectorAtom,
  fetchTranslationSubjectChoiceAtom,
  toggleSelectedChoiceAtom,
} from "@/lib/atoms";
import { Choice } from "@/types/backend";
import { useAtom } from "jotai";
import { ZoomIn } from "lucide-react";
import { useCallback, useMemo } from "react";
import ImageDialogContent from "./ImageDialogContent";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";

export default function Selector() {
  const [answerExplanation] = useAtom(fetchAnswerExplanationAtom);
  const [questionSelector] = useAtom(fetchQuestionSelectorAtom);
  const [, toggleSelectedChoice] = useAtom(toggleSelectedChoiceAtom);
  const [translationSubjectChoice] = useAtom(fetchTranslationSubjectChoiceAtom);

  // 回答・解説が生成中の場合は、選択肢をすべて非活性とする
  const isDisabledSelector = useMemo<boolean>(
    () => !!answerExplanation && answerExplanation.isSubmitting,
    [answerExplanation]
  );

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
                questionSelector.choices[idx].isSelected &&
                (!answerExplanation || answerExplanation.isSubmitting)
                  ? "default"
                  : "outline"
              }
              className={`flex flex-col py-4 pl-4 w-full h-full space-y-1 whitespace-normal items-start ${
                (answerExplanation &&
                  answerExplanation.correctFlags &&
                  answerExplanation.correctFlags[idx] &&
                  answerExplanation.isCorrect &&
                  questionSelector.choices[idx].isSelected) ||
                (answerExplanation &&
                  answerExplanation.correctFlags &&
                  answerExplanation.correctFlags[idx] &&
                  !answerExplanation.isCorrect)
                  ? " border-green-500 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900"
                  : answerExplanation &&
                    answerExplanation.correctFlags &&
                    !answerExplanation.correctFlags[idx] &&
                    questionSelector.choices[idx].isSelected
                  ? " border-red-500 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900"
                  : ""
              }`}
              disabled={isDisabledSelector}
              onClick={onClickSelector(idx)}
            >
              <p className="leading-7">{choice.sentence}</p>
              {translationSubjectChoice ? (
                <p className="text-sm text-muted-foreground">
                  {translationSubjectChoice.choices[idx]}
                </p>
              ) : (
                <Skeleton className="h-5 w-full" />
              )}
              {choice.img && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="group relative inline-block"
                    >
                      <img
                        src={choice.img}
                        alt={choice.img}
                        className="w-auto max-h-[30vh] object-cover"
                      />
                      <div className="absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-70 transition duration-300" />
                      <ZoomIn className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition duration-300 text-white size-[10vh]" />
                    </div>
                  </DialogTrigger>
                  <ImageDialogContent>
                    <DialogTitle />
                    <DialogDescription />
                    <img src={choice.img} alt={choice.img} />
                  </ImageDialogContent>
                </Dialog>
              )}
            </Button>
          ))
        : Array.from({ length: 4 }).map((_, idx: number) => (
            <Skeleton key={idx} className="h-[86px] w-full rounded-lg" />
          ))}
    </div>
  );
}
