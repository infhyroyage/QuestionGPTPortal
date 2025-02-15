import TestListAccordion from "@/components/TestListAccordion";
import TopBar from "@/components/TopBar";
import { Skeleton } from "@/components/ui/skeleton";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { fetchTestDetailsAtom } from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

/**
 * トップページのコンポーネント
 * @returns トップページのコンポーネント
 */
export default function RootPage() {
  const [testDetails, fetchTestDetails] = useAtom(fetchTestDetailsAtom);

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // テスト一覧情報を1度だけ取得
  useEffect(() => {
    (async () => {
      try {
        await fetchTestDetails(instance, accountInfo);
      } catch (e) {
        systemErrorToast(e);
      }
    })();
  }, [accountInfo, fetchTestDetails, instance, systemErrorToast]);

  return (
    <>
      <TopBar title="Question GPT Portal" />
      <div className="pt-16">
        {!testDetails ? (
          <div className="space-y-2">
            <Skeleton className="px-6 py-8 w-full rounded-md" />
            <Skeleton className="px-6 py-8 w-full rounded-md" />
            <Skeleton className="px-6 py-8 w-full rounded-md" />
          </div>
        ) : Object.keys(testDetails).length === 0 ? (
          <div className="flex items-center justify-center h-screen flex-col gap-4">
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
