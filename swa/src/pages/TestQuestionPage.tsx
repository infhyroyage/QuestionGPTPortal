import IconButtonsContainer from "@/components/IconButtonsContainer";
import Selector from "@/components/Selector";
import SubjectDisplay from "@/components/SubjectDisplay";
import TestQuestionBorderLine from "@/components/TestQuestionBorderLine";
import TopBar from "@/components/TopBar";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchProgressesAtom,
  fetchQuestionSelectorAtom,
  fetchTranslationSubjectChoiceAtom,
  resetAtomsForTestQuestionAtom,
  restoreAnsweredQuestionAtom,
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
    fetchQuestionSelectorAtom,
  );
  const [translationSubjectChoice, fetchTranslationSubjectChoice] = useAtom(
    fetchTranslationSubjectChoiceAtom,
  );
  const resetAtomsForTestQuestion = useSetAtom(resetAtomsForTestQuestionAtom);
  const restoreAnsweredQuestion = useSetAtom(restoreAnsweredQuestionAtom);
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);
  const [subjectHeightPercent, setSubjectHeightPercent] = useState<number>(60);
  const fetchQuestionSelectorCalledRef = useRef<boolean>(false);
  const fetchTranslationSubjectChoiceCalledRef = useRef<boolean>(false);
  const restoreAnsweredQuestionCalledRef = useRef<boolean>(false);
  const previousQuestionNumberRef = useRef<string | undefined>(undefined);

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
      restoreAnsweredQuestionCalledRef.current = false;
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

  // 最初の問題開始時、および問題番号を変更した場合、前問題の以下のatomをすべて初期化
  // * 問題文
  // * 選択肢
  // * 回答・解説文
  // * コミュニティでのディスカッションの要約
  // * コミュニティでの回答の割合
  // * 翻訳文
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
          accountInfo,
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

  // 問題文・選択肢の取得直後に、回答済みの問題の場合は状態を復元
  useEffect(() => {
    if (
      !questionNumber ||
      !questionSelector ||
      questionSelector.questionNumber !== questionNumber || // 問題文・選択肢の取得中
      restoreAnsweredQuestionCalledRef.current
    ) {
      return;
    }
    restoreAnsweredQuestionCalledRef.current = true;
    restoreAnsweredQuestion(questionNumber);
  }, [questionNumber, questionSelector, restoreAnsweredQuestion]);

  // 問題文・選択肢の取得直後に、それらの翻訳文を1度だけ取得
  useEffect(() => {
    if (
      !questionNumber ||
      !questionSelector ||
      questionSelector.questionNumber !== questionNumber || // 問題文・選択肢の取得中
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
          setIsOccurredTranslationFailed(false),
        );
      }
    })();
  }, [
    questionNumber,
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
        <main className="flex h-screen w-full flex-col overflow-hidden pt-[52px]">
          <div
            className="relative z-10 flex min-h-0 flex-col overflow-hidden"
            style={{ height: `${subjectHeightPercent}%` }}
          >
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <SubjectDisplay
                subjects={questionSelector && questionSelector.subjects}
                translation={
                  translationSubjectChoice && translationSubjectChoice.subjects
                }
              />
            </div>
            <IconButtonsContainer />
          </div>
          <TestQuestionBorderLine
            setSubjectHeightPercent={setSubjectHeightPercent}
          />
          <div
            className="min-h-0 overflow-y-auto bg-slate-200 dark:bg-slate-800"
            style={{ height: `${100 - subjectHeightPercent}%` }}
          >
            <Selector />
          </div>
        </main>
      </>
    )
  );
}
