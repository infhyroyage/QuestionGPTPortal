import { fetchAnswerExplanationAtom, fetchTestDetailsAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAtom } from "jotai";
import { ChevronRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "./ui/button";

/**
 * 次問題遷移ボタンのコンポーネント
 * @returns 次問題遷移ボタンのコンポーネント
 */
export default function NextQuestionButton() {
  const [answerExplanation] = useAtom(fetchAnswerExplanationAtom);
  const [testDetails] = useAtom(fetchTestDetailsAtom);

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();

  // 回答・解説を生成していない場合は、次問題遷移ボタンを非活性とする
  const isDisabledOpenExplanationButton = useMemo<boolean>(
    () => !answerExplanation || !answerExplanation.explanations,
    [answerExplanation]
  );

  // 次の問題かテスト結果ページへ遷移
  const onClick = useCallback(() => {
    if (testId && questionNumber) {
      const parsedQuestionNumber: number = parseInt(questionNumber);
      if (parsedQuestionNumber === testDetails[testId].length) {
        navigate(`${basePath}/tests/${testId}/result`);
      } else {
        navigate(
          `${basePath}/tests/${testId}/questions/${parsedQuestionNumber + 1}`
        );
      }
    }
  }, [navigate, questionNumber, testDetails, testId]);

  return (
    <Button
      size="icon"
      disabled={isDisabledOpenExplanationButton}
      onClick={onClick}
    >
      <ChevronRight />
    </Button>
  );
}
