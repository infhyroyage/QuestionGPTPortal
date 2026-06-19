import {
  fetchAnswerExplanationAtom,
  fetchTranslationExplanationAtom,
} from "@/lib/atoms";
import { useAtomValue } from "jotai";

/**
 * 解説シートの回答のポイントのコンポーネント
 * @returns 解説シートの回答のポイントのコンポーネント
 */
export default function ExplanationSheetAnswerKeyPoint() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const translationExplanation = useAtomValue(fetchTranslationExplanationAtom);

  return (
    answerExplanation && (
      <>
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight my-4">
          回答のポイント
        </h4>
        {answerExplanation.answerKeyPoint && (
          <>
            <div className="space-y-1">
              <p className="leading-7">{answerExplanation.answerKeyPoint}</p>
              {translationExplanation &&
              translationExplanation.answerKeyPoint ? (
                <p className="text-sm text-base-content/60">
                  {translationExplanation.answerKeyPoint}
                </p>
              ) : (
                <div className="skeleton h-5 w-full" />
              )}
            </div>
          </>
        )}
      </>
    )
  );
}
