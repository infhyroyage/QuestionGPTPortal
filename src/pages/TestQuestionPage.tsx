import IconButtonsContainer from "@/components/IconButtonsContainer";
import QuestionSubjects from "@/components/QuestionSubjects";
import Selector from "@/components/Selector";
import TopBar from "@/components/TopBar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTestDetail from "@/hooks/useTestDetail";
import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchQuestionSelectorAtom,
  fetchTranslationSubjectChoiceAtom,
  resetAtomsForTestQuestionAtom,
} from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const [questionSelector, fetchQuestionSelector] = useAtom(
    fetchQuestionSelectorAtom
  );
  const [translationSubjectChoice, fetchTranslationSubjectChoice] = useAtom(
    fetchTranslationSubjectChoiceAtom
  );
  const [, resetAtomsForTestQuestion] = useAtom(resetAtomsForTestQuestionAtom);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();
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

  // ページ遷移直後に、問題文・選択肢を1回だけ取得
  useEffect(() => {
    if (
      testId &&
      questionNumber &&
      !questionSelector &&
      !isOccurredSystemError
    ) {
      (async () => {
        try {
          await fetchQuestionSelector(
            testId,
            questionNumber,
            instance,
            accountInfo
          );
        } catch (e) {
          setIsOccurredSystemError(true);
          systemErrorToast(e);
        }
      })();
    }
  }, [
    accountInfo,
    fetchQuestionSelector,
    instance,
    isOccurredSystemError,
    questionNumber,
    questionSelector,
    systemErrorToast,
    testId,
  ]);

  // 問題文・選択肢の取得直後に、それらの翻訳文を1度だけ取得
  useEffect(() => {
    if (
      questionSelector &&
      !translationSubjectChoice &&
      !isOccurredTranslationFailed
    ) {
      (async () => {
        try {
          await fetchTranslationSubjectChoice(instance, accountInfo);
        } catch {
          setIsOccurredTranslationFailed(true);
          translationFailedToast("問題文・選択肢", () =>
            setIsOccurredTranslationFailed(false)
          );
        }
      })();
    }
  }, [
    accountInfo,
    fetchTranslationSubjectChoice,
    instance,
    isOccurredTranslationFailed,
    questionSelector,
    translationFailedToast,
    translationSubjectChoice,
  ]);

  return (
    testId &&
    testDetail && (
      <>
        <TopBar title={`[${testDetail.courseName}] ${testDetail.testName}`} />
        <ResizablePanelGroup
          direction="vertical"
          className="pt-16 min-h-screen w-full"
        >
          <ResizablePanel defaultSize={60}>
            <div className="relative h-full">
              <div className="h-full min-h-0 overflow-y-auto px-4">
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
                  {`${questionNumber}問目 (全${testDetail.length}問)`}
                </h3>
                <QuestionSubjects />
              </div>
              <IconButtonsContainer />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40}>
            <div className="h-full min-h-0 overflow-y-auto bg-slate-200 dark:bg-slate-800">
              <Selector />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </>
    )
  );
}
