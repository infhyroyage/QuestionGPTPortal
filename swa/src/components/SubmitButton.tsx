import { Button } from "@/components/Button";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { type ButtonVariant } from "@/components/Button";
import {
  fetchAnswerExplanationAtom,
  fetchQuestionSelectorAtom,
} from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useAtomValue } from "jotai";
import { Check, Loader2, SendHorizontal, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import Tooltip from "./Tooltip";

/**
 * 回答・解説生成ボタンのコンポーネント
 * @returns 回答・解説生成ボタンのコンポーネント
 */
export default function SubmitButton() {
  const [answerExplanation, fetchAnswerExplanation] = useAtom(
    fetchAnswerExplanationAtom
  );
  const questionSelector = useAtomValue(fetchQuestionSelectorAtom);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);

  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // 以下のいずれかの場合は、回答・解説生成ボタンを非活性とする
  // * 選択肢を取得していない
  // * 選択肢がいずれも選択していない
  // * 回答・解説が生成中
  const isDisabledSubmitButton = useMemo<boolean>(
    () =>
      !questionSelector ||
      questionSelector.choices.every((choice) => !choice.isSelected) ||
      (!!answerExplanation && answerExplanation.isSubmitting),
    [answerExplanation, questionSelector]
  );

  // 回答結果に応じてボタンの配色(daisyUI variant)を切り替える
  // * 未回答・生成中: primary
  // * 正解: success
  // * 不正解: error
  const buttonVariant = useMemo<ButtonVariant>(() => {
    if (!answerExplanation || answerExplanation.isSubmitting) {
      return "primary";
    }
    return answerExplanation.isCorrect ? "success" : "error";
  }, [answerExplanation]);

  // 回答・解説生成ボタン押下時に、回答・解説を1度だけ生成/取得
  const onClickSubmit = useCallback(async () => {
    if (
      testId &&
      questionNumber &&
      !answerExplanation &&
      !isOccurredSystemError
    ) {
      try {
        await fetchAnswerExplanation(
          testId,
          questionNumber,
          instance,
          accountInfo
        );
      } catch (e) {
        setIsOccurredSystemError(true);
        systemErrorToast(e);
      }
    }
  }, [
    accountInfo,
    answerExplanation,
    fetchAnswerExplanation,
    instance,
    isOccurredSystemError,
    questionNumber,
    systemErrorToast,
    testId,
  ]);

  return (
    <Tooltip tip="回答・解説生成" position="top">
      <Button
        variant={buttonVariant}
        size="icon"
        disabled={isDisabledSubmitButton}
        onClick={onClickSubmit}
      >
        {!answerExplanation ? (
          <SendHorizontal />
        ) : answerExplanation.isSubmitting ? (
          <Loader2 className="animate-spin" />
        ) : answerExplanation.isCorrect ? (
          <Check />
        ) : (
          <X />
        )}
      </Button>
    </Tooltip>
  );
}
