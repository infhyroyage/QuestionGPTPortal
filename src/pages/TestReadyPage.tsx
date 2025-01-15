import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/ui/use-toast";
import { testDetailsAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { TestDetails } from "@/types/atoms";
import { GetTest } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト準備ページのコンポーネント
 * @returns テスト準備ページのコンポーネント
 */
export default function TestReadyPage() {
  const [testDetails, setTestDetails] = useAtom<TestDetails>(testDetailsAtom);

  const { testId } = useParams();

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const navigate = useNavigate();

  // tesiIdでの情報を習得していない場合のみ[GET] /tests/{testId}を実行
  useEffect(() => {
    if (testId && !testDetails[testId]) {
      (async () => {
        try {
          const res: GetTest = await accessBackend<GetTest>(
            "GET",
            `/tests/${testId}`,
            instance,
            accountInfo
          );
          setTestDetails((prev) => ({ ...prev, [testId]: res }));
        } catch (e) {
          console.error(e);
          toast({
            variant: "destructive",
            title: "システムエラーが発生しました",
            description: (
              <>
                <p>以下をシステム管理者にご連絡ください</p>
                <p>{String(e)}</p>
              </>
            ),
          });
        }
      })();
    }
  }, [accountInfo, testDetails, instance, setTestDetails, testId]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Button
        disabled={!testId || !testDetails[testId]}
        onClick={() => navigate(`/tests/${testId}/start`)}
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
  );
}
