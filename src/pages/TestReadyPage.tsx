import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import {
  fetchTestDetailsAtom,
  resetAtomsForTestQuestionAtom,
} from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { Progress, ProgressTest } from "@/types/storage";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト準備ページのコンポーネント
 * @returns テスト準備ページのコンポーネント
 */
export default function TestReadyPage() {
  const [testDetails, fetchTestDetails] = useAtom(fetchTestDetailsAtom);
  const [, resetAtomsForTestQuestion] = useAtom(resetAtomsForTestQuestionAtom);
  const [historyNum, setHistoryNum] = useState<number>(0);

  const navigate = useNavigate();
  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // テスト詳細情報を取得していない場合のみ取得
  useEffect(() => {
    if (testId && !testDetails[testId]) {
      (async () => {
        try {
          await fetchTestDetails(testId, instance, accountInfo);
        } catch (e) {
          systemErrorToast(e);
        }
      })();
    }
  }, [
    accountInfo,
    fetchTestDetails,
    instance,
    systemErrorToast,
    testDetails,
    testId,
  ]);

  // ローカルストレージに保存しているテストの回答履歴から、回答した問題数を取得
  useEffect(() => {
    const progressStr: string | null = localStorage.getItem("progress");
    if (testId && progressStr) {
      const progress: Progress = JSON.parse(progressStr);
      const progressTest: ProgressTest | undefined = progress[testId];
      setHistoryNum(progressTest ? progressTest.histories.length : 0);
    }
  }, [testId]);

  // TestQuestionPageのレンダリングで必要なatomをすべてクリアしてページ遷移
  const onClick = useCallback(() => {
    if (testId) {
      resetAtomsForTestQuestion();

      if (historyNum === testDetails[testId].length) {
        navigate(`${basePath}/tests/${testId}/result`);
      } else {
        navigate(`${basePath}/tests/${testId}/questions/${historyNum + 1}`);
      }
    }
  }, [historyNum, navigate, resetAtomsForTestQuestion, testDetails, testId]);

  return (
    <>
      <TopBar title="Question GPT Portal" />
      <div className="pt-16 flex items-center justify-center min-h-screen flex-col space-y-8">
        {testId && testDetails[testId] ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {testDetails[testId].courseName}
            </h3>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {testDetails[testId].testName}
            </h4>
          </div>
        ) : (
          <div className="container mx-auto px-8 flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        )}
        <Button
          disabled={!testId || !testDetails[testId]}
          onClick={onClick}
          size="lg"
        >
          {!testId || !testDetails[testId] ? (
            <>
              <Loader2 className="animate-spin" />
              Please wait
            </>
          ) : historyNum === testDetails[testId].length ? (
            "結果を見る"
          ) : historyNum > 0 ? (
            `${historyNum + 1}問目から再開`
          ) : (
            "1問目から開始"
          )}
        </Button>
      </div>
    </>
  );
}
