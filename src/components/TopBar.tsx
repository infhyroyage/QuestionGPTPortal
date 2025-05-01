import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { GetFavoriteRes } from "@/types/backend";
import { TopBarProps } from "@/types/props";
import { useAccount, useMsal } from "@azure/msal-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import DarkModeSwitchButton from "./DarkModeSwitchButton";
import FavoriteButton from "./FavoriteButton";
import ReturnRootPageButton from "./ReturnRootPageButton";

/**
 * トップバーのコンポーネント
 * @returns トップバーのコンポーネント
 */
export default function TopBar({ title }: TopBarProps) {
  const [isFavorite, setIsFavorite] = useState<boolean | undefined>(undefined);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);

  const location = useLocation();
  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // TestQuestionPageから表示する場合はtrue、それ以外で表示する場合はfalse
  const isTestQuestionPage = useMemo(
    () =>
      testId &&
      questionNumber &&
      location.pathname ===
        `${basePath}/tests/${testId}/questions/${questionNumber}`,
    [location.pathname, questionNumber, testId]
  );

  // 問題番号変更時にお気に入り状態を初期化
  useEffect(() => {
    if (questionNumber) {
      setIsFavorite(undefined);
    }
  }, [questionNumber]);

  // 問題番号変更時にお気に入り状態を取得
  useEffect(() => {
    if (
      testId &&
      isTestQuestionPage &&
      questionNumber &&
      isFavorite === undefined &&
      !isOccurredSystemError
    ) {
      (async () => {
        try {
          const response = await accessBackend<GetFavoriteRes>(
            "GET",
            `/tests/${testId}/favorites/${questionNumber}`,
            instance,
            accountInfo
          );
          setIsFavorite(response.isFavorite);
        } catch (e) {
          setIsOccurredSystemError(true);
          systemErrorToast(e);
        }
      })();
    }
  }, [
    accountInfo,
    instance,
    isFavorite,
    isTestQuestionPage,
    questionNumber,
    testId,
    isOccurredSystemError,
    systemErrorToast,
  ]);

  // お気に入り切替ボタンのお気に入り状態変更時の動作
  const onFavoriteChange = useCallback((newIsFavorite: boolean) => {
    setIsFavorite(newIsFavorite);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[52px] p-3 bg-slate-200 dark:bg-slate-800 z-10">
      <div className="mx-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-bold">{title}</h1>
          {isTestQuestionPage && questionNumber && (
            <div className="ml-2 flex items-center justify-center">
              <FavoriteButton
                isFavorite={isFavorite || false}
                isLoading={isFavorite === undefined}
                onFavoriteChange={onFavoriteChange}
                questionNumber={questionNumber}
              />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {location.pathname !== `${basePath}/` && <ReturnRootPageButton />}
          <DarkModeSwitchButton />
        </div>
      </div>
    </div>
  );
}
