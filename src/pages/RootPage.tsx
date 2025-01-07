import LoadingCenter from "@/components/LoadingCenter";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/ui/use-toast";
import { accessBackend } from "@/lib/backend";
import { GetTests, Test } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { ChevronDown, ScrollText, TriangleAlert } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router";

/**
 * ルートページのコンポーネント
 * @returns ルートページのコンポーネント
 */
export default function RootPage() {
  const [getTests, setGetTests] = useState<GetTests | undefined>(undefined);
  const [opens, setOpens] = useState<boolean[]>([]);

  const { toast } = useToast();

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const navigate = useNavigate();

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

        setOpens(Array(Object.keys(res).length).fill(false));
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
          Object.keys(getTests).map((course: string, i: number) => (
            <Fragment key={i}>
              <Button
                variant="ghost"
                className="px-6 py-8 w-full justify-start space-x-4"
                onClick={() => {
                  setOpens((prev) => [
                    ...prev.slice(0, i),
                    !prev[i],
                    ...prev.slice(i + 1),
                  ]);
                }}
              >
                <ChevronDown
                  className={`h-6 w-6 transform transition-transform duration-200 ${
                    opens[i] ? "rotate-180" : "rotate-0"
                  }`}
                />
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  {course}
                </h3>
              </Button>
              {opens[i] && (
                <div className="pl-16 space-y-2">
                  {getTests[course].map((test: Test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-start space-x-4"
                    >
                      <ScrollText className="h-5 w-5" />
                      <Button
                        variant="link"
                        onClick={() => navigate(`/tests/${test.id}/ready`)}
                      >
                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                          {test.testName}
                        </h4>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Fragment>
          ))
        )}
      </div>
    </>
  );
}
