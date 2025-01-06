import LoadingCenter from "@/components/LoadingCenter";
import TopBar from "@/components/TopBar";
import { useToast } from "@/hooks/ui/use-toast";
import { accessBackend } from "@/lib/backend";
import { GetTests } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * ルートページのコンポーネント
 * @returns ルートページのコンポーネント
 */
export default function RootPage() {
  const [getTests, setGetTests] = useState<GetTests | undefined>(undefined);

  const { toast } = useToast();

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  // const navigate = useNavigate();

  // 初回レンダリング時のみ[GET] /testsを実行
  useEffect(() => {
    (async () => {
      try {
        const res: GetTests = await accessBackend<GetTests>(
          "GET",
          "/tests",
          instance,
          accountInfo
        );

        setGetTests(res);
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
  }, [accountInfo, instance, toast]);

  return (
    <>
      <TopBar title="Question GPT Portal" />
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        {!getTests ? (
          <LoadingCenter />
        ) : Object.keys(getTests).length === 0 ? (
          <>
            <TriangleAlert size={100} />
            <div>テストが見つかりませんでした</div>
          </>
        ) : (
          <div>TODO: テストが見つかりました</div>
        )}
      </div>
    </>
  );
}
