import { TestResultAccordionContentProps } from "@/types/props";
import SelectorButton from "./SelectorButton";
import { AccordionContent } from "./ui/accordion";
import { Skeleton } from "./ui/skeleton";

/**
 * テスト結果アコーディオンのコンテンツのコンポーネント
 * @returns テスト結果アコーディオンのコンテンツのコンポーネント
 */
export default function TestResultAccordionContent({
  progress,
  getQuestion,
}: TestResultAccordionContentProps) {
  return (
    <AccordionContent>
      <div className="mx-8 my-4 space-y-8">
        <div className="space-y-4">
          <p className="leading-7 [&:not(:first-child)]:mt-6">選択した選択肢</p>
          <div className="mx-4 space-y-4">
            {getQuestion ? (
              progress.selectedIdxes.map((j: number) => (
                <SelectorButton
                  key={j}
                  img={getQuestion.choices[j].img}
                  sentence={getQuestion.choices[j].sentence}
                  // translation={} TODO: 翻訳文を追加
                  variant="outline"
                />
              ))
            ) : (
              <Skeleton className="h-[86px] w-full rounded-lg" />
            )}
          </div>
        </div>
        <div className="space-y-4">
          <p className="leading-7 [&:not(:first-child)]:mt-6">正解の選択肢</p>
          <div className="mx-4 space-y-4">
            {getQuestion ? (
              progress.correctIdxes.map((j: number) => (
                <SelectorButton
                  key={j}
                  img={getQuestion.choices[j].img}
                  sentence={getQuestion.choices[j].sentence}
                  // translation={} TODO: 翻訳文を追加
                  variant="outline"
                />
              ))
            ) : (
              <Skeleton className="h-[86px] w-full rounded-lg" />
            )}
          </div>
        </div>
      </div>
    </AccordionContent>
  );
}
