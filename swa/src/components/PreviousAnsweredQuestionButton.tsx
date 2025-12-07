import { fetchAnswerExplanationAtom, fetchProgressesAtom } from "@/lib/atoms";
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
  const { order } = useAtomValue(fetchProgressesAtom);
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();

  // 現在の問題がorderの何番目かを取得
  const currentIdx = useMemo(() => {
    if (!order || !questionNumber) return -1;
    return order.indexOf(parseInt(questionNumber));
  }, [order, questionNumber]);

  // 以下のいずれかの場合は非活性
  // - 現在の問題が最初の問題の場合(前の問題がない)
  // - 回答・解説が生成中の場合
  const isDisabled = useMemo(
    () => currentIdx <= 0 || (answerExplanation?.isSubmitting ?? false),
    [currentIdx, answerExplanation]
  );

  // ボタン押下時に1つ前の問題に遷移
  const onClick = useCallback(() => {
    if (testId && order && currentIdx > 0) {
      navigate(`/tests/${testId}/questions/${order[currentIdx - 1]}`);
    }
  }, [testId, order, currentIdx, navigate]);

  return (
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
  );
}
