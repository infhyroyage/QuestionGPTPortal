import LoadingCenter from "@/components/LoadingCenter";
import TestReadyButtons from "@/components/TestReadyButtons";
import TopBar from "@/components/TopBar";
import useTestDetail from "@/hooks/useTestDetail";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { GetProgressesRes, Progress } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
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
        const res: GetProgressesRes = await accessBackend<GetProgressesRes>(
          "GET",
          `/tests/${testId}/progresses`,
          instance,
          accountInfo
        );
        setProgresses(res);
      })();
    }
  }, [accountInfo, instance, progresses, testDetail, testId]);

  return (
    testId &&
    testDetail && (
      <>
        <TopBar title="Question GPT Portal" />
        <div className="pt-[52px] mx-4 flex items-center justify-center min-h-screen flex-col space-y-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {testDetail.courseName}
            </h3>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {testDetail.testName}
            </h4>
          </div>
          {progresses ? (
            <TestReadyButtons progresses={progresses} />
          ) : (
            <LoadingCenter />
          )}
        </div>
      </>
    )
  );
}
