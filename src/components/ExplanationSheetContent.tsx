import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchAnswerExplanationAtom,
  fetchQuestionSelectorAtom,
  fetchTranslationExplanationAtom,
  fetchTranslationSubjectChoiceAtom,
} from "@/lib/atoms";
import { Choice } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useAtomValue } from "jotai";
import { Fragment, useEffect, useState } from "react";
import SelectorButton from "./SelectorButton";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";

/**
 * 解説シートのコンテンツのコンポーネント
 * @returns 解説シートのコンテンツのコンポーネント
 */
export default function ExplanationSheetContent() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const questionSelector = useAtomValue(fetchQuestionSelectorAtom);
  const [translationExplanation, fetchTranslationExplanation] = useAtom(
    fetchTranslationExplanationAtom
  );
  const translationSubjectChoice = useAtomValue(
    fetchTranslationSubjectChoiceAtom
  );
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();

  // 回答・解説の生成/取得直後に、解説の翻訳文を1度だけ取得
  useEffect(() => {
    if (
      answerExplanation &&
      !translationExplanation &&
      !isOccurredTranslationFailed
    ) {
      (async () => {
        try {
          await fetchTranslationExplanation(instance, accountInfo);
        } catch {
          setIsOccurredTranslationFailed(true);
          translationFailedToast("解説", () =>
            setIsOccurredTranslationFailed(false)
          );
        }
      })();
    }
  }, [
    accountInfo,
    answerExplanation,
    fetchTranslationExplanation,
    instance,
    isOccurredTranslationFailed,
    translationExplanation,
    translationFailedToast,
  ]);

  return (
    questionSelector &&
    answerExplanation &&
    answerExplanation.communityVotes && (
      <>
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight my-4">
          コミュニティ回答割合
        </h4>
        <div className="flex space-x-4">
          {answerExplanation.communityVotes.map(
            (communityVote: string, idx: number) => (
              <Badge key={idx}>{communityVote}</Badge>
            )
          )}
        </div>
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mt-16 mb-4">
          選択肢と解説
        </h4>
        <div className="mb-4">
          {questionSelector.choices.map((choice: Choice, idx: number) => (
            <Fragment key={idx}>
              {idx > 0 && <Separator className="my-6" />}
              <div className="space-y-4">
                <SelectorButton
                  className={
                    answerExplanation.correctFlags &&
                    answerExplanation.correctFlags[idx]
                      ? "border-green-500 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900"
                      : "border-red-500 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900"
                  }
                  img={choice.img}
                  sentence={choice.sentence}
                  translation={
                    translationSubjectChoice &&
                    translationSubjectChoice.choices[idx]
                  }
                  variant="outline"
                />
                <div key={idx} className="space-y-1 px-4">
                  <p className="leading-7">
                    {answerExplanation.explanations &&
                      answerExplanation.explanations[idx]}
                  </p>
                  {translationExplanation &&
                  translationExplanation.explanations[idx] ? (
                    <p className="text-sm text-muted-foreground">
                      {translationExplanation.explanations[idx]}
                    </p>
                  ) : (
                    <Skeleton className="h-5 w-full" />
                  )}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </>
    )
  );
}
