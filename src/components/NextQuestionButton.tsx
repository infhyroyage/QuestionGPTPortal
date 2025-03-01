import useTestDetail from "@/hooks/useTestDetail";
import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAtom } from "jotai";
import { ChevronRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * 次問題遷移ボタンのコンポーネント
 * @returns 次問題遷移ボタンのコンポーネント
 */
export default function NextQuestionButton() {
  const [answerExplanation] = useAtom(fetchAnswerExplanationAtom);

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();

  const testDetail = useTestDetail();

  // 回答・解説を生成していない場合は、次問題遷移ボタンを非活性とする
  const isDisabledOpenExplanationButton = useMemo<boolean>(
    () => !answerExplanation || !answerExplanation.explanations,
    [answerExplanation]
  );

  // 次の問題かテスト結果ページへ遷移
  const onClick = useCallback(() => {
    if (testId && testDetail && questionNumber) {
      const parsedQuestionNumber: number = parseInt(questionNumber);
      if (parsedQuestionNumber === testDetail.length) {
        navigate(`${basePath}/tests/${testId}/result`);
      } else {
        navigate(
          `${basePath}/tests/${testId}/questions/${parsedQuestionNumber + 1}`
        );
      }
    }
  }, [navigate, questionNumber, testDetail, testId]);

  return (
    testDetail &&
    questionNumber && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            disabled={isDisabledOpenExplanationButton}
            onClick={onClick}
          >
            <ChevronRight />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {parseInt(questionNumber) === testDetail.length
            ? "テスト結果へ"
            : "次の問題へ"}
        </TooltipContent>
      </Tooltip>
    )
  );
}
