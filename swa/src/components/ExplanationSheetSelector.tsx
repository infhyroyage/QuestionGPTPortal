import {
  fetchAnswerExplanationAtom,
  fetchQuestionSelectorAtom,
  fetchTranslationExplanationAtom,
  fetchTranslationSubjectChoiceAtom,
} from "@/lib/atoms";
import { Choice } from "@/types/backend";
import { useAtomValue } from "jotai";
import { Fragment } from "react/jsx-runtime";
import SelectorButton from "./SelectorButton";

/**
 * 解説シートの選択肢と解説のコンポーネント
 * @returns 解説シートの選択肢と解説のコンポーネント
 */
export default function ExplanationSheetSelector() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const questionSelector = useAtomValue(fetchQuestionSelectorAtom);
  const translationSubjectChoice = useAtomValue(
    fetchTranslationSubjectChoiceAtom,
  );
  const translationExplanation = useAtomValue(fetchTranslationExplanationAtom);

  return (
    questionSelector &&
    answerExplanation && (
      <>
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight my-4">
          選択肢と解説
        </h4>
        <div className="mb-4">
          {questionSelector.choices.map((choice: Choice, idx: number) => (
            <Fragment key={idx}>
              {idx > 0 && <div className="divider my-6" />}
              <div className="space-y-4">
                <SelectorButton
                  className={
                    answerExplanation.correctFlags &&
                    answerExplanation.correctFlags[idx]
                      ? "border-green-500 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900"
                      : "border-red-500 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900"
                  }
                  idx={idx}
                  img={choice.img}
                  sentence={choice.sentence}
                  translation={
                    translationSubjectChoice
                      ? translationSubjectChoice.choices[idx]
                      : null
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
                    <p className="text-sm text-base-content/60">
                      {translationExplanation.explanations[idx]}
                    </p>
                  ) : (
                    <div className="skeleton h-5 w-full" />
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
