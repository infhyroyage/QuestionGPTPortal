import { Button } from "@/components/ui/button";
import useTestDetail from "@/hooks/useTestDetail";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { TestReadyButtonsProps } from "@/types/props";
import { useAccount, useMsal } from "@azure/msal-react";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";

export default function TestReadyButtons({
  progresses,
}: TestReadyButtonsProps) {
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
    if (progresses && testId) {
      navigate(
        `${basePath}/tests/${testId}/questions/${progresses.length + 1}`
      );
    }
  }, [navigate, progresses, testId]);

  // 最初の問題のテストページへ遷移
  const onClickStartButton = useCallback(() => {
    if (testId) {
      // 今まで回答した問題の回答履歴がある場合は回答履歴を削除
      if (progresses && progresses.length > 0) {
        (async () => {
          await accessBackend(
            "DELETE",
            `/tests/${testId}/progresses`,
            instance,
            accountInfo
          );
          navigate(`${basePath}/tests/${testId}/questions/1`);
        })();
      } else {
        navigate(`${basePath}/tests/${testId}/questions/1`);
      }
    }
  }, [accountInfo, instance, navigate, progresses, testId]);

  return testDetail && progresses.length === testDetail.length ? (
    <Button onClick={onClickResultButton} size="lg">
      結果を見る
    </Button>
  ) : (
    <>
      {progresses.length > 0 && (
        <Button onClick={onClickResumeButton} size="lg">
          {`${progresses.length + 1}問目から再開`}
        </Button>
      )}
      <Button
        onClick={onClickStartButton}
        size="lg"
        variant={progresses.length > 0 ? "destructive" : "default"}
      >
        {`1問目から開始${
          progresses.length > 0 ? "(回答履歴が削除されます)" : ""
        }`}
      </Button>
    </>
  );
}
