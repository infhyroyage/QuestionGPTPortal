import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { Info } from "lucide-react";
import { useMemo } from "react";
import ExplanationSheet from "./ExplanationSheet";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

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
      <SheetTrigger asChild>
        <Button size="icon" disabled={isDisabledOpenExplanationButton}>
          <Info />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[40vw] max-h-[100vh] overflow-y-auto">
        <ExplanationSheet />
      </SheetContent>
    </Sheet>
  );
}
