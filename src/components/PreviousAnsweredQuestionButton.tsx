import { fetchProgressesAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { ChevronLeft } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * 現在表示している問題に対し、1つ前の回答済みの問題番号に遷移するボタンのコンポーネント
 * @returns 現在表示している問題に対し、1つ前の回答済みの問題番号に遷移するボタンのコンポーネント
 */
export default function PreviousAnsweredQuestionButton() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();

  // 1つ前の回答済み問題番号を取得
  const previousAnsweredQuestionNumber = useMemo<number | null>(() => {
    if (!questionNumber || !histories || !order) return null;

    const currentIndex = order.indexOf(parseInt(questionNumber));
    if (currentIndex === -1) return null;

    // 現在のインデックスより前で、回答済みの問題を探す
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (i < histories.length) {
        return order[i];
      }
    }

    return null;
  }, [questionNumber, histories, order]);

  // 1つ前の回答済み問題がない場合は非活性
  const isDisabled = useMemo<boolean>(
    () => previousAnsweredQuestionNumber === null,
    [previousAnsweredQuestionNumber]
  );

  const onClick = useCallback(() => {
    if (testId && previousAnsweredQuestionNumber !== null) {
      navigate(`/tests/${testId}/questions/${previousAnsweredQuestionNumber}`);
    }
  }, [testId, previousAnsweredQuestionNumber, navigate]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="size-7"
          size="icon"
          variant="outline"
          onClick={onClick}
          disabled={isDisabled}
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
