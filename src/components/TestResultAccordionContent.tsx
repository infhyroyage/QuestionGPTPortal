import { TestResultAccordionContentProps } from "@/types/props";
import SelectorButton from "./SelectorButton";
import { AccordionContent } from "./ui/accordion";

/**
 * テスト結果アコーディオンのコンテンツのコンポーネント
 * @returns テスト結果アコーディオンのコンテンツのコンポーネント
 */
export default function TestResultAccordionContent({
  progress,
  progressIdx,
  translations,
}: TestResultAccordionContentProps) {
  return (
    <AccordionContent>
      <div className="mx-8 my-4 space-y-8">
        <div className="space-y-4">
          <p className="leading-7 [&:not(:first-child)]:mt-6">選択した選択肢</p>
          <div className="mx-4 space-y-4">
            {progress.selectedIdxes.map((j: number) => (
              <SelectorButton
                key={j}
                img={progress.choiceImgs[j]}
                sentence={progress.choiceSentences[j]}
                translation={
                  translations[`${progressIdx}`] &&
                  translations[`${progressIdx}`][j]
                }
                variant="outline"
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <p className="leading-7 [&:not(:first-child)]:mt-6">正解の選択肢</p>
          <div className="mx-4 space-y-4">
            {progress.correctIdxes.map((j: number) => (
              <SelectorButton
                key={j}
                img={progress.choiceImgs[j]}
                sentence={progress.choiceSentences[j]}
                translation={
                  translations[`${progressIdx}`] &&
                  translations[`${progressIdx}`][j]
                }
                variant="outline"
              />
            ))}
          </div>
        </div>
      </div>
    </AccordionContent>
  );
}
