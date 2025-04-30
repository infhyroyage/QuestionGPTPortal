import { Button } from "@/components/ui/button";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { fetchProgressesAtom, initializeProgressesAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { Favorite, GetFavoritesRes } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト準備ページのボタンのコンポーネント
 * @returns テスト準備ページのボタンのコンポーネント
 */
export default function TestReadyButtons() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const initializeProgresses = useSetAtom(initializeProgressesAtom);
  const [favoriteQuestionNumbers, setFavoriteQuestionNumbers] = useState<
    number[] | undefined
  >(undefined);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);

  const navigate = useNavigate();
  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // すべての問題番号のお気に入り状態を取得
  useEffect(() => {
    if (testId && !favoriteQuestionNumbers && !isOccurredSystemError) {
      (async () => {
        try {
          const res: GetFavoritesRes = await accessBackend<GetFavoritesRes>(
            "GET",
            `/tests/${testId}/favorites`,
            instance,
            accountInfo
          );
          setFavoriteQuestionNumbers(
            res
              .reduce((prev: number[], favorite: Favorite) => {
                if (favorite.isFavorite) {
                  prev.push(favorite.questionNumber);
                }
                return prev;
              }, [])
              .sort((a, b) => a - b) // 問題番号の昇順にソート
          );
        } catch (e) {
          setIsOccurredSystemError(true);
          systemErrorToast(e);
        }
      })();
    }
  }, [
    accountInfo,
    favoriteQuestionNumbers,
    instance,
    isOccurredSystemError,
    systemErrorToast,
    testId,
  ]);

  // テスト結果ページへ遷移
  const onClickResultButton = useCallback(() => {
    if (testId) {
      navigate(`${basePath}/tests/${testId}/result`);
    }
  }, [navigate, testId]);

  // 途中の問題のテストページへ遷移
  const onClickResumeButton = useCallback(() => {
    if (testId && histories && order) {
      navigate(
        `${basePath}/tests/${testId}/questions/${order[histories.length]}`
      );
    }
  }, [histories, navigate, order, testId]);

  // 開始ボタンを押下した際の最初の問題のテストページへ遷移する動作
  const handleClickStartButton = useCallback(
    (isFavorite: boolean) => {
      if (testId && !isOccurredSystemError) {
        // 回答履歴とテストを解く問題番号の順番を初期化し、最初の問題番号のテストページへ遷移
        (async () => {
          try {
            const initialQuestionNumber: number | undefined =
              await initializeProgresses(
                testId,
                instance,
                accountInfo,
                isFavorite ? favoriteQuestionNumbers : undefined
              );
            if (initialQuestionNumber) {
              navigate(
                `${basePath}/tests/${testId}/questions/${initialQuestionNumber}`
              );
            }
          } catch (e) {
            setIsOccurredSystemError(true);
            systemErrorToast(e);
          }
        })();
      }
    },
    [
      accountInfo,
      favoriteQuestionNumbers,
      initializeProgresses,
      instance,
      isOccurredSystemError,
      navigate,
      systemErrorToast,
      testId,
    ]
  );

  return histories &&
    order &&
    histories.length > 0 &&
    order.length > 0 &&
    histories.length === order.length ? (
    <Button onClick={onClickResultButton} size="lg">
      結果を見る
    </Button>
  ) : (
    <>
      {histories && histories.length > 0 && (
        <Button onClick={onClickResumeButton} size="lg">
          {`途中の${histories.length + 1}問目から再開`}
        </Button>
      )}
      <Button
        onClick={() => handleClickStartButton(false)}
        size="lg"
        variant={histories && histories.length > 0 ? "destructive" : "default"}
      >
        {`すべての問題を1問目から開始${
          histories && histories.length > 0 ? "(回答履歴が削除されます)" : ""
        }`}
      </Button>
      {favoriteQuestionNumbers && favoriteQuestionNumbers.length > 0 && (
        <Button
          onClick={() => handleClickStartButton(true)}
          size="lg"
          variant={
            histories && histories.length > 0 ? "destructive" : "default"
          }
        >
          {`お気に入り登録した問題のみ開始${
            histories && histories.length > 0 ? "(回答履歴が削除されます)" : ""
          }`}
        </Button>
      )}
    </>
  );
}
