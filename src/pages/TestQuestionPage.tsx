import NextQuestionButton from "@/components/NextQuestionButton";
import OpenExplanationButton from "@/components/OpenExplanationButton";
import QuestionSubjects from "@/components/QuestionSubjects";
import Selector from "@/components/Selector";
import SubmitButton from "@/components/SubmitButton";
import TopBar from "@/components/TopBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTestDetail from "@/hooks/useTestDetail";
import {
  fetchQuestionSelectorAtom,
  fetchTranslationSubjectChoiceAtom,
  resetAtomsForTestQuestionAtom,
} from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const [questionSelector, fetchQuestionSelector] = useAtom(
    fetchQuestionSelectorAtom
  );
  const [, fetchTranslationSubjectChoice] = useAtom(
    fetchTranslationSubjectChoiceAtom
  );
  const [, resetAtomsForTestQuestion] = useAtom(resetAtomsForTestQuestionAtom);

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();
  const testDetail = useTestDetail();

  // テスト詳細情報を習得していない場合はトップページにリダイレクト
  useEffect(() => {
    if (!testDetail) {
      navigate(`${basePath}/`);
    }
  }, [navigate, testDetail]);

  // 問題番号が変更された場合は、前問題で取得したatomをすべて初期化
  useEffect(() => {
    if (
      testId &&
      questionNumber &&
      questionSelector &&
      questionSelector.questionNumber !== questionNumber
    ) {
      resetAtomsForTestQuestion();
    }
  }, [questionSelector, resetAtomsForTestQuestion, testId, questionNumber]);

  // ページ遷移直後に、問題文・選択肢を1回だけ取得・翻訳
  useEffect(() => {
    if (testId && questionNumber && !questionSelector) {
      (async () => {
        try {
          await fetchQuestionSelector(
            testId,
            questionNumber,
            instance,
            accountInfo
          );
          await fetchTranslationSubjectChoice(instance, accountInfo);
        } catch (e) {
          systemErrorToast(e);
        }
      })();
    }
  }, [
    accountInfo,
    fetchQuestionSelector,
    fetchTranslationSubjectChoice,
    instance,
    questionNumber,
    questionSelector,
    systemErrorToast,
    testId,
  ]);

  // TODO: shadcn/uiのResizableを用いて、テストページの上半分と下半分を可変スクロールにする
  return (
    testId &&
    testDetail && (
      <>
        <TopBar title={`[${testDetail.courseName}] ${testDetail.testName}`} />
        <div className="pt-16 px-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
            {`${questionNumber}問目 (全${testDetail.length}問)`}
          </h3>
          <QuestionSubjects />
        </div>
        <div className="fixed bottom-0 h-[40vh] w-full">
          <ScrollArea className="h-full rounded-md bg-slate-200 dark:bg-slate-800">
            <Selector />
          </ScrollArea>
        </div>
        <div className="fixed bottom-[calc(40vh+1rem)] right-4 flex flex-col space-y-4">
          <SubmitButton />
          <OpenExplanationButton />
          <NextQuestionButton />
        </div>
      </>
    )
  );
}
