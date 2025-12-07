import TestReadyButtons from "@/components/TestReadyButtons";
import TopBar from "@/components/TopBar";
import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { fetchProgressesAtom, fetchTestDetailsAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { TestDetail } from "@/types/atoms";
import { Favorite, GetFavoritesRes } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom, useAtomValue } from "jotai";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useNavigationType, useParams } from "react-router";

/**
 * テスト準備ページのコンポーネント
 * @returns テスト準備ページのコンポーネント
 */
export default function TestReadyPage() {
  const [{ histories }, fetchProgresses] = useAtom(fetchProgressesAtom);
  const testDetails = useAtomValue(fetchTestDetailsAtom);
  const [favoriteQuestionNumbers, setFavoriteQuestionNumbers] = useState<
    number[] | undefined
  >(undefined);
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);
  const fetchProgressesCalledRef = useRef<boolean>(false);
  const fetchFavoritesCalledRef = useRef<boolean>(false);

  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // テスト詳細情報を取得
  const testDetail = useMemo<TestDetail | undefined>(
    () =>
      testDetails &&
      testDetails.find(
        (testDetail: TestDetail) => testDetail.testId === testId
      ),
    [testDetails, testId]
  );

  // テスト詳細情報が取得できていない、またはブラウザバックした場合はトップページにリダイレクト
  useEffect(() => {
    if (!testDetail || navigationType === "POP") {
      navigate("/");
    }
  }, [navigate, testDetail, navigationType]);

  // 今まで回答した問題の回答履歴とテストを解く問題番号の順番を取得
  useEffect(() => {
    if (
      !testDetail ||
      !testId ||
      histories ||
      isOccurredSystemError ||
      fetchProgressesCalledRef.current
    ) {
      return;
    }
    fetchProgressesCalledRef.current = true;
    (async () => {
      try {
        await fetchProgresses(testId, instance, accountInfo);
      } catch (e) {
        setIsOccurredSystemError(true);
        systemErrorToast(e);
      }
    })();
  }, [
    testDetail,
    testId,
    histories,
    isOccurredSystemError,
    fetchProgresses,
    instance,
    accountInfo,
    systemErrorToast,
  ]);

  // すべての問題番号のお気に入り状態を取得
  useEffect(() => {
    if (
      !testId ||
      favoriteQuestionNumbers ||
      isOccurredSystemError ||
      fetchFavoritesCalledRef.current
    ) {
      return;
    }
    fetchFavoritesCalledRef.current = true;
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
  }, [
    testId,
    favoriteQuestionNumbers,
    isOccurredSystemError,
    instance,
    accountInfo,
    systemErrorToast,
  ]);

  return (
    testId &&
    testDetail && (
      <>
        <TopBar title="Question GPT Portal" />
        <div className="pt-[52px] px-8 flex flex-col h-[calc(100vh-52px)]">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
            {testDetail.courseName}
          </h3>
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight my-6">
            {testDetail.testName}
          </h4>
          <div className="flex-1 flex items-center justify-center">
            {histories && favoriteQuestionNumbers ? (
              <TestReadyButtons
                favoriteQuestionNumbers={favoriteQuestionNumbers}
              />
            ) : (
              <Loader2 size={150} className="animate-spin" />
            )}
          </div>
        </div>
      </>
    )
  );
}
