import LoadingCenter from "@/components/LoadingCenter";
import TestResultAccordion from "@/components/TestResultAccordion";
import TopBar from "@/components/TopBar";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTestDetail from "@/hooks/useTestDetail";
import { fetchProgressesAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { History } from "@/types/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate, useNavigationType, useParams } from "react-router";

/**
 * テスト結果ページのコンポーネント
 * @returns テスト結果ページのコンポーネント
 */
export default function TestResultPage() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const [isFinishedDelete, setIsFinishedDelete] = useState<boolean>(false);

  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();
  const testDetail = useTestDetail();

  // テスト詳細情報が取得できていない、またはブラウザバックした場合はトップページにリダイレクト
  useEffect(() => {
    if (!testDetail || navigationType === "POP") {
      navigate(`${basePath}/`);
    }
  }, [navigate, testDetail, navigationType]);

  // バックエンドから取得した今まで回答した問題の回答履歴の整合性が取れた場合、
  // バックエンドからその回答履歴を削除
  useEffect(() => {
    if (
      testId &&
      histories &&
      order &&
      histories.length === order.length &&
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
    order,
    systemErrorToast,
    testId,
  ]);

  return (
    testId &&
    order && (
      <>
        <TopBar title="Question GPT Portal" />
        {histories && histories.length > 0 && isFinishedDelete ? (
          <div className="pt-[52px] px-4">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
              {`全${order.length}問中${
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
