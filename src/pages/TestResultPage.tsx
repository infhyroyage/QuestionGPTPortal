import LoadingCenter from "@/components/LoadingCenter";
import TestResultAccordion from "@/components/TestResultAccordion";
import TopBar from "@/components/TopBar";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTestDetail from "@/hooks/useTestDetail";
import {
  fetchProgressesAtom,
  resetAtomsForTestQuestionAtom,
} from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { History } from "@/types/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト結果ページのコンポーネント
 * @returns テスト結果ページのコンポーネント
 */
export default function TestResultPage() {
  const { histories } = useAtomValue(fetchProgressesAtom);
  const resetAtomsForTestQuestion = useSetAtom(resetAtomsForTestQuestionAtom);
  const [isFinishedDelete, setIsFinishedDelete] = useState<boolean>(false);

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

  // バックエンドから取得した今まで回答した問題の回答履歴の整合性が取れた場合、
  // 前問題の問題文・選択肢・回答・解説文・翻訳文のatomをすべて初期化
  useEffect(() => {
    if (testDetail && histories && histories.length === testDetail.length) {
      resetAtomsForTestQuestion();
    }
  }, [histories, resetAtomsForTestQuestion, testDetail]);

  // バックエンドから取得した今まで回答した問題の回答履歴の整合性が取れた場合、
  // バックエンドからその回答履歴を削除
  useEffect(() => {
    if (
      testId &&
      testDetail &&
      histories &&
      testDetail.length === histories.length &&
      !isFinishedDelete
    ) {
      (async () => {
        try {
          await accessBackend(
            "DELETE",
            `/tests/${testId}/progresses`,
            instance,
            accountInfo
          );
        } catch (e) {
          systemErrorToast(e);
        } finally {
          setIsFinishedDelete(true);
        }
      })();
    }
  }, [
    accountInfo,
    histories,
    instance,
    isFinishedDelete,
    systemErrorToast,
    testDetail,
    testId,
  ]);

  return (
    testId &&
    testDetail && (
      <>
        <TopBar title="Question GPT Portal" />
        {histories && histories.length > 0 && isFinishedDelete ? (
          <div className="pt-[52px] px-4">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
              {`全${testDetail.length}問中${
                histories.filter((history: History) => history.isCorrect).length
              }問正解 (正答率${Math.round(
                (histories.filter((history: History) => history.isCorrect)
                  .length /
                  histories.length) *
                  100
              )}%)`}
            </h3>
            <div className="mt-4">
              <TestResultAccordion />
            </div>
          </div>
        ) : (
          <LoadingCenter />
        )}
      </>
    )
  );
}
