import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import { translateSubjectsAndChoices } from "@/lib/translation";
import { TranslationSubjectChoice } from "@/types/atoms";
import { TestResultAccordionUnitContentProps } from "@/types/props";
import { useAccount, useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import SelectorButton from "./SelectorButton";
import SubjectDisplay from "./SubjectDisplay";

/**
 * テスト結果アコーディオンの行単位のコンテンツのコンポーネント
 * @returns テスト結果アコーディオンの行単位のコンテンツのコンポーネント
 */
export default function TestResultAccordionUnitContent({
  getQuestion,
  history,
}: TestResultAccordionUnitContentProps) {
  const [translation, setTranslation] =
    useState<TranslationSubjectChoice>(undefined);
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();

  useEffect(() => {
    if (getQuestion && !translation && !isOccurredTranslationFailed) {
      (async () => {
        try {
          const translationSubjectChoice: TranslationSubjectChoice =
            await translateSubjectsAndChoices(
              getQuestion.subjects,
              getQuestion.choices,
              instance,
              accountInfo,
            );
          setTranslation(translationSubjectChoice);
        } catch {
          setIsOccurredTranslationFailed(true);
          translationFailedToast("問題文・選択肢", () =>
            setIsOccurredTranslationFailed(false),
          );
        }
      })();
    }
  }, [
    accountInfo,
    getQuestion,
    instance,
    isOccurredTranslationFailed,
    translationFailedToast,
    translation,
  ]);

  return (
    <div className="collapse-content">
      <div className="mx-8 my-4 space-y-8">
        <div className="space-y-4">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            問題文
          </h4>
          <div className="mx-4">
            <SubjectDisplay
              subjects={getQuestion && getQuestion.subjects}
              translation={translation && translation.subjects}
            />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            選択した選択肢
          </h4>
          <div className="mx-4 space-y-4">
            {getQuestion ? (
              history.selectedIdxes.map((j: number) => (
                <SelectorButton
                  key={j}
                  img={getQuestion.choices[j].img}
                  sentence={getQuestion.choices[j].sentence}
                  translation={translation ? translation.choices[j] : null}
                  variant="outline"
                />
              ))
            ) : (
              <div className="skeleton h-[86px] w-full rounded-lg" />
            )}
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            正解の選択肢
          </h4>
          <div className="mx-4 space-y-4">
            {getQuestion ? (
              history.correctIdxes.map((j: number) => (
                <SelectorButton
                  key={j}
                  img={getQuestion.choices[j].img}
                  sentence={getQuestion.choices[j].sentence}
                  translation={translation ? translation.choices[j] : null}
                  variant="outline"
                />
              ))
            ) : (
              <div className="skeleton h-[86px] w-full rounded-lg" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
