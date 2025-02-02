import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { ArrowLeftFromLine } from "lucide-react";
import { useMemo } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Skeleton } from "./ui/skeleton";

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
          <ArrowLeftFromLine />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-[40vw]">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight my-4">
          解説
        </h4>
        <div className="space-y-4 mb-4">
          {answerExplanation && answerExplanation.explanations ? (
            answerExplanation.explanations.map((explanation, idx) => (
              <div key={idx} className="space-y-1">
                <p className="leading-7">{explanation}</p>
                {/* TODO: 翻訳 */}
                <Skeleton className="h-5 w-full" />
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
      </SheetContent>
    </Sheet>
  );
}
