import TestListAccordion from "@/components/TestListAccordion";
import TopBar from "@/components/TopBar";
import { Skeleton } from "@/components/ui/skeleton";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import {
  fetchTestDetailsAtom,
  resetAtomsForAllTestPagesAtom,
} from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useSetAtom } from "jotai";
import { TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * トップページのコンポーネント
 * @returns トップページのコンポーネント
 */
export default function RootPage() {
  const [testDetails, fetchTestDetails] = useAtom(fetchTestDetailsAtom);
  const resetAtomsForAllTestPages = useSetAtom(resetAtomsForAllTestPagesAtom);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);
  const fetchTestDetailsCalledRef = useRef<boolean>(false);

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // テスト一覧情報を1回だけ取得
  useEffect(() => {
    if (
      !testDetails &&
      !isOccurredSystemError &&
      !fetchTestDetailsCalledRef.current
    ) {
      fetchTestDetailsCalledRef.current = true;
      (async () => {
        try {
          await fetchTestDetails(instance, accountInfo);
        } catch (e) {
          setIsOccurredSystemError(true);
          systemErrorToast(e);
        }
      })();
    }
  }, [
    accountInfo,
    fetchTestDetails,
    instance,
    isOccurredSystemError,
    systemErrorToast,
    testDetails,
  ]);

  // トップページをレンダリングするたびに、
  // TestReadyPage/TestQuestionPage/TestResultPageのレンダリングで必要なatomをすべて初期値に戻す
  useEffect(() => {
    resetAtomsForAllTestPages();
  }, [resetAtomsForAllTestPages]);

  return (
    <>
      <TopBar title="Question GPT Portal" />
      <div className="pt-[52px]">
        {!testDetails ? (
          <div className="space-y-2">
            <Skeleton className="px-6 py-8 w-full rounded-md" />
            <Skeleton className="px-6 py-8 w-full rounded-md" />
            <Skeleton className="px-6 py-8 w-full rounded-md" />
          </div>
        ) : Object.keys(testDetails).length === 0 ? (
          <div className="flex items-center justify-center min-h-screen flex-col space-y-4">
            <TriangleAlert size={100} />
            <div>テストが見つかりませんでした</div>
          </div>
        ) : (
          <TestListAccordion />
        )}
      </div>
    </>
  );
}
