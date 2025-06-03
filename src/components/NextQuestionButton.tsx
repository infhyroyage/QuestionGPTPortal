import {
  fetchAnswerExplanationAtom,
  fetchProgressesAtom,
  saveProgressAtom,
} from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtomValue, useSetAtom } from "jotai";
import { ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * 次問題遷移ボタンのコンポーネント
 * @returns 次問題遷移ボタンのコンポーネント
 */
export default function NextQuestionButton() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const saveProgress = useSetAtom(saveProgressAtom);

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  // 回答履歴を保存していない場合は、次問題遷移ボタンを非活性とする
  const isDisabledOpenExplanationButton = useMemo<boolean>(
    () => !answerExplanation || !answerExplanation.isSavedProgress,
    [answerExplanation]
  );

  // 回答・解説が生成済み、かつ回答履歴を保存していない場合は、回答履歴を保存する
  useEffect(() => {
    if (
      testId &&
      questionNumber &&
      answerExplanation &&
      !answerExplanation.isSubmitting &&
      !answerExplanation.isSavedProgress
    ) {
      (async () => {
        await saveProgress(testId, questionNumber, instance, accountInfo);
      })();
    }
  }, [
    accountInfo,
    answerExplanation,
    instance,
    questionNumber,
    saveProgress,
    testId,
  ]);

  // 次の問題かテスト結果ページへ遷移
  const onClick = useCallback(() => {
    if (testId && histories && order) {
      navigate(
        histories.length === order.length
          ? `${basePath}/tests/${testId}/result`
          : `${basePath}/tests/${testId}/questions/${order[histories.length]}`
      );
    }
  }, [histories, navigate, order, testId]);

  return (
    histories &&
    order && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            disabled={isDisabledOpenExplanationButton}
            onClick={onClick}
          >
            {answerExplanation &&
            !answerExplanation.isSubmitting &&
            !answerExplanation.isSavedProgress ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ChevronRight />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          {histories.length === order.length ? "テスト結果へ" : "次の問題へ"}
        </TooltipContent>
      </Tooltip>
    )
  );
}
