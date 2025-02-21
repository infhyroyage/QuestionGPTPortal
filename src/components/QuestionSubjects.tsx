import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchQuestionSelectorAtom,
  fetchTranslationSubjectChoiceAtom,
} from "@/lib/atoms";
import { Subject } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import ImageDialog from "./ImageDialog";
import { Skeleton } from "./ui/skeleton";

/**
 * テストページの上半分の問題文のコンポーネント
 * @returns テストページの上半分の問題文のコンポーネント
 */
export default function QuestionSubjects() {
  const [questionSelector] = useAtom(fetchQuestionSelectorAtom);
  const [translationSubjectChoice, fetchTranslationSubjectChoice] = useAtom(
    fetchTranslationSubjectChoiceAtom
  );
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();

  // 問題文・選択肢の取得直後に、それらの翻訳文を1度だけ取得
  useEffect(() => {
    if (
      questionSelector &&
      !translationSubjectChoice &&
      !isOccurredTranslationFailed
    ) {
      (async () => {
        try {
          await fetchTranslationSubjectChoice(instance, accountInfo);
        } catch {
          setIsOccurredTranslationFailed(true);
          translationFailedToast("問題文・選択肢", () =>
            setIsOccurredTranslationFailed(false)
          );
        }
      })();
    }
  }, [
    accountInfo,
    fetchTranslationSubjectChoice,
    instance,
    isOccurredTranslationFailed,
    questionSelector,
    translationFailedToast,
    translationSubjectChoice,
  ]);

  return (
    <>
      <div className="space-y-4 mb-4">
        {questionSelector ? (
          questionSelector.subjects.map((subject: Subject, idx: number) =>
            subject.isIndicatedImg ? (
              <ImageDialog
                key={idx}
                img={subject.sentence}
                alt={subject.sentence}
              />
            ) : (
              <div key={idx} className="space-y-1">
                <p className="leading-7">{subject.sentence}</p>
                {translationSubjectChoice ? (
                  <p className="text-sm text-muted-foreground">
                    {translationSubjectChoice.subjects[idx]}
                  </p>
                ) : (
                  <Skeleton className="h-5 w-full" />
                )}
              </div>
            )
          )
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
