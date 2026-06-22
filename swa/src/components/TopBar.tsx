import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { accessBackend } from "@/lib/backend";
import { GetFavoriteRes } from "@/types/backend";
import { TopBarProps } from "@/types/props";
import { useAccount, useMsal } from "@azure/msal-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";
import ChangeQuestionsMenu from "./ChangeQuestionsMenu";
import DarkModeSwitchButton from "./DarkModeSwitchButton";
import FavoriteButton from "./FavoriteButton";

/**
 * トップバーのコンポーネント
 * @returns トップバーのコンポーネント
 */
export default function TopBar({ title }: TopBarProps) {
  const [isFavorite, setIsFavorite] = useState<boolean | undefined>(undefined);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);
  const fetchFavoriteCalledRef = useRef<boolean>(false);
  const previousQuestionNumberRef = useRef<string | undefined>(undefined);

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
      location.pathname === `/tests/${testId}/questions/${questionNumber}`,
    [location.pathname, questionNumber, testId],
  );

  // 問題番号変更時にお気に入り状態を取得
  useEffect(() => {
    // 問題番号が変更された場合、API呼び出しフラグをリセット
    if (previousQuestionNumberRef.current !== questionNumber) {
      fetchFavoriteCalledRef.current = false;
      previousQuestionNumberRef.current = questionNumber;
    }

    if (
      !testId ||
      !isTestQuestionPage ||
      !questionNumber ||
      isOccurredSystemError ||
      fetchFavoriteCalledRef.current
    ) {
      return;
    }
    fetchFavoriteCalledRef.current = true;
    (async () => {
      try {
        const response = await accessBackend<GetFavoriteRes>(
          "GET",
          `/tests/${testId}/favorites/${questionNumber}`,
          instance,
          accountInfo,
        );
        setIsFavorite(response.isFavorite);
      } catch (e) {
        setIsOccurredSystemError(true);
        systemErrorToast(e);
      }
    })();
  }, [
    testId,
    isTestQuestionPage,
    questionNumber,
    isOccurredSystemError,
    instance,
    accountInfo,
    systemErrorToast,
  ]);

  // お気に入り切替ボタンのお気に入り状態変更時の動作
  const onFavoriteChange = useCallback((newIsFavorite: boolean) => {
    setIsFavorite(newIsFavorite);
  }, []);

  return (
    <div className="navbar fixed top-0 left-0 right-0 z-30 h-[52px] min-h-[52px] items-center bg-base-100 px-4 py-0 shadow-sm">
      <div className="navbar-start flex-1 items-center gap-2">
        <h1 className="m-0 flex h-7 items-center text-lg font-bold leading-none">
          {title}
        </h1>
        {isTestQuestionPage && questionNumber && (
          <div className="flex h-7 items-center">
            <FavoriteButton
              isFavorite={isFavorite || false}
              isLoading={isFavorite === undefined}
              onFavoriteChange={onFavoriteChange}
              questionNumber={questionNumber}
            />
          </div>
        )}
      </div>
      <div className="navbar-end flex-none items-center gap-2">
        {isTestQuestionPage && (
          <div className="flex h-7 items-center">
            <ChangeQuestionsMenu />
          </div>
        )}
        <div className="flex h-7 items-center">
          <DarkModeSwitchButton />
        </div>
      </div>
    </div>
  );
}
