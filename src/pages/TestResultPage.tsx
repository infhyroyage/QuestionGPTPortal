import LoadingCenter from "@/components/LoadingCenter";
import TestResultAccordion from "@/components/TestResultAccordion";
import TopBar from "@/components/TopBar";
import useTestDetail from "@/hooks/useTestDetail";
import { resetAtomsForTestQuestionAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { GetProgressesRes, Progress } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト結果ページのコンポーネント
 * @returns テスト結果ページのコンポーネント
 */
export default function TestResultPage() {
  const resetAtomsForTestQuestion = useSetAtom(resetAtomsForTestQuestionAtom);

  const [progresses, setProgresses] = useState<Progress[] | undefined>(
    undefined
  );
  const [isDeleted, setIsDeleted] = useState<boolean>(false);

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

  // 今まで回答した問題の回答履歴をバックエンドから取得
  useEffect(() => {
    if (testId && testDetail && !progresses) {
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

  // バックエンドから取得した今まで回答した問題の回答履歴の整合性が取れた場合、
  // 前問題の問題文・選択肢・回答・解説文・翻訳文のatomをすべて初期化
  useEffect(() => {
    if (testDetail && progresses && testDetail.length === progresses.length) {
      resetAtomsForTestQuestion();
    }
  }, [resetAtomsForTestQuestion, testDetail, progresses]);

  // バックエンドから取得した今まで回答した問題の回答履歴の整合性が取れた場合、
  // バックエンドからその回答履歴を削除
  useEffect(() => {
    if (
      testId &&
      testDetail &&
      progresses &&
      testDetail.length === progresses.length &&
      !isDeleted
    ) {
      (async () => {
        await accessBackend(
          "DELETE",
          `/tests/${testId}/progresses`,
          instance,
          accountInfo
        );
        setIsDeleted(true);
      })();
    }
  }, [accountInfo, instance, isDeleted, progresses, testDetail, testId]);

  return (
    testId &&
    testDetail && (
      <>
        <TopBar title="Question GPT Portal" />
        {progresses && progresses.length > 0 && isDeleted ? (
          <div className="pt-[52px] px-4">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
              {`全${testDetail.length}問中${
                progresses.filter((progress) => progress.isCorrect).length
              }問正解 (正答率${Math.round(
                (progresses.filter((progress) => progress.isCorrect).length /
                  progresses.length) *
                  100
              )}%)`}
            </h3>
            <div className="mx-4 mt-4">
              <TestResultAccordion progresses={progresses} />
            </div>
          </div>
        ) : (
          <LoadingCenter />
        )}
      </>
    )
  );
}
