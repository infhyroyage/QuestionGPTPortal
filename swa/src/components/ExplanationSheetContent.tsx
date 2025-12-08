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
  resetCommunityAtom,
} from "@/lib/atoms";
import { Choice } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Info, RefreshCw } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import SelectorButton from "./SelectorButton";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";

/**
 * 解説シートのコンテンツのコンポーネント
 * @returns 解説シートのコンテンツのコンポーネント
 */
export default function ExplanationSheetContent() {
  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);
  const [community, fetchCommunity] = useAtom(fetchCommunityAtom);
  const fetchExplanationsOnly = useSetAtom(fetchExplanationsOnlyAtom);
  const questionSelector = useAtomValue(fetchQuestionSelectorAtom);
  const [translationCommunity, fetchTranslationCommunity] = useAtom(
    fetchTranslationCommunityAtom
  );
  const [translationExplanation, fetchTranslationExplanation] = useAtom(
    fetchTranslationExplanationAtom
  );
  const translationSubjectChoice = useAtomValue(
    fetchTranslationSubjectChoiceAtom
  );
  const resetCommunity = useSetAtom(resetCommunityAtom);
  // エラーが発生した問題番号を保持（問題番号が変わると自動的にエラー状態がリセットされる）
  const [translationFailedForQuestion, setTranslationFailedForQuestion] =
    useState<string | null>(null);
  const [systemErrorForQuestion, setSystemErrorForQuestion] = useState<string | null>(null);
  // 現在の問題番号でエラーが発生しているかどうかを判定
  const isOccurredTranslationFailed = translationFailedForQuestion === questionNumber;
  const isOccurredSystemError = systemErrorForQuestion === questionNumber;
  const fetchCommunityCalledRef = useRef<boolean>(false);
  const fetchExplanationsOnlyCalledRef = useRef<boolean>(false);
  const fetchTranslationExplanationCalledRef = useRef<boolean>(false);
  const fetchTranslationCommunityCalledRef = useRef<boolean>(false);
  const previousQuestionNumberRef = useRef<string | undefined>(undefined);

  const translationFailedToast = useTranslationFailedToast();
  const systemErrorToast = useSystemErrorToast();

  // コミュニティ情報を再取得する関数
  const handleRefreshCommunity = async () => {
    if (!testId || !questionNumber || community === undefined) {
      return;
    }
    try {
      // コミュニティ情報と翻訳をクリア(ローディング表示にするため)
      resetCommunity();
      // コミュニティ情報を再生成(isRefresh: trueでPOSTのみ実行)
      await fetchCommunity(testId, questionNumber, instance, accountInfo, true);
      // 翻訳も再取得するためにフラグをリセット
      fetchTranslationCommunityCalledRef.current = false;
      setTranslationFailedForQuestion(null);
    } catch (e) {
      setSystemErrorForQuestion(questionNumber ?? null);
      systemErrorToast(e);
    }
  };

  // 問題番号が変更された場合、API呼び出しフラグをリセット
  // （エラーフラグは問題番号ベースで管理しているため、自動的にリセットされる）
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
      community ||
      isOccurredSystemError ||
      fetchCommunityCalledRef.current
    ) {
      return;
    }
    fetchCommunityCalledRef.current = true;
    (async () => {
      try {
        await fetchCommunity(testId, questionNumber, instance, accountInfo);
      } catch (e) {
        setSystemErrorForQuestion(questionNumber);
        systemErrorToast(e);
      }
    })();
  }, [
    testId,
    questionNumber,
    community,
    isOccurredSystemError,
    fetchCommunity,
    instance,
    accountInfo,
    systemErrorToast,
  ]);

  // 解説がない場合(回答済みの問題に遷移した場合)、解説を取得
  useEffect(() => {
    if (
      !testId ||
      !questionNumber ||
      !answerExplanation ||
      answerExplanation.explanations ||
      isOccurredSystemError ||
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
          accountInfo
        );
      } catch (e) {
        setSystemErrorForQuestion(questionNumber);
        systemErrorToast(e);
      }
    })();
  }, [
    testId,
    questionNumber,
    answerExplanation,
    isOccurredSystemError,
    fetchExplanationsOnly,
    instance,
    accountInfo,
    systemErrorToast,
  ]);

  // 回答・解説の生成/取得直後に、解説の翻訳文を1度だけ取得
  useEffect(() => {
    if (
      !answerExplanation ||
      !answerExplanation.explanations ||
      translationExplanation ||
      isOccurredTranslationFailed ||
      fetchTranslationExplanationCalledRef.current
    ) {
      return;
    }
    fetchTranslationExplanationCalledRef.current = true;
    (async () => {
      try {
        await fetchTranslationExplanation(instance, accountInfo);
      } catch {
        setTranslationFailedForQuestion(questionNumber ?? null);
        translationFailedToast("解説", () =>
          setTranslationFailedForQuestion(null)
        );
      }
    })();
  }, [
    questionNumber,
    answerExplanation,
    translationExplanation,
    isOccurredTranslationFailed,
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
      isOccurredTranslationFailed ||
      fetchTranslationCommunityCalledRef.current
    ) {
      return;
    }
    fetchTranslationCommunityCalledRef.current = true;
    (async () => {
      try {
        await fetchTranslationCommunity(instance, accountInfo);
      } catch {
        setTranslationFailedForQuestion(questionNumber ?? null);
        translationFailedToast("コミュニティ情報", () =>
          setTranslationFailedForQuestion(null)
        );
      }
    })();
  }, [
    questionNumber,
    community,
    translationCommunity,
    isOccurredTranslationFailed,
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
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight my-4">
          選択肢と解説
        </h4>
        <div className="mb-4">
          {questionSelector.choices.map((choice: Choice, idx: number) => (
            <Fragment key={idx}>
              {idx > 0 && <Separator className="my-6" />}
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
                    <p className="text-sm text-muted-foreground">
                      {translationExplanation.explanations[idx]}
                    </p>
                  ) : (
                    <Skeleton className="h-5 w-full" />
                  )}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
        <Separator className="my-6" />
        <div className="flex items-center justify-between my-4">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            コミュニティ回答要約
          </h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshCommunity}
            disabled={community === undefined}
            title="コミュニティ情報を再取得"
          >
            <RefreshCw
              className={community === undefined ? "animate-spin" : ""}
              size={20}
            />
          </Button>
        </div>
        {community === undefined ? (
          <>
            <div className="space-y-1">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </>
        ) : community.votes === undefined &&
          community.discussionsSummary === undefined ? (
          <div className="flex items-center justify-center flex-col space-y-4">
            <Info size={50} />
            <div>コミュニティ回答要約はありません</div>
          </div>
        ) : (
          <>
            {community.votes && (
              <div className="flex space-x-4 mb-4">
                {community.votes.map((vote: string, idx: number) => (
                  <Badge key={idx}>{vote}</Badge>
                ))}
              </div>
            )}
            {community.discussionsSummary && (
              <div className="space-y-1">
                <p className="leading-7">{community.discussionsSummary}</p>
                {translationCommunity &&
                translationCommunity.discussionsSummary ? (
                  <p className="text-sm text-muted-foreground">
                    {translationCommunity.discussionsSummary}
                  </p>
                ) : (
                  <Skeleton className="h-5 w-full" />
                )}
              </div>
            )}
          </>
        )}
      </>
    )
  );
}
