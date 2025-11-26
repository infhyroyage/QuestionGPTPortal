import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { fetchAnswerExplanationAtom, fetchProgressesAtom } from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useAtomValue } from "jotai";
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
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);

  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // 現在の問題がorderの何番目にあるか
  const currentIdx = useMemo<number>(
    () =>
      order && questionNumber ? order.indexOf(parseInt(questionNumber)) : -1,
    [order, questionNumber]
  );

  // 回答済み問題（過去の問題に遷移した場合）かどうか
  const isAnsweredQuestion = useMemo<boolean>(
    () => histories !== undefined && currentIdx >= 0 && currentIdx < histories.length,
    [histories, currentIdx]
  );

  // 以下の場合は回答・解説再生成ボタンを非活性とする
  // * 回答・解説を生成していない
  // * 回答済み問題に遷移した場合
  const isDisabledResubmitButton = useMemo<boolean>(
    () => !answerExplanation || answerExplanation.isSubmitting || isAnsweredQuestion,
    [answerExplanation, isAnsweredQuestion]
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
