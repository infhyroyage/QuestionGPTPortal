import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { RefreshCcw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * 回答・解説再生成ボタンのコンポーネント
 * @returns 回答・解説再生成ボタンのコンポーネント
 */
export default function ResubmitButton() {
  const [answerExplanation, fetchAnswerExplanation] = useAtom(
    fetchAnswerExplanationAtom
  );
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);

  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // 回答・解説を生成していない場合は、回答・解説再生成ボタンを非活性とする
  const isDisabledResubmitButton = useMemo<boolean>(
    () => !answerExplanation || answerExplanation.isSubmitting,
    [answerExplanation]
  );

  // 回答・解説再生成ボタン押下時に、回答・解説を1度だけ再生成
  // 再生成した解説の再翻訳の処理は、SubmitButtonで実行する
  const onClickResubmit = useCallback(async () => {
    if (testId && questionNumber && !isOccurredSystemError) {
      try {
        await fetchAnswerExplanation(
          testId,
          questionNumber,
          instance,
          accountInfo,
          true
        );
      } catch (e) {
        setIsOccurredSystemError(true);
        systemErrorToast(e);
      }
    }
  }, [
    accountInfo,
    fetchAnswerExplanation,
    instance,
    isOccurredSystemError,
    questionNumber,
    systemErrorToast,
    testId,
  ]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          disabled={isDisabledResubmitButton}
          onClick={onClickResubmit}
        >
          <RefreshCcw />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        回答・解説再生成
      </TooltipContent>
    </Tooltip>
  );
}
