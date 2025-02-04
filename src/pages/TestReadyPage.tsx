import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import {
  fetchTestDetailsAtom,
  resetAtomsForTestQuestionAtom,
} from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト準備ページのコンポーネント
 * @returns テスト準備ページのコンポーネント
 */
export default function TestReadyPage() {
  const [testDetails, fetchTestDetails] = useAtom(fetchTestDetailsAtom);
  const [, resetAtomsForTestQuestion] = useAtom(resetAtomsForTestQuestionAtom);

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

  // TestQuestionのレンダリングで必要なatomをすべてクリアし、最初の問題へ遷移
  const onClick = useCallback(() => {
    if (testId) {
      resetAtomsForTestQuestion();
      navigate(`${basePath}/tests/${testId}/questions/1`);
    }
  }, [navigate, resetAtomsForTestQuestion, testId]);

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
          {testId && testDetails[testId] ? (
            "開始"
          ) : (
            <>
              <Loader2 className="animate-spin" />
              Please wait
            </>
          )}
        </Button>
      </div>
    </>
  );
}
