import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import {
  fetchDiscussionAtom,
  fetchTranslationDiscussionAtom,
  resetDiscussionAtom,
} from "@/lib/atoms";
import { ExplanationSheetCommunityProps } from "@/types/props";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useSetAtom } from "jotai";
import { Info, RefreshCw } from "lucide-react";
import { useCallback } from "react";
import { useParams } from "react-router";
import { Button } from "./Button";
import VoteBadges from "./VoteBadges";

/**
 * 解説シートのコミュニティでのディスカッションの要約のコンポーネント
 * @returns 解説シートのコミュニティでのディスカッションの要約のコンポーネント
 */
export default function ExplanationSheetCommunity({
  fetchDiscussionCalledRef,
  fetchTranslationDiscussionCalledRef,
  setSystemErrorForQuestion,
  setTranslationFailedForQuestion,
}: ExplanationSheetCommunityProps) {
  const [discussion, fetchDiscussion] = useAtom(fetchDiscussionAtom);
  const [translationDiscussion, fetchTranslationDiscussion] = useAtom(
    fetchTranslationDiscussionAtom,
  );
  const resetDiscussion = useSetAtom(resetDiscussionAtom);

  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();
  const systemErrorToast = useSystemErrorToast();

  // コミュニティでのディスカッションの要約を再取得する関数
  const handleRefreshDiscussion = useCallback(async () => {
    if (!testId || !questionNumber) {
      return;
    }

    fetchDiscussionCalledRef.current = true;
    fetchTranslationDiscussionCalledRef.current = true;

    // コミュニティでのディスカッションの要約と、その翻訳文をクリア
    resetDiscussion();

    try {
      // コミュニティでのディスカッションの要約を再生成
      await fetchDiscussion(
        testId,
        questionNumber,
        instance,
        accountInfo,
        true,
      );
    } catch (e) {
      // エラーが発生した問題番号を設定
      setSystemErrorForQuestion(questionNumber);
      // システムエラートーストを表示
      systemErrorToast(e);
      return;
    }

    // 再生成したコミニティでのディスカッションの要約に連動した翻訳文を取得
    try {
      await fetchTranslationDiscussion(instance, accountInfo);
    } catch {
      // エラーが発生した問題番号を設定
      setTranslationFailedForQuestion(questionNumber);
      // 翻訳失敗トーストを表示
      translationFailedToast("コミュニティディスカッション要約", () =>
        setTranslationFailedForQuestion(null),
      );
    }
  }, [
    accountInfo,
    fetchDiscussion,
    fetchDiscussionCalledRef,
    fetchTranslationDiscussion,
    fetchTranslationDiscussionCalledRef,
    instance,
    questionNumber,
    resetDiscussion,
    setSystemErrorForQuestion,
    setTranslationFailedForQuestion,
    systemErrorToast,
    testId,
    translationFailedToast,
  ]);

  return (
    <>
      <div className="flex items-center justify-between my-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          コミュニティディスカッション要約
        </h4>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefreshDiscussion}
          disabled={discussion === undefined}
          title="再取得"
        >
          <RefreshCw
            className={discussion === undefined ? "animate-spin" : ""}
            size={20}
          />
        </Button>
      </div>
      <VoteBadges />
      {discussion === undefined ? (
        <>
          <div className="space-y-1">
            <div className="skeleton h-7 w-full" />
            <div className="skeleton h-5 w-full" />
          </div>
        </>
      ) : !discussion.summary ? (
        <div className="flex items-center justify-center flex-col space-y-4">
          <Info size={50} />
          <div>コミュニティディスカッション要約はありません</div>
        </div>
      ) : (
        <>
          {discussion.summary && (
            <div className="space-y-1">
              <p className="leading-7">{discussion.summary}</p>
              {translationDiscussion && translationDiscussion.summary ? (
                <p className="text-sm text-base-content/60">
                  {translationDiscussion.summary}
                </p>
              ) : (
                <div className="skeleton h-5 w-full" />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
