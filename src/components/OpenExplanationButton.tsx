import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { Info } from "lucide-react";
import { useMemo } from "react";
import ExplanationSheetContent from "./ExplanationSheetContent";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * 解説表示ボタンのコンポーネント
 * @returns 解説表示ボタンのコンポーネント
 */
export default function OpenExplanationButton() {
  const [answerExplanation] = useAtom(fetchAnswerExplanationAtom);

  // 回答・解説を生成していない場合は、解説表示ボタンを非活性とする
  const isDisabledOpenExplanationButton = useMemo<boolean>(
    () => !answerExplanation || !answerExplanation.explanations,
    [answerExplanation]
  );

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button size="icon" disabled={isDisabledOpenExplanationButton}>
              <Info />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>解説表示</TooltipContent>
      </Tooltip>
      <SheetContent
        side="bottom"
        className="min-w-[100vw] max-h-[80vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle />
          <SheetDescription />
        </SheetHeader>
        <ExplanationSheetContent />
      </SheetContent>
    </Sheet>
  );
}
