import {
  fetchAnswerExplanationAtom,
  fetchTranslationExplanationAtom,
} from "@/lib/atoms";
import { useAtom } from "jotai";
import { Skeleton } from "./ui/skeleton";

/**
 * 解説シートのコンテンツのコンポーネント
 * @returns 解説シートのコンテンツのコンポーネント
 */
export default function ExplanationSheetContent() {
  const [answerExplanation] = useAtom(fetchAnswerExplanationAtom);
  const [translationExplanation] = useAtom(fetchTranslationExplanationAtom);

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
