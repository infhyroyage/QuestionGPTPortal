import { TestResultAccordionProps } from "@/types/props";
import { ProgressTestHistory } from "@/types/storage";
import { Check, X } from "lucide-react";
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
  histories,
}: TestResultAccordionProps) {
  return (
    <Accordion type="multiple">
      {histories.map((history: ProgressTestHistory, idx: number) => (
        <AccordionItem key={idx} value={`${idx}`}>
          <AccordionTrigger className="px-4">
            <small className="text-sm font-medium leading-none">
              {`${idx + 1}問目`}
            </small>
            <span>
              {history.isCorrect ? (
                <Check className="size-4 text-green-500" />
              ) : (
                <X className="size-4 text-red-500" />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>TODO</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
