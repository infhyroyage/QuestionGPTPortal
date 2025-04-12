import useTestDetail from "@/hooks/useTestDetail";
import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAtom } from "jotai";
import { ChevronRight, Loader2 } from "lucide-react";
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

  // 回答履歴を保存していない場合は、次問題遷移ボタンを非活性とする
  const isDisabledOpenExplanationButton = useMemo<boolean>(
    () => !answerExplanation || !answerExplanation.isSavedProgress,
    [answerExplanation]
  );

  // 次の問題かテスト結果ページへ遷移
  const onClick = useCallback(() => {
    if (testId && testDetail && questionNumber) {
      const parsedQuestionNumber: number = parseInt(questionNumber);
      navigate(
        parsedQuestionNumber === testDetail.length
          ? `${basePath}/tests/${testId}/result`
          : `${basePath}/tests/${testId}/questions/${parsedQuestionNumber + 1}`
      );
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
            {answerExplanation && answerExplanation.isSavedProgress ? (
              <ChevronRight />
            ) : (
              <Loader2 className="animate-spin" />
            )}
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
