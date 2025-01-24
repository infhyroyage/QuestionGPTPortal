import TopBar from "@/components/TopBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/ui/use-toast";
import {
  fetchQuestionAtom,
  fetchTestDetailsAtom,
  fetchTranslationInitAtom,
} from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { Choice, Subject } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const [testDetails] = useAtom(fetchTestDetailsAtom);
  const [question, fetchQuestion] = useAtom(fetchQuestionAtom);
  const [translationInit, fetchTranslationInit] = useAtom(
    fetchTranslationInitAtom
  );
  const [selectedIdxes, setSelectedIdxes] = useState<number[]>([]);

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

  // ページ遷移時に、問題文・選択肢を取得・翻訳
  useEffect(() => {
    if (testId && questionNumber && !question) {
      (async () => {
        try {
          await fetchQuestion(testId, questionNumber, instance, accountInfo);
          await fetchTranslationInit(instance, accountInfo);
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
  }, [
    accountInfo,
    fetchQuestion,
    fetchTranslationInit,
    instance,
    question,
    questionNumber,
    testId,
  ]);

  const onClickSelector = useCallback(
    (idx: number) => () => {
      // TODO: 1つの問題に付き1回限りの回答とするため、回答済の場合はNOP
      // if (isSubmitted) return;

      let updated: number[];
      if (question && question.isMultiplied) {
        const updatedSelectedIdxes: number[] = selectedIdxes.includes(idx)
          ? selectedIdxes.filter((selectedIdx: number) => selectedIdx !== idx)
          : [...selectedIdxes, idx];
        updated = updatedSelectedIdxes.sort((a, b) =>
          a === b ? 0 : a < b ? -1 : 1
        );
      } else {
        updated = [idx];
      }
      setSelectedIdxes(updated);
    },
    [question, selectedIdxes]
  );

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
                <div key={idx} className="space-y-1">
                  <p className="leading-7">{subject.sentence}</p>
                  {translationInit ? (
                    <p className="text-sm text-muted-foreground">
                      {translationInit.subjects[idx]}
                    </p>
                  ) : (
                    <Skeleton className="h-5 w-full" />
                  )}
                </div>
              ))
            ) : (
              <>
                <div className="space-y-1">
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </>
            )}
          </div>
          <div className="h-[40vh]" />
        </div>
        <div className="fixed bottom-0 h-[40vh] w-full">
          <ScrollArea className="h-full rounded-md bg-slate-200 dark:bg-slate-800">
            <div className="space-y-4 m-4">
              {question
                ? question.choices.map((choice: Choice, idx: number) => (
                    <div
                      key={idx}
                      className={`py-4 pl-4 space-y-1 rounded-lg transition-colors ${
                        selectedIdxes.includes(idx)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={onClickSelector(idx)}
                    >
                      <p className="leading-7">{choice.sentence}</p>
                      {translationInit ? (
                        <p className="text-sm text-muted-foreground">
                          {translationInit.choices[idx]}
                        </p>
                      ) : (
                        <Skeleton className="h-5 w-full" />
                      )}
                    </div>
                  ))
                : Array.from({ length: 4 }).map((_, idx: number) => (
                    <Skeleton
                      key={idx}
                      className="h-[86px] w-full rounded-lg"
                    />
                  ))}
            </div>
          </ScrollArea>
        </div>
      </>
    )
  );
}
