import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { fetchProgressesAtom, initializeProgressesAtom } from "@/lib/atoms";
import { TestReadyButtonsProps } from "@/types/props";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtomValue, useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト準備ページのボタンのコンポーネント
 * @returns テスト準備ページのボタンのコンポーネント
 */
export default function TestReadyButtons({
  favoriteQuestionNumbers,
}: TestReadyButtonsProps) {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const initializeProgresses = useSetAtom(initializeProgressesAtom);
  const [hasOnlyFavorites, setHasOnlyFavorites] = useState<boolean | undefined>(
    undefined,
  );
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);
  const initializeProgressesCalledRef = useRef<boolean>(false);
  const previousHasOnlyFavoritesRef = useRef<boolean | undefined>(undefined);

  const navigate = useNavigate();
  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // hasOnlyFavoritesが変更された場合、API呼び出しフラグをリセット
  useEffect(() => {
    if (previousHasOnlyFavoritesRef.current !== hasOnlyFavorites) {
      initializeProgressesCalledRef.current = false;
      previousHasOnlyFavoritesRef.current = hasOnlyFavorites;
    }
  }, [hasOnlyFavorites]);

  // 開始ボタン押下後、回答履歴とテストを解く問題番号の順番を初期化し、最初の問題番号のテストページへ遷移
  useEffect(() => {
    if (
      !testId ||
      hasOnlyFavorites === undefined ||
      isOccurredSystemError ||
      initializeProgressesCalledRef.current
    ) {
      return;
    }
    initializeProgressesCalledRef.current = true;
    (async () => {
      try {
        const initialQuestionNumber: number | undefined =
          await initializeProgresses(
            testId,
            instance,
            accountInfo,
            hasOnlyFavorites ? favoriteQuestionNumbers : undefined,
          );
        if (initialQuestionNumber) {
          navigate(`/tests/${testId}/questions/${initialQuestionNumber}`);
        }
      } catch (e) {
        setIsOccurredSystemError(true);
        systemErrorToast(e);
      }
    })();
  }, [
    testId,
    hasOnlyFavorites,
    isOccurredSystemError,
    favoriteQuestionNumbers,
    initializeProgresses,
    instance,
    accountInfo,
    navigate,
    systemErrorToast,
  ]);

  // テスト結果ページへ遷移
  const onClickResultButton = useCallback(() => {
    if (testId) {
      navigate(`/tests/${testId}/result`);
    }
  }, [navigate, testId]);

  // 途中の問題のテストページへ遷移
  const onClickResumeButton = useCallback(() => {
    if (testId && histories && order) {
      navigate(`/tests/${testId}/questions/${order[histories.length]}`);
    }
  }, [histories, navigate, order, testId]);

  // トップページへ戻るボタンのクリック時の動作
  const onClickRootPageButton = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    histories &&
    order && (
      <div className="w-full flex flex-col space-y-8">
        {histories.length > 0 &&
        order.length > 0 &&
        histories.length === order.length ? (
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onClickResultButton}
          >
            結果を見る
          </button>
        ) : (
          <>
            {histories.length > 0 && (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                disabled={hasOnlyFavorites !== undefined}
                onClick={onClickResumeButton}
              >
                {hasOnlyFavorites !== undefined ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  `途中の${histories.length + 1}問目から再開`
                )}
              </button>
            )}
            <button
              type="button"
              className={`btn btn-lg ${
                histories.length > 0 ? "btn-error" : "btn-primary"
              }`}
              disabled={hasOnlyFavorites !== undefined}
              onClick={() => setHasOnlyFavorites(false)}
            >
              {hasOnlyFavorites !== undefined ? (
                <Loader2 className="animate-spin" />
              ) : (
                `すべての問題を1問目から開始${
                  histories.length > 0 ? "(回答履歴が削除されます)" : ""
                }`
              )}
            </button>
            {favoriteQuestionNumbers.length > 0 && (
              <button
                type="button"
                className={`btn btn-lg ${
                  histories.length > 0 ? "btn-error" : "btn-primary"
                }`}
                disabled={hasOnlyFavorites !== undefined}
                onClick={() => setHasOnlyFavorites(true)}
              >
                {hasOnlyFavorites !== undefined ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  `お気に入り登録した問題のみ開始${
                    histories.length > 0 ? "(回答履歴が削除されます)" : ""
                  }`
                )}
              </button>
            )}
          </>
        )}
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onClickRootPageButton}
        >
          トップページへ戻る
        </button>
      </div>
    )
  );
}
