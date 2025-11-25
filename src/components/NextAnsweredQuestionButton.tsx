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

  // 現在の問題がorderの何番目にあるか
  const currentIdx = useMemo<number>(
    () =>
      order && questionNumber ? order.indexOf(parseInt(questionNumber)) : -1,
    [order, questionNumber]
  );

  // 現在が最新の未回答問題（histories.lengthと同じ位置）にいる場合は非活性
  // currentIdx < histories.length なら、次に進める（次の回答済み問題または最新の進行中問題がある）
  const isDisabled = useMemo<boolean>(
    () => !histories || !order || currentIdx < 0 || currentIdx >= histories.length,
    [histories, order, currentIdx]
  );

  const onClick = useCallback(() => {
    if (testId && order && histories && currentIdx >= 0 && currentIdx < histories.length) {
      navigate(`/tests/${testId}/questions/${order[currentIdx + 1]}`);
    }
  }, [currentIdx, histories, navigate, order, testId]);

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
            <ChevronRight className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          次の問題へ
        </TooltipContent>
      </Tooltip>
    )
  );
}
