import { Button } from "@/components/ui/button";
import useTestDetail from "@/hooks/useTestDetail";
import { fetchProgressesAtom, resetProgressesAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト準備ページのボタンのコンポーネント
 * @returns テスト準備ページのボタンのコンポーネント
 */
export default function TestReadyButtons() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const resetProgresses = useSetAtom(resetProgressesAtom);

  const navigate = useNavigate();
  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const testDetail = useTestDetail();

  // テスト結果ページへ遷移
  const onClickResultButton = useCallback(() => {
    if (testId) {
      navigate(`${basePath}/tests/${testId}/result`);
    }
  }, [navigate, testId]);

  // 途中の問題のテストページへ遷移
  const onClickResumeButton = useCallback(() => {
    if (testId && histories && order) {
      navigate(
        `${basePath}/tests/${testId}/questions/${order[histories.length]}`
      );
    }
  }, [histories, navigate, order, testId]);

  // 最初の問題のテストページへ遷移
  const onClickStartButton = useCallback(() => {
    if (testId && order) {
      (async () => {
        // 今まで回答した問題の回答履歴とテストを解く問題番号の順番を初期化できた場合、
        // 最初の問題番号のテストページへ遷移
        const initialQuestionNumber: number | undefined = await resetProgresses(
          testId,
          instance,
          accountInfo
        );
        if (initialQuestionNumber) {
          navigate(
            `${basePath}/tests/${testId}/questions/${initialQuestionNumber}`
          );
        }
      })();
    }
  }, [accountInfo, resetProgresses, instance, navigate, order, testId]);

  return testDetail && histories && histories.length === testDetail.length ? (
    <Button onClick={onClickResultButton} size="lg">
      結果を見る
    </Button>
  ) : (
    <>
      {histories && histories.length > 0 && (
        <Button onClick={onClickResumeButton} size="lg">
          {`${histories.length + 1}問目から再開`}
        </Button>
      )}
      <Button
        onClick={onClickStartButton}
        size="lg"
        variant={histories && histories.length > 0 ? "destructive" : "default"}
      >
        {`1問目から開始${
          histories && histories.length > 0 ? "(回答履歴が削除されます)" : ""
        }`}
      </Button>
    </>
  );
}
