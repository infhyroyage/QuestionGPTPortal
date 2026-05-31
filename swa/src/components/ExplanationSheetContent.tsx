import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchAnswerExplanationAtom,
  fetchCommunityAtom,
  fetchExplanationsOnlyAtom,
  fetchQuestionSelectorAtom,
  fetchTranslationCommunityAtom,
  fetchTranslationExplanationAtom,
  fetchTranslationSubjectChoiceAtom,
  fetchVotesAtom,
  resetCommunityAtom,
} from "@/lib/atoms";
import { Choice } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Info, RefreshCw } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Button } from "./Button";
import SelectorButton from "./SelectorButton";

/**
 * 解説シートのコンテンツのコンポーネント
 * @returns 解説シートのコンテンツのコンポーネント
 */
export default function ExplanationSheetContent() {
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const [community, fetchCommunity] = useAtom(fetchCommunityAtom);
  const [votes, fetchVotes] = useAtom(fetchVotesAtom);
  const fetchExplanationsOnly = useSetAtom(fetchExplanationsOnlyAtom);
  const questionSelector = useAtomValue(fetchQuestionSelectorAtom);
  const [translationCommunity, fetchTranslationCommunity] = useAtom(
    fetchTranslationCommunityAtom,
  );
  const [translationExplanation, fetchTranslationExplanation] = useAtom(
    fetchTranslationExplanationAtom,
  );
  const translationSubjectChoice = useAtomValue(
    fetchTranslationSubjectChoiceAtom,
  );
  const resetCommunity = useSetAtom(resetCommunityAtom);
  const [translationFailedForQuestion, setTranslationFailedForQuestion] =
    useState<string | null>(null);
  const [systemErrorForQuestion, setSystemErrorForQuestion] = useState<
    string | null
  >(null);
  const fetchCommunityCalledRef = useRef<boolean>(false);
  const fetchExplanationsOnlyCalledRef = useRef<boolean>(false);
  const fetchTranslationExplanationCalledRef = useRef<boolean>(false);
  const fetchTranslationCommunityCalledRef = useRef<boolean>(false);
  const previousQuestionNumberRef = useRef<string | undefined>(undefined);

  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();
  const systemErrorToast = useSystemErrorToast();

  // コミュニティ情報を再取得する関数
  const handleRefreshCommunity = async () => {
    if (
      !testId ||
      !questionNumber ||
      community === undefined ||
      votes === undefined
    ) {
      return;
    }
    try {
      // コミュニティ情報と翻訳をクリア(ローディング表示にするため)
      resetCommunity();
      // コミュニティ情報を再生成(isRefresh: trueでPOSTのみ実行)し、votesを並列取得
      await Promise.all([
        fetchCommunity(testId, questionNumber, instance, accountInfo, true),
        fetchVotes(testId, questionNumber, instance, accountInfo),
      ]);
      // 翻訳も再取得するためにフラグをリセット
      fetchTranslationCommunityCalledRef.current = false;
      // エラーが発生した問題番号をクリア
      setTranslationFailedForQuestion(null);
      setSystemErrorForQuestion(null);
    } catch (e) {
      // エラーが発生した問題番号を設定
      setSystemErrorForQuestion(questionNumber ?? null);
      // システムエラートーストを表示
      systemErrorToast(e);
    }
  };

  // 問題番号が変更された場合、API呼び出しフラグをリセット
  useEffect(() => {
    if (previousQuestionNumberRef.current !== questionNumber) {
      fetchCommunityCalledRef.current = false;
      fetchExplanationsOnlyCalledRef.current = false;
      fetchTranslationExplanationCalledRef.current = false;
      fetchTranslationCommunityCalledRef.current = false;
      previousQuestionNumberRef.current = questionNumber;
    }
  }, [questionNumber]);

  // 解説シートの表示直前に、コミュニティ情報を1度だけ取得
  useEffect(() => {
    if (
      !testId ||
      !questionNumber ||
      community !== undefined ||
      votes !== undefined ||
      systemErrorForQuestion === questionNumber ||
      fetchCommunityCalledRef.current
    ) {
      return;
    }
    fetchCommunityCalledRef.current = true;
    (async () => {
      try {
        await Promise.all([
          fetchCommunity(testId, questionNumber, instance, accountInfo),
          fetchVotes(testId, questionNumber, instance, accountInfo),
        ]);
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
    community,
    votes,
    fetchCommunity,
    fetchVotes,
    instance,
    accountInfo,
    systemErrorForQuestion,
    systemErrorToast,
  ]);

  // 解説がない場合(回答済みの問題に遷移した場合)、解説を取得
  // ただし、以下のいずれかの場合は対象外とする
  // * SubmitButton による回答・解説生成中
  // * 今回のセッションで新規回答した直後
  // * 既に解説が存在する
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

  // 回答・解説の生成/取得直後に、解説の翻訳文を1度だけ取得
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
        translationFailedToast("解説", () =>
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

  // コミュニティ情報の取得直後に、コミュニティ情報の翻訳文を1度だけ取得
  useEffect(() => {
    if (
      !community ||
      translationCommunity ||
      translationFailedForQuestion === questionNumber ||
      fetchTranslationCommunityCalledRef.current
    ) {
      return;
    }
    fetchTranslationCommunityCalledRef.current = true;
    (async () => {
      try {
        await fetchTranslationCommunity(instance, accountInfo);
      } catch {
        // エラーが発生した問題番号を設定
        setTranslationFailedForQuestion(questionNumber ?? null);
        // 翻訳失敗トーストを表示
        translationFailedToast("コミュニティ情報", () =>
          setTranslationFailedForQuestion(null),
        );
      }
    })();
  }, [
    questionNumber,
    community,
    translationCommunity,
    translationFailedForQuestion,
    fetchTranslationCommunity,
    instance,
    accountInfo,
    translationFailedToast,
  ]);

  return (
    questionSelector &&
    answerExplanation &&
    !answerExplanation.isSubmitting && (
      <>
        {answerExplanation.answerKeyPoint && (
          <>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight my-4">
              回答のポイント
            </h4>
            <div className="space-y-1">
              <p className="leading-7">{answerExplanation.answerKeyPoint}</p>
              {translationExplanation &&
              translationExplanation.answerKeyPoint ? (
                <p className="text-sm text-base-content/60">
                  {translationExplanation.answerKeyPoint}
                </p>
              ) : (
                <div className="skeleton h-5 w-full" />
              )}
            </div>
            <div className="divider my-6" />
          </>
        )}
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight my-4">
          選択肢と解説
        </h4>
        <div className="mb-4">
          {questionSelector.choices.map((choice: Choice, idx: number) => (
            <Fragment key={idx}>
              {idx > 0 && <div className="divider my-6" />}
              <div className="space-y-4">
                <SelectorButton
                  className={
                    answerExplanation.correctFlags &&
                    answerExplanation.correctFlags[idx]
                      ? "border-green-500 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900"
                      : "border-red-500 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900"
                  }
                  idx={idx}
                  img={choice.img}
                  sentence={choice.sentence}
                  translation={
                    translationSubjectChoice
                      ? translationSubjectChoice.choices[idx]
                      : null
                  }
                  variant="outline"
                />
                <div key={idx} className="space-y-1 px-4">
                  <p className="leading-7">
                    {answerExplanation.explanations &&
                      answerExplanation.explanations[idx]}
                  </p>
                  {translationExplanation &&
                  translationExplanation.explanations[idx] ? (
                    <p className="text-sm text-base-content/60">
                      {translationExplanation.explanations[idx]}
                    </p>
                  ) : (
                    <div className="skeleton h-5 w-full" />
                  )}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
        <div className="divider my-6" />
        <div className="flex items-center justify-between my-4">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            コミュニティ回答要約
          </h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshCommunity}
            disabled={community === undefined || votes === undefined}
            title="コミュニティ情報を再取得"
          >
            <RefreshCw
              className={
                community === undefined || votes === undefined
                  ? "animate-spin"
                  : ""
              }
              size={20}
            />
          </Button>
        </div>
        {community === undefined || votes === undefined ? (
          <>
            <div className="space-y-1">
              <div className="skeleton h-7 w-full" />
              <div className="skeleton h-5 w-full" />
            </div>
          </>
        ) : votes.length === 0 && !community.discussionsSummary ? (
          <div className="flex items-center justify-center flex-col space-y-4">
            <Info size={50} />
            <div>コミュニティ回答要約はありません</div>
          </div>
        ) : (
          <>
            {votes.length > 0 && (
              <div className="flex space-x-4 mb-4">
                {votes.map((vote: string, idx: number) => (
                  <span key={idx} className="badge badge-neutral">
                    {vote}
                  </span>
                ))}
              </div>
            )}
            {community.discussionsSummary && (
              <div className="space-y-1">
                <p className="leading-7">{community.discussionsSummary}</p>
                {translationCommunity &&
                translationCommunity.discussionsSummary ? (
                  <p className="text-sm text-base-content/60">
                    {translationCommunity.discussionsSummary}
                  </p>
                ) : (
                  <div className="skeleton h-5 w-full" />
                )}
              </div>
            )}
          </>
        )}
      </>
    )
  );
}
