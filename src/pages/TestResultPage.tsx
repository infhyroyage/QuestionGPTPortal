import TestResultAccordion from "@/components/TestResultAccordion";
import TopBar from "@/components/TopBar";
import useTestDetail from "@/hooks/useTestDetail";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { GetProgressesRes, Progress } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト結果ページのコンポーネント
 * @returns テスト結果ページのコンポーネント
 */
export default function TestResultPage() {
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

  // 今まで回答した問題の回答履歴を取得後、回答履歴を削除
  useEffect(() => {
    if (testId && testId && !!progresses) {
      (async () => {
        await accessBackend(
          "DELETE",
          `/tests/${testId}/progresses`,
          instance,
          accountInfo
        );
      })();
    }
  }, [accountInfo, instance, progresses, testId]);

  // 正答数
  const correctNum: number = useMemo(
    () =>
      progresses
        ? progresses.filter((progress) => progress.isCorrect).length
        : -1,
    [progresses]
  );

  // 正答率
  const correctRate: number = useMemo(
    () =>
      progresses
        ? Math.round(
            (progresses.filter((progress) => progress.isCorrect).length /
              progresses.length) *
              100
          )
        : -1,
    [progresses]
  );

  return (
    testId &&
    testDetail && (
      <>
        <TopBar title="Question GPT Portal" />
        <div className="pt-[52px] px-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
            {`全${testDetail.length}問中${correctNum}問正解 (正答率${correctRate}%)`}
          </h3>
          <div className="mx-4 mt-4">
            <TestResultAccordion progresses={progresses} />
          </div>
        </div>
      </>
    )
  );
}
