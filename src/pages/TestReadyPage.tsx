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

  // ローカルストレージに保存しているテストの回答履歴から、テストページかテスト結果ページへ遷移
  const onClick = useCallback(() => {
    if (testId && testDetail) {
      if (historyNum === testDetail.length) {
        navigate(`${basePath}/tests/${testId}/result`);
      } else {
        navigate(`${basePath}/tests/${testId}/questions/${historyNum + 1}`);
      }
    }
  }, [historyNum, navigate, testDetail, testId]);

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
          <Button onClick={onClick} size="lg">
            {historyNum === testDetail.length
              ? "結果を見る"
              : historyNum > 0
              ? // TODO: 再開ボタンのほかに、1問目から開始ボタンも表示し、1問目から開始ボタン押下時はローカルストレージを削除する
                `${historyNum + 1}問目から再開`
              : "1問目から開始"}
          </Button>
        </div>
      </>
    )
  );
}
