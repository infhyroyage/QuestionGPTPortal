import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import useTestDetail from "@/hooks/useTestDetail";
import { basePath } from "@/lib/github";
import { Progress, ProgressTest } from "@/types/storage";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト準備ページのコンポーネント
 * @returns テスト準備ページのコンポーネント
 */
export default function TestReadyPage() {
  const [historyNum, setHistoryNum] = useState<number>(0);

  const navigate = useNavigate();
  const { testId } = useParams();

  const testDetail = useTestDetail();

  // テスト詳細情報を習得していない場合はトップページにリダイレクト
  useEffect(() => {
    if (!testDetail) {
      navigate(`${basePath}/`);
    }
  }, [navigate, testDetail]);

  // ローカルストレージに保存しているテストの回答履歴から、回答した問題数を取得
  useEffect(() => {
    const progressStr: string | null = localStorage.getItem("progress");
    if (testId && progressStr) {
      const progress: Progress = JSON.parse(progressStr);
      const progressTest: ProgressTest | undefined = progress[testId];
      setHistoryNum(progressTest ? progressTest.histories.length : 0);
    }
  }, [testId]);

  // テスト結果ページへ遷移
  const onClickResultButton = useCallback(() => {
    if (testId) {
      navigate(`${basePath}/tests/${testId}/result`);
    }
  }, [navigate, testId]);

  // 再開してテストページへ遷移
  const onClickResumeButton = useCallback(() => {
    if (testId) {
      navigate(`${basePath}/tests/${testId}/questions/${historyNum + 1}`);
    }
  }, [historyNum, navigate, testId]);

  // ローカルストレージに保存しているテストの回答履歴を削除し、1問目のテストページへ遷移
  const onClickStartButton = useCallback(() => {
    if (testId) {
      const progressStr: string | null = localStorage.getItem("progress");
      if (progressStr) {
        const progress: Progress = JSON.parse(progressStr);
        delete progress[testId];
        localStorage.setItem("progress", JSON.stringify(progress));
      }

      navigate(`${basePath}/tests/${testId}/questions/1`);
    }
  }, [navigate, testId]);

  return (
    testId &&
    testDetail && (
      <>
        <TopBar title="Question GPT Portal" />
        <div className="pt-16 flex items-center justify-center min-h-screen flex-col space-y-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {testDetail.courseName}
            </h3>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {testDetail.testName}
            </h4>
          </div>
          {historyNum === testDetail.length && (
            <Button onClick={onClickResultButton} size="lg">
              結果を見る
            </Button>
          )}
          {historyNum !== testDetail.length && historyNum > 0 && (
            <Button onClick={onClickResumeButton} size="lg">
              {`${historyNum + 1}問目から再開`}
            </Button>
          )}
          <Button
            onClick={onClickStartButton}
            size="lg"
            variant={historyNum === 0 ? "default" : "destructive"}
          >
            {historyNum === 0
              ? "1問目から開始"
              : "1問目から開始(回答履歴が削除されます)"}
          </Button>
        </div>
      </>
    )
  );
}
