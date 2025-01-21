import TopBar from "@/components/TopBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/ui/use-toast";
import { fetchTestDetailsAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { GetQuestion, Subject } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const [testDetails] = useAtom(fetchTestDetailsAtom);
  const [question, setQuestion] = useState<GetQuestion | undefined>(undefined);

  const { testId, questionNumber } = useParams();

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const navigate = useNavigate();

  // tesiIdでの情報を習得していない場合はテスト準備ページにリダイレクト
  useEffect(() => {
    if (testId && !testDetails[testId]) {
      navigate(`${basePath}/tests/${testId}/ready`);
    }
  }, [navigate, testDetails, testId]);

  // 初回レンダリング時のみ[GET] /tests/{testId}/questions/{questionNumber}を実行
  useEffect(() => {
    (async () => {
      try {
        const res: GetQuestion = await accessBackend<GetQuestion>(
          "GET",
          `/tests/${testId}/questions/${questionNumber}`,
          instance,
          accountInfo
        );

        setQuestion(res);
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
  }, [accountInfo, instance, questionNumber, testId]);

  return (
    testId &&
    testDetails[testId] && (
      <>
        <TopBar
          title={`[${testDetails[testId].courseName}] ${testDetails[testId].testName}`}
        />
        <div className="pt-16 px-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
            {`${questionNumber}問目 (全${testDetails[testId].length}問)`}
          </h3>
          <div className="space-y-4 mb-4">
            {question ? (
              question.subjects.map((subject: Subject, idx: number) => (
                <p key={idx} className="leading-7">
                  {subject.sentence}
                </p>
              ))
            ) : (
              <Skeleton className="h-7 w-full" />
            )}
          </div>
          <div className="h-[40vh]" />
        </div>
        <div className="fixed bottom-0 h-[40vh] w-full px-4">
          <ScrollArea className="h-full rounded-md border bg-zinc-100 dark:bg-zinc-900">
            <div className="space-y-4 m-4">
              {[...Array(4)].map((_, idx) => (
                <div
                  key={idx}
                  className="py-4 pl-4 space-x-4 border border-input bg-background rounded-lg text-lg font-semibold hover:bg-accent hover:text-accent-foreground"
                >
                  {`選択肢${idx + 1}`}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </>
    )
  );
}
