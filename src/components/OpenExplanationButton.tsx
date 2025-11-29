import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
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
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);

  // 回答・解説を生成していない場合、または生成中の場合は、解説表示ボタンを非活性とする
  // 回答済みの問題に遷移した場合は、explanationsが存在しなくてもanswerExplanationが存在すれば活性にする
  // （シート表示時に解説を取得する）
  const isDisabledOpenExplanationButton = useMemo<boolean>(
    () => !answerExplanation || answerExplanation.isSubmitting,
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
        <TooltipContent side="bottom" align="center">
          解説表示
        </TooltipContent>
      </Tooltip>
      <SheetContent
        side="bottom"
        className="min-w-screen max-h-[80vh] overflow-y-auto"
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
