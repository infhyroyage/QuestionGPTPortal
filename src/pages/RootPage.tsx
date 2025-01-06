import LoadingCenter from "@/components/LoadingCenter";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/ui/use-toast";
import { accessBackend } from "@/lib/backend";
import { GetTests } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import {
  ChevronDown,
  ChevronUp,
  ScrollText,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";

/**
 * ルートページのコンポーネント
 * @returns ルートページのコンポーネント
 */
export default function RootPage() {
  const [getTests, setGetTests] = useState<GetTests | undefined>(undefined);
  const [isOpen, setIsOpen] = useState<boolean>(false);

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
      <div className="pt-16">
        {!getTests ? (
          <LoadingCenter />
        ) : Object.keys(getTests).length === 0 ? (
          <div className="flex items-center justify-center h-screen flex-col gap-4">
            <TriangleAlert size={100} />
            <div>テストが見つかりませんでした</div>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              className="px-6 py-8 w-full justify-start space-x-4"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                XXX
              </h3>
            </Button>
            {isOpen && (
              <div className="pl-16 space-y-2">
                <div className="flex items-center justify-start space-x-4">
                  <ScrollText className="h-5 w-5" />
                  <Button variant="link">
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                      YYY
                    </h4>
                  </Button>
                </div>
                <div className="flex items-center justify-start space-x-4">
                  <ScrollText className="h-5 w-5" />
                  <Button variant="link">
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                      ZZZ
                    </h4>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
