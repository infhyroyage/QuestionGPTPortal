import {
  fetchAnswerExplanationAtom,
  fetchProgressesAtom,
  saveProgressAtom,
} from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtomValue, useSetAtom } from "jotai";
import { ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";

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
    [answerExplanation],
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

  // テスト結果ページへ遷移する場合はtrue、次の問題へ遷移する場合はfalse
  const isMovedToResultPage = useMemo<boolean>(
    () => !!(histories && order && histories.length === order.length),
    [histories, order],
  );

  // 次の問題かテスト結果ページへ遷移
  const onClick = useCallback(() => {
    if (testId && histories && order) {
      navigate(
        isMovedToResultPage
          ? `/tests/${testId}/result`
          : `/tests/${testId}/questions/${order[histories.length]}`,
      );
    }
  }, [histories, navigate, order, testId, isMovedToResultPage]);

  return (
    histories &&
    order && (
      <div
        className="tooltip z-50 before:z-50 after:z-50 tooltip-top"
        data-tip={
          isMovedToResultPage
            ? "テスト結果へ"
            : `${order[histories.length]}問目へ`
        }
      >
        <button
          type="button"
          className="btn btn-primary btn-square"
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
        </button>
      </div>
    )
  );
}
