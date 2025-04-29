import LoadingCenter from "@/components/LoadingCenter";
import TestReadyButtons from "@/components/TestReadyButtons";
import TopBar from "@/components/TopBar";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTestDetail from "@/hooks/useTestDetail";
import { fetchProgressesAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト準備ページのコンポーネント
 * @returns テスト準備ページのコンポーネント
 */
export default function TestReadyPage() {
  const [{ histories }, fetchProgresses] = useAtom(fetchProgressesAtom);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);

  const navigate = useNavigate();
  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();
  const testDetail = useTestDetail();

  // テスト詳細情報を習得していない場合はトップページにリダイレクト
  useEffect(() => {
    if (!testDetail) {
      navigate(`${basePath}/`);
    }
  }, [navigate, testDetail]);

  // 今まで回答した問題の回答履歴とテストを解く問題番号の順番を取得
  useEffect(() => {
    if (testDetail && testId && !histories && !isOccurredSystemError) {
      (async () => {
        try {
          await fetchProgresses(testId, instance, accountInfo);
        } catch (e) {
          setIsOccurredSystemError(true);
          systemErrorToast(e);
        }
      })();
    }
  }, [
    accountInfo,
    fetchProgresses,
    histories,
    instance,
    isOccurredSystemError,
    systemErrorToast,
    testDetail,
    testId,
  ]);

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
          {histories ? <TestReadyButtons /> : <LoadingCenter />}
        </div>
      </>
    )
  );
}
