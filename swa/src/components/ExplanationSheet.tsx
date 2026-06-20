import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchAnswerExplanationAtom,
  fetchDiscussionAtom,
  fetchExplanationsOnlyAtom,
  fetchTranslationDiscussionAtom,
  fetchTranslationExplanationAtom,
  fetchVotesAtom,
} from "@/lib/atoms";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import ExplanationSheetAnswerKeyPoint from "./ExplanationSheetAnswerKeyPoint";
import ExplanationSheetCommunity from "./ExplanationSheetCommunity";
import ExplanationSheetSelector from "./ExplanationSheetSelector";

/**
 * 解説シートのコンポーネント
 * @returns 解説シートのコンポーネント
 */
export default function ExplanationSheet() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const [discussion, fetchDiscussion] = useAtom(fetchDiscussionAtom);
  const [votes, fetchVotes] = useAtom(fetchVotesAtom);
  const [translationDiscussion, fetchTranslationDiscussion] = useAtom(
    fetchTranslationDiscussionAtom,
  );
  const [translationExplanation, fetchTranslationExplanation] = useAtom(
    fetchTranslationExplanationAtom,
  );
  const fetchExplanationsOnly = useSetAtom(fetchExplanationsOnlyAtom);

  const [translationFailedForQuestion, setTranslationFailedForQuestion] =
    useState<string | null>(null);
  const [systemErrorForQuestion, setSystemErrorForQuestion] = useState<
    string | null
  >(null);

  const fetchDiscussionCalledRef = useRef<boolean>(false);
  const fetchExplanationsOnlyCalledRef = useRef<boolean>(false);
  const fetchTranslationExplanationCalledRef = useRef<boolean>(false);
  const fetchTranslationDiscussionCalledRef = useRef<boolean>(false);
  const fetchVotesCalledRef = useRef<boolean>(false);
  const previousQuestionNumberRef = useRef<string | undefined>(undefined);

  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();
  const systemErrorToast = useSystemErrorToast();

  // 問題番号が変更された場合、API呼び出しフラグをリセット
  useEffect(() => {
    if (previousQuestionNumberRef.current !== questionNumber) {
      fetchDiscussionCalledRef.current = false;
      fetchExplanationsOnlyCalledRef.current = false;
      fetchTranslationExplanationCalledRef.current = false;
      fetchTranslationDiscussionCalledRef.current = false;
      fetchVotesCalledRef.current = false;
      previousQuestionNumberRef.current = questionNumber;
    }
  }, [questionNumber]);

  // 解説文・回答のポイントがない場合(回答済みの問題に遷移した場合)、解説文・回答のポイントを取得
  // ただし、以下のいずれかの場合は対象外とする
  // * SubmitButtonによる正解・解説文・回答のポイントの生成中
  // * 今回のセッションで正解・解説文・回答のポイントを新規回答した直後
  // * 既に解説文・回答のポイントが存在する
  useEffect(() => {
    if (
      !testId ||
      !questionNumber ||
      !answerExplanation ||
      answerExplanation.isSubmitting ||
      !answerExplanation.isSavedProgress ||
      answerExplanation.explanations ||
      systemErrorForQuestion === questionNumber ||
      fetchExplanationsOnlyCalledRef.current
    ) {
      return;
    }
    fetchExplanationsOnlyCalledRef.current = true;
    (async () => {
      try {
        await fetchExplanationsOnly(
          testId,
          questionNumber,
          instance,
          accountInfo,
        );
      } catch (e) {
        // エラーが発生した問題番号を設定
        setSystemErrorForQuestion(questionNumber);
        // システムエラートーストを表示
        systemErrorToast(e);
      }
    })();
  }, [
    testId,
    questionNumber,
    answerExplanation,
    fetchExplanationsOnly,
    instance,
    accountInfo,
    systemErrorForQuestion,
    systemErrorToast,
  ]);

  // 正解・解説文・回答のポイントの生成/取得直後に、解説文・回答のポイントの翻訳文を1度だけ取得
  useEffect(() => {
    if (
      !answerExplanation ||
      !answerExplanation.explanations ||
      translationExplanation ||
      translationFailedForQuestion === questionNumber ||
      fetchTranslationExplanationCalledRef.current
    ) {
      return;
    }
    fetchTranslationExplanationCalledRef.current = true;
    (async () => {
      try {
        await fetchTranslationExplanation(instance, accountInfo);
      } catch {
        // エラーが発生した問題番号を設定
        setTranslationFailedForQuestion(questionNumber ?? null);
        // 翻訳失敗トーストを表示
        translationFailedToast("解説文・回答のポイント", () =>
          setTranslationFailedForQuestion(null),
        );
      }
    })();
  }, [
    questionNumber,
    answerExplanation,
    translationExplanation,
    translationFailedForQuestion,
    fetchTranslationExplanation,
    instance,
    accountInfo,
    translationFailedToast,
  ]);

  // 解説シートの表示直前に、コミュニティでのディスカッションの要約を1度だけ取得
  useEffect(() => {
    // コミュニティでのディスカッションの要約の再取得時によってクリアする際に、このuseEffectが再発火してしまうため、
    // 既にコミュニティでのディスカッションの要約が存在する場合は取得済みとして記録して何もしないようにする
    if (discussion !== undefined) {
      fetchDiscussionCalledRef.current = true;
      return;
    }

    if (
      !testId ||
      !questionNumber ||
      systemErrorForQuestion === questionNumber ||
      fetchDiscussionCalledRef.current
    ) {
      return;
    }

    fetchDiscussionCalledRef.current = true;
    (async () => {
      try {
        await fetchDiscussion(testId, questionNumber, instance, accountInfo);
      } catch (e) {
        // エラーが発生した問題番号を設定
        setSystemErrorForQuestion(questionNumber);
        // システムエラートーストを表示
        systemErrorToast(e);
      }
    })();
  }, [
    testId,
    questionNumber,
    discussion,
    fetchDiscussion,
    instance,
    accountInfo,
    systemErrorForQuestion,
    systemErrorToast,
  ]);

  // 解説シートの表示直前に、コミュニティでの回答の割合を1度だけ取得
  useEffect(() => {
    if (
      !testId ||
      !questionNumber ||
      votes !== undefined ||
      systemErrorForQuestion === questionNumber ||
      fetchVotesCalledRef.current
    ) {
      return;
    }
    fetchVotesCalledRef.current = true;
    (async () => {
      try {
        await fetchVotes(testId, questionNumber, instance, accountInfo);
      } catch (e) {
        // エラーが発生した問題番号を設定
        setSystemErrorForQuestion(questionNumber);
        // システムエラートーストを表示
        systemErrorToast(e);
      }
    })();
  }, [
    testId,
    questionNumber,
    votes,
    fetchVotes,
    instance,
    accountInfo,
    systemErrorForQuestion,
    systemErrorToast,
  ]);

  // コミュニティでのディスカッションの要約の取得直後に、コミュニティでのディスカッションの要約の翻訳文を1度だけ取得
  useEffect(() => {
    if (
      !discussion ||
      translationDiscussion ||
      translationFailedForQuestion === questionNumber ||
      fetchTranslationDiscussionCalledRef.current
    ) {
      return;
    }
    fetchTranslationDiscussionCalledRef.current = true;
    (async () => {
      try {
        await fetchTranslationDiscussion(instance, accountInfo);
      } catch {
        // エラーが発生した問題番号を設定
        setTranslationFailedForQuestion(questionNumber ?? null);
        // 翻訳失敗トーストを表示
        translationFailedToast("コミュニティディスカッション要約", () =>
          setTranslationFailedForQuestion(null),
        );
      }
    })();
  }, [
    questionNumber,
    discussion,
    translationDiscussion,
    translationFailedForQuestion,
    fetchTranslationDiscussion,
    instance,
    accountInfo,
    translationFailedToast,
  ]);

  return (
    answerExplanation &&
    !answerExplanation.isSubmitting && (
      <>
        <ExplanationSheetAnswerKeyPoint />
        <div className="divider my-6" />
        <ExplanationSheetSelector />
        <div className="divider my-6" />
        <ExplanationSheetCommunity
          fetchDiscussionCalledRef={fetchDiscussionCalledRef}
          fetchTranslationDiscussionCalledRef={
            fetchTranslationDiscussionCalledRef
          }
          setSystemErrorForQuestion={setSystemErrorForQuestion}
          setTranslationFailedForQuestion={setTranslationFailedForQuestion}
        />
      </>
    )
  );
}
