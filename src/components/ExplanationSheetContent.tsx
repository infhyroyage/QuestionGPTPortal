import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchAnswerExplanationAtom,
  fetchTranslationExplanationAtom,
} from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

/**
 * 解説シートのコンテンツのコンポーネント
 * @returns 解説シートのコンテンツのコンポーネント
 */
export default function ExplanationSheetContent() {
  const [answerExplanation] = useAtom(fetchAnswerExplanationAtom);
  const [translationExplanation, fetchTranslationExplanation] = useAtom(
    fetchTranslationExplanationAtom
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
    <>
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight my-4">
        解説
      </h4>
      <div className="space-y-4 mb-4">
        {answerExplanation && answerExplanation.explanations ? (
          answerExplanation.explanations.map((explanation, idx) => (
            <div key={idx} className="space-y-1">
              <p className="leading-7">{explanation}</p>
              {translationExplanation &&
              translationExplanation.explanations[idx] ? (
                <p className="text-sm text-muted-foreground">
                  {translationExplanation.explanations[idx]}
                </p>
              ) : (
                <Skeleton className="h-5 w-full" />
              )}
            </div>
          ))
        ) : (
          <>
            <div className="space-y-1">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </>
        )}
      </div>
    </>
  );
}
