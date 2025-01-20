import TopBar from "@/components/TopBar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/ui/use-toast";
import { fetchTestDetailsAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { GetQuestion, Subject } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const [testDetails, fetchTestDetails] = useAtom(fetchTestDetailsAtom);
  const [question, setQuestion] = useState<GetQuestion | undefined>(undefined);

  const { testId, questionNumber } = useParams();

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  // tesiIdでの情報を習得していない場合のみ[GET] /tests/{testId}を実行
  useEffect(() => {
    if (testId && !testDetails[testId]) {
      (async () => {
        try {
          await fetchTestDetails(testId, instance, accountInfo);
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
  }, [accountInfo, fetchTestDetails, instance, testDetails, testId]);

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
    <>
      <TopBar
        title={
          testId && testDetails[testId]
            ? `[${testDetails[testId].courseName}] ${testDetails[testId].testName}`
            : "Question GPT Portal"
        }
      />
      <div className="pt-16">
        <div className="space-y-2">
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
      </div>
    </>
  );
}
