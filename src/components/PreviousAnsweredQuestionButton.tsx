import { ChevronLeft } from "lucide-react";
import { useCallback } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * 現在表示している問題に対し、1つ前の回答済みの問題番号に遷移するボタンのコンポーネント
 * @returns 現在表示している問題に対し、1つ前の回答済みの問題番号に遷移するボタンのコンポーネント
 */
export default function PreviousAnsweredQuestionButton() {
  const onClick = useCallback(() => {
    // TODO: 現在表示している問題に対し、1つ前の回答済みの問題番号に遷移するロジックを実装
    console.log("Not Implemented");
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="size-7"
          size="icon"
          variant="outline"
          onClick={onClick}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        前の問題へ
      </TooltipContent>
    </Tooltip>
  );
}
