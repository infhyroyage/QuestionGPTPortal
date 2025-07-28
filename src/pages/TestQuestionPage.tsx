import IconButtonsContainer from "@/components/IconButtonsContainer";
import Selector from "@/components/Selector";
import SubjectDisplay from "@/components/SubjectDisplay";
import TopBar from "@/components/TopBar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchAnswerExplanationAtom,
  fetchProgressesAtom,
  fetchQuestionSelectorAtom,
  resetAtomsForTestQuestionAtom,
} from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate, useNavigationType, useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const [questionSelector, fetchQuestionSelector] = useAtom(
    fetchQuestionSelectorAtom
  );
  const resetAtomsForTestQuestion = useSetAtom(resetAtomsForTestQuestionAtom);
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);

  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();
  const systemErrorToast = useSystemErrorToast();

  // 回答履歴とテストを解く問題番号の順番の整合性が取れない、またはブラウザバックした場合はトップページにリダイレクト
  useEffect(() => {
    if (
      !histories ||
      !order ||
      order.length === 0 ||
      navigationType === "POP"
    ) {
      navigate(`${basePath}/`);
    }
  }, [histories, navigate, navigationType, order]);

  // 最初の問題開始時、および問題番号を変更した場合、
  // 前問題の問題文・選択肢・回答・解説文・翻訳文のatomをすべて初期化
  useEffect(() => {
    if (
      questionNumber &&
      questionSelector &&
      questionSelector.questionNumber !== questionNumber
    ) {
      resetAtomsForTestQuestion();
    }
  }, [questionSelector, resetAtomsForTestQuestion, questionNumber]);

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
      !questionSelector.translatedSubjects &&
      !questionSelector.translatedChoices &&
      !isOccurredTranslationFailed
    ) {
      (async () => {
        try {
          await fetchQuestionSelector(testId!, questionNumber!, instance, accountInfo, true);
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
    fetchQuestionSelector,
    instance,
    isOccurredTranslationFailed,
    questionNumber,
    questionSelector,
    testId,
    translationFailedToast,
  ]);

  return (
    testId &&
    histories &&
    order && (
      <>
        <TopBar
          title={`${
            answerExplanation && answerExplanation.isSavedProgress
              ? histories.length
              : histories.length + 1
          }問目 (全${order.length}問)`}
        />
        <ResizablePanelGroup
          direction="vertical"
          className="pt-[52px] min-h-screen w-full"
        >
          <ResizablePanel defaultSize={60}>
            <div className="relative h-full">
              <div className="p-4 h-full min-h-0 overflow-y-auto">
                <SubjectDisplay
                  subjects={questionSelector && questionSelector.subjects}
                  translation={
                    questionSelector &&
                    questionSelector.translatedSubjects
                  }
                />
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
