import { Progress } from "@/types/backend";
import { TestResultAccordionProps } from "@/types/props";
import { Check, X } from "lucide-react";
import SelectorButton from "./SelectorButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

/**
 * テスト結果アコーディオンのコンポーネント
 * @returns テスト結果アコーディオンのコンポーネント
 */
export default function TestResultAccordion({
  progresses,
}: TestResultAccordionProps) {
  return (
    <Accordion type="multiple">
      {progresses.map((progress: Progress, i: number) => (
        <AccordionItem key={i} value={`${i}`}>
          <AccordionTrigger className="px-4">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {`${i + 1}問目`}
            </h4>
            <span>
              {progress.isCorrect ? (
                <Check className="size-7 text-green-500" />
              ) : (
                <X className="size-7 text-red-500" />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="mx-8 my-4 space-y-8">
              <div className="space-y-4">
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  選択した選択肢
                </p>
                <div className="mx-4 space-y-4">
                  {progress.selectedIdxes.map((j: number) => (
                    <SelectorButton
                      key={j}
                      img={progress.choiceImgs[j]}
                      sentence={progress.choiceSentences[j]}
                      // TODO: 翻訳文を表示する
                      // translation={undefined}
                      variant="outline"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  正解の選択肢
                </p>
                <div className="mx-4 space-y-4">
                  {progress.correctIdxes.map((j: number) => (
                    <SelectorButton
                      key={j}
                      img={progress.choiceImgs[j]}
                      sentence={progress.choiceSentences[j]}
                      // TODO: 翻訳文を表示する
                      // translation={undefined}
                      variant="outline"
                    />
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
