import LoadingCenter from "@/components/LoadingCenter";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import useTestDetail from "@/hooks/useTestDetail";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { GetProgressesRes, Progress } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト準備ページのコンポーネント
 * @returns テスト準備ページのコンポーネント
 */
export default function TestReadyPage() {
  const [progresses, setProgresses] = useState<Progress[] | undefined>(
    undefined
  );

  const navigate = useNavigate();
  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const testDetail = useTestDetail();

  // テスト詳細情報を習得していない場合はトップページにリダイレクト
  useEffect(() => {
    if (!testDetail) {
      navigate(`${basePath}/`);
    }
  }, [navigate, testDetail]);

  // 今まで回答した問題の回答履歴を取得
  useEffect(() => {
    if (testDetail && testId && !progresses) {
      (async () => {
        try {
          const res: GetProgressesRes = await accessBackend<GetProgressesRes>(
            "GET",
            `/tests/${testId}/progresses`,
            instance,
            accountInfo
          );
          setProgresses(res);
        } catch (err) {
          if (
            err instanceof AxiosError &&
            err.response &&
            err.response.status === 404
          ) {
            setProgresses([]);
          } else {
            throw err;
          }
        }
      })();
    }
  }, [accountInfo, instance, progresses, testDetail, testId]);

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

  return (
    testId &&
    testDetail && (
      <>
        <TopBar title="Question GPT Portal" />
        {progresses ? (
          <div className="pt-[52px] mx-4 flex items-center justify-center min-h-screen flex-col space-y-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {testDetail.courseName}
              </h3>
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                {testDetail.testName}
              </h4>
            </div>
            {progresses.length === testDetail.length ? (
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
                  variant={progresses.length === 0 ? "default" : "destructive"}
                >
                  {progresses.length === 0
                    ? "1問目から開始"
                    : "1問目から開始(回答履歴が削除されます)"}
                </Button>
              </>
            )}
          </div>
        ) : (
          <LoadingCenter />
        )}
      </>
    )
  );
}
