import { fetchProgressesAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { ChevronLeft } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * 前問題遷移ボタンのコンポーネント（TopBar用）
 * @returns 前問題遷移ボタンのコンポーネント
 */
export default function PreviousQuestionButton() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();

  // 現在の問題番号がorderの最初の問題番号の場合は、ボタンを非活性とする
  const isDisabled = useMemo<boolean>(() => {
    if (!order || !questionNumber) return true;
    const currentQuestionNumber = parseInt(questionNumber);
    return order[0] === currentQuestionNumber;
  }, [order, questionNumber]);

  // 前の問題へ遷移
  const onClick = useCallback(() => {
    if (testId && histories && order && questionNumber) {
      const currentQuestionNumber = parseInt(questionNumber);
      const currentIndex = order.indexOf(currentQuestionNumber);
      
      // 現在の問題番号がorderの中で最初でない場合、前の問題番号に遷移
      if (currentIndex > 0) {
        const previousQuestionNumber = order[currentIndex - 1];
        navigate(`/tests/${testId}/questions/${previousQuestionNumber}`);
      }
    }
  }, [histories, navigate, order, testId, questionNumber]);

  return (
    histories &&
    order && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="size-7"
            size="icon"
            variant="outline"
            disabled={isDisabled}
            onClick={onClick}
          >
            <ChevronLeft className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          前の問題へ
        </TooltipContent>
      </Tooltip>
    )
  );
}
