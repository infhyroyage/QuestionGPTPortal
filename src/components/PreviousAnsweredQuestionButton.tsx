import {
  fetchProgressesAtom,
  fetchTranslationSubjectChoiceAtom,
} from "@/lib/atoms";
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
  const translationSubjectChoice = useAtomValue(
    fetchTranslationSubjectChoiceAtom
  );

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();

  // 現在の問題がorderの何番目にあるか
  const currentIdx = useMemo<number>(
    () =>
      order && questionNumber ? order.indexOf(parseInt(questionNumber)) : -1,
    [order, questionNumber]
  );

  // 前の問題がない場合、または翻訳が完了していない場合は非活性
  const isDisabled = useMemo<boolean>(
    () => !order || currentIdx <= 0 || !translationSubjectChoice,
    [order, currentIdx, translationSubjectChoice]
  );

  const onClick = useCallback(() => {
    if (testId && order && currentIdx > 0) {
      navigate(`/tests/${testId}/questions/${order[currentIdx - 1]}`);
    }
  }, [currentIdx, navigate, order, testId]);

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
