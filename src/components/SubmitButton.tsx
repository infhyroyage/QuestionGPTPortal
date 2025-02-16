import { Button } from "@/components/ui/button";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchAnswerExplanationAtom,
  fetchQuestionSelectorAtom,
  fetchTranslationExplanationAtom,
} from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { Check, Loader2, SendHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * 回答・解説生成ボタンのコンポーネント
 * @returns 回答・解説生成ボタンのコンポーネント
 */
export default function SubmitButton() {
  const [answerExplanation, fetchAnswerExplanation] = useAtom(
    fetchAnswerExplanationAtom
  );
  const [questionSelector] = useAtom(fetchQuestionSelectorAtom);
  const [translationExplanation, fetchTranslationExplanation] = useAtom(
    fetchTranslationExplanationAtom
  );
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);

  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();
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

  // 回答・解説の生成/取得直後に、解説の翻訳文を1度だけ取得
  useEffect(() => {
    if (
      answerExplanation &&
      !translationExplanation &&
      !isOccurredTranslationFailed
    ) {
      (async () => {
        try {
          await fetchTranslationExplanation(instance, accountInfo);
        } catch {
          setIsOccurredTranslationFailed(true);
          translationFailedToast("解説", () =>
            setIsOccurredTranslationFailed(false)
          );
        }
      })();
    }
  }, [
    accountInfo,
    answerExplanation,
    fetchTranslationExplanation,
    instance,
    isOccurredTranslationFailed,
    translationExplanation,
    translationFailedToast,
  ]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={
            !answerExplanation || answerExplanation.isSubmitting
              ? ""
              : answerExplanation.isCorrect
              ? " bg-green-500 hover:bg-green-600"
              : " bg-red-500 hover:bg-red-600"
          }
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
      </TooltipTrigger>
      <TooltipContent>回答・解説生成</TooltipContent>
    </Tooltip>
  );
}
