import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { fetchTestDetailsAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { TestDetail } from "@/types/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { ChevronDown, ScrollText, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

/**
 * トップページのコンポーネント
 * @returns トップページのコンポーネント
 */
export default function RootPage() {
  const [testDetails, fetchTestDetails] = useAtom(fetchTestDetailsAtom);
  const [opens, setOpens] = useState<boolean[]>([]);

  const navigate = useNavigate();
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

  // テスト一覧情報を取得後、テスト一覧情報のオープン/クローズの状態を初期化
  useEffect(() => {
    if (testDetails) {
      const courseNames: Set<string> = new Set(
        testDetails.map((testDetail: TestDetail) => testDetail.courseName)
      );
      setOpens([...Array(courseNames.size)].fill(false));
    }
  }, [testDetails]);

  // idx番目のコースのテストの最大化/最小化の切替え
  const onClickOuterButton = useCallback((idx: number) => {
    setOpens((prev) => [
      ...prev.slice(0, idx),
      !prev[idx],
      ...prev.slice(idx + 1),
    ]);
  }, []);

  // testIdのテスト準備ページへ遷移
  const onClickInnerButton = useCallback(
    (testId: string) => {
      navigate(`${basePath}/tests/${testId}/ready`);
    },
    [navigate]
  );

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
          <div className="space-y-2">
            {Array.from(
              new Set(
                testDetails.map(
                  (testDetail: TestDetail) => testDetail.courseName
                )
              )
            ).map((courseName: string, idx: number) => (
              <div key={idx}>
                <Button
                  variant="ghost"
                  className="px-6 py-8 w-full justify-start space-x-4"
                  onClick={() => onClickOuterButton(idx)}
                >
                  <ChevronDown
                    className={`h-6 w-6 transform transition-transform ${
                      opens[idx] ? "rotate-180" : "rotate-0"
                    }`}
                  />
                  <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                    {courseName}
                  </h3>
                </Button>
                {opens[idx] && (
                  <div className="pl-16 space-y-2">
                    {testDetails
                      .filter(
                        (testDetail: TestDetail) =>
                          testDetail.courseName === courseName
                      )
                      .map((testDetail: TestDetail) => (
                        <div
                          key={testDetail.testId}
                          className="flex items-center justify-start space-x-4"
                        >
                          <ScrollText className="h-5 w-5" />
                          <Button
                            variant="link"
                            onClick={() =>
                              onClickInnerButton(testDetail.testId)
                            }
                          >
                            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                              {testDetail.testName}
                            </h4>
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
