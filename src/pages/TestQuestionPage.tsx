import IconButtonsContainer from "@/components/IconButtonsContainer";
import Selector from "@/components/Selector";
import SubjectDisplay from "@/components/SubjectDisplay";
import TestQuestionResizableHandle from "@/components/TestQuestionResizableHandle";
import TopBar from "@/components/TopBar";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchAnswerExplanationAtom,
  fetchProgressesAtom,
  fetchQuestionSelectorAtom,
  fetchTranslationSubjectChoiceAtom,
  resetAtomsForTestQuestionAtom,
  restoreSelectedChoicesAtom,
} from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useNavigationType, useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const [questionSelector, fetchQuestionSelector] = useAtom(
    fetchQuestionSelectorAtom
  );
  const [translationSubjectChoice, fetchTranslationSubjectChoice] = useAtom(
    fetchTranslationSubjectChoiceAtom
  );
  const [answerExplanation, setAnswerExplanation] = useAtom(
    fetchAnswerExplanationAtom
  );
  const resetAtomsForTestQuestion = useSetAtom(resetAtomsForTestQuestionAtom);
  const restoreSelectedChoices = useSetAtom(restoreSelectedChoicesAtom);
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);
  const fetchQuestionSelectorCalledRef = useRef<boolean>(false);
  const fetchTranslationSubjectChoiceCalledRef = useRef<boolean>(false);
  const previousQuestionNumberRef = useRef<string | undefined>(undefined);
  const restoredAnswerRef = useRef<boolean>(false);

  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();
  const systemErrorToast = useSystemErrorToast();

  // 問題番号が変更された場合、API呼び出しフラグをリセット
  useEffect(() => {
    if (previousQuestionNumberRef.current !== questionNumber) {
      fetchQuestionSelectorCalledRef.current = false;
      fetchTranslationSubjectChoiceCalledRef.current = false;
      restoredAnswerRef.current = false;
      previousQuestionNumberRef.current = questionNumber;
    }
  }, [questionNumber]);

  // 回答履歴とテストを解く問題番号の順番の整合性が取れない、またはブラウザバックした場合はトップページにリダイレクト
  useEffect(() => {
    if (
      !histories ||
      !order ||
      order.length === 0 ||
      navigationType === "POP"
    ) {
      navigate("/");
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
      !testId ||
      !questionNumber ||
      questionSelector ||
      isOccurredSystemError ||
      fetchQuestionSelectorCalledRef.current
    ) {
      return;
    }
    fetchQuestionSelectorCalledRef.current = true;
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
  }, [
    testId,
    questionNumber,
    questionSelector,
    isOccurredSystemError,
    fetchQuestionSelector,
    instance,
    accountInfo,
    systemErrorToast,
  ]);

  // 問題文・選択肢の取得直後に、回答済み問題の場合は選択肢と回答・解説を復元
  useEffect(() => {
    if (
      !questionNumber ||
      !questionSelector ||
      !histories ||
      !order ||
      restoredAnswerRef.current ||
      answerExplanation // 既に回答・解説が存在する場合はスキップ
    ) {
      return;
    }

    // 現在の問題番号がorderのどのインデックスか取得
    const currentIndex = order.indexOf(parseInt(questionNumber));
    if (currentIndex === -1 || currentIndex >= histories.length) {
      // 回答済みでない場合は何もしない
      return;
    }

    // 回答済み問題の場合、選択肢の選択状態と回答・解説を復元
    restoredAnswerRef.current = true;
    const history = histories[currentIndex];

    // 選択肢の選択状態を復元
    restoreSelectedChoices(history.selectedIdxes);

    // 回答・解説を復元
    const correctFlags = questionSelector.choices.map((_, idx) =>
      history.correctIdxes.includes(idx)
    );

    setAnswerExplanation({
      correctFlags,
      explanations: [], // 解説文は後で取得（必要に応じて）
      isSubmitting: false,
      isCorrect: history.isCorrect,
      correctIdxes: history.correctIdxes,
      isSavedProgress: true,
    });
  }, [
    questionNumber,
    questionSelector,
    histories,
    order,
    answerExplanation,
    setAnswerExplanation,
    restoreSelectedChoices,
  ]);

  // 問題文・選択肢の取得直後に、それらの翻訳文を1度だけ取得
  useEffect(() => {
    if (
      !questionSelector ||
      translationSubjectChoice ||
      isOccurredTranslationFailed ||
      fetchTranslationSubjectChoiceCalledRef.current
    ) {
      return;
    }
    fetchTranslationSubjectChoiceCalledRef.current = true;
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
  }, [
    questionSelector,
    translationSubjectChoice,
    isOccurredTranslationFailed,
    fetchTranslationSubjectChoice,
    instance,
    accountInfo,
    translationFailedToast,
  ]);

  return (
    testId &&
    questionNumber &&
    histories &&
    order && (
      <>
        <TopBar
          title={`${order.indexOf(parseInt(questionNumber)) + 1}問目 (全${
            order.length
          }問)`}
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
                    translationSubjectChoice &&
                    translationSubjectChoice.subjects
                  }
                />
              </div>
              <IconButtonsContainer />
            </div>
          </ResizablePanel>
          <TestQuestionResizableHandle withHandle />
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
