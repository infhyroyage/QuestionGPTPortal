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

  // 1つ後の回答済み問題番号または次の未回答問題番号を取得
  const nextQuestionNumber = useMemo<number | null>(() => {
    if (!questionNumber || !histories || !order) return null;

    const currentIndex = order.indexOf(parseInt(questionNumber));
    if (currentIndex === -1) return null;

    // 現在のインデックスより後で、回答済みの問題を探す
    for (let i = currentIndex + 1; i < order.length; i++) {
      if (i < histories.length) {
        // 回答済み問題が見つかった
        return order[i];
      } else {
        // 未回答の問題が見つかった（最初の未回答問題に遷移）
        return order[i];
      }
    }

    return null;
  }, [questionNumber, histories, order]);

  // 次の問題がない場合は非活性
  const isDisabled = useMemo<boolean>(
    () => nextQuestionNumber === null,
    [nextQuestionNumber]
  );

  const onClick = useCallback(() => {
    if (testId && nextQuestionNumber !== null) {
      navigate(`/tests/${testId}/questions/${nextQuestionNumber}`);
    }
  }, [testId, nextQuestionNumber, navigate]);

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
          <ChevronRight className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        次の問題へ
      </TooltipContent>
    </Tooltip>
  );
}
