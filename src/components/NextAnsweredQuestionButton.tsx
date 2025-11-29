import { fetchProgressesAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { ChevronRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * 現在表示している問題に対し、1つ後の回答済みの問題番号に遷移するボタンのコンポーネント
 * @returns 現在表示している問題に対し、1つ後の回答済みの問題番号に遷移するボタンのコンポーネント
 */
export default function NextAnsweredQuestionButton() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();

  // 現在の問題が order の何番目かを取得
  const currentIdx = useMemo(() => {
    if (!order || !questionNumber) return -1;
    return order.indexOf(parseInt(questionNumber));
  }, [order, questionNumber]);

  // 以下の場合は非活性
  // - 現在の問題が最新の未回答問題(またはそれ以降)の場合
  // - 現在の問題が最後の問題の場合(次の問題が存在しない)
  const isDisabled = useMemo(() => {
    if (!histories || !order || currentIdx === -1) return true;
    // 次の問題が存在しない場合は非活性
    if (currentIdx + 1 >= order.length) return true;
    // 現在の問題が最新の未回答問題(またはそれ以降)の場合は非活性
    return currentIdx >= histories.length;
  }, [histories, order, currentIdx]);

  const onClick = useCallback(() => {
    if (
      testId &&
      order &&
      histories &&
      currentIdx >= 0 &&
      currentIdx < histories.length &&
      currentIdx + 1 < order.length
    ) {
      // 1つ後の問題に遷移
      navigate(`/tests/${testId}/questions/${order[currentIdx + 1]}`);
    }
  }, [testId, order, histories, currentIdx, navigate]);

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
          <ChevronRight className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        次の問題へ
      </TooltipContent>
    </Tooltip>
  );
}
