import TestResultAccordion from "@/components/TestResultAccordion";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/Button";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { fetchProgressesAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { History } from "@/types/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtomValue } from "jotai";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useNavigationType, useParams } from "react-router";

/**
 * テスト結果ページのコンポーネント
 * @returns テスト結果ページのコンポーネント
 */
export default function TestResultPage() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const [isFinishedDelete, setIsFinishedDelete] = useState<boolean>(false);
  const deleteProgressesCalledRef = useRef<boolean>(false);

  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // トップページへ戻るボタンのクリック時の動作
  const onClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // 回答履歴とテストを解く問題番号の順番の整合性が取れない、またはブラウザバックした場合はトップページにリダイレクト
  useEffect(() => {
    if (
      !order ||
      !histories ||
      order.length === 0 ||
      histories.length === 0 ||
      histories.length !== order.length ||
      navigationType === "POP"
    ) {
      navigate("/");
    }
  }, [histories, navigate, navigationType, order]);

  // 回答履歴とテストを解く問題番号の順番の整合性が取れた場合、バックエンドからその回答履歴を削除
  useEffect(() => {
    if (
      !testId ||
      !histories ||
      !order ||
      histories.length === 0 ||
      order.length === 0 ||
      histories.length !== order.length ||
      isFinishedDelete ||
      deleteProgressesCalledRef.current
    ) {
      return;
    }
    deleteProgressesCalledRef.current = true;
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
  }, [
    testId,
    histories,
    order,
    isFinishedDelete,
    instance,
    accountInfo,
    systemErrorToast,
  ]);

  return (
    testId &&
    histories &&
    histories.length > 0 &&
    order &&
    order.length > 0 && (
      <>
        <TopBar title="Question GPT Portal" />
        <div className="pt-[52px] px-8 flex flex-col h-[calc(100vh-52px)]">
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
          <Button onClick={onClick} size="lg" className="shrink-0">
            トップページへ戻る
          </Button>
          {isFinishedDelete ? (
            <div className="flex-1 overflow-y-auto min-h-0">
              <TestResultAccordion />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={150} className="animate-spin" />
            </div>
          )}
        </div>
      </>
    )
  );
}
