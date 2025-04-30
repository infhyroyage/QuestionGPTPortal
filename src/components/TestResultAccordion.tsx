import useSystemErrorToast from "@/hooks/useSystemErrorToast";
import { fetchProgressesAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { History } from "@/types/atoms";
import { Favorite, GetFavoritesRes, GetQuestion } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtomValue } from "jotai";
import { Check, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import FavoriteButton from "./FavoriteButton";
import TestResultAccordionContent from "./TestResultAccordionContent";
import { Accordion, AccordionItem, AccordionTrigger } from "./ui/accordion";

/**
 * テスト結果アコーディオンのコンポーネント
 * @returns テスト結果アコーディオンのコンポーネント
 */
export default function TestResultAccordion() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const [openValues, setOpenValues] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<boolean[] | undefined>(undefined);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean[]>([]);
  const [getQuestions, setGetQuestions] = useState<{
    [key: string]: GetQuestion;
  }>({});
  const [isOccurredSystemError, setIsOccurredSystemError] =
    useState<boolean>(false);

  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const systemErrorToast = useSystemErrorToast();

  // すべての問題番号のお気に入り状態を取得
  useEffect(() => {
    if (
      testId &&
      histories &&
      order &&
      favorites === undefined &&
      !isOccurredSystemError
    ) {
      (async () => {
        try {
          setIsLoadingFavorites(new Array(histories.length).fill(true));

          // [GET] /tests/{testId}/favoritesにアクセスしてお気に入り情報を取得
          const res: GetFavoritesRes = await accessBackend<GetFavoritesRes>(
            "GET",
            `/tests/${testId}/favorites`,
            instance,
            accountInfo
          );

          // お気に入り情報を設定して更新
          setFavorites(
            res.reduce((prev: boolean[], favorite: Favorite) => {
              if (favorite.isFavorite) {
                const favoriteIdx = order.findIndex(
                  (order: number) => order === favorite.questionNumber
                );
                if (favoriteIdx !== -1) {
                  prev[favoriteIdx] = true;
                }
              }
              return prev;
            }, new Array(histories.length).fill(false))
          );
        } catch (e) {
          setIsOccurredSystemError(true);
          systemErrorToast(e);
        } finally {
          setIsLoadingFavorites(new Array(histories.length).fill(false));
        }
      })();
    }
  }, [
    accountInfo,
    favorites,
    histories,
    instance,
    isOccurredSystemError,
    order,
    systemErrorToast,
    testId,
  ]);

  // i番目(0スタート)の問題のお気に入り切替ボタンのお気に入り状態変更時の動作
  const handleFavoriteChange = useCallback(
    (favoriteIdx: number, newIsFavorite: boolean) =>
      setFavorites((prev) => {
        if (!prev) {
          return undefined;
        }
        const newFavorites = [...prev];
        newFavorites[favoriteIdx] = newIsFavorite;
        return newFavorites;
      }),
    []
  );

  // i番目(0スタート)の問題のお気に入り切替ボタンのローディング状態変更時の動作
  const handleLoadingChange = useCallback(
    (favoriteIdx: number, newIsLoading: boolean) =>
      setIsLoadingFavorites((prev) => {
        const newIsLoadingFavorites = [...prev];
        newIsLoadingFavorites[favoriteIdx] = newIsLoading;
        return newIsLoadingFavorites;
      }),
    []
  );

  // 新しく開かれたアコーディオンのみに対応する問題文・選択肢を取得
  const handleValueChange = useCallback(
    async (values: string[]) => {
      if (testId) {
        // 問題文・選択肢を取得する前に、アコーディオンを開いておく
        setOpenValues(values);

        // 今まで一度も問題文・選択肢を取得していない場合のみ、
        // [GET] /tests/{testId}/questions/{questionNumber}にアクセスして取得
        const newOpenValues: string[] = values.filter(
          (value) => !openValues.includes(value)
        );
        for (const value of newOpenValues) {
          if (!getQuestions[value]) {
            const res: GetQuestion = await accessBackend<GetQuestion>(
              "GET",
              `/tests/${testId}/questions/${parseInt(value) + 1}`,
              instance,
              accountInfo
            );
            setGetQuestions((prev) => ({
              ...prev,
              [value]: res,
            }));
          }
        }
      }
    },
    [accountInfo, getQuestions, instance, openValues, testId]
  );

  return (
    histories &&
    order && (
      <Accordion
        type="multiple"
        value={openValues}
        onValueChange={handleValueChange}
      >
        {histories.map((history: History, historyIdx: number) => (
          <AccordionItem key={historyIdx} value={`${historyIdx}`}>
            <div className="flex items-center">
              <div className="pl-4 flex items-center">
                <FavoriteButton
                  isFavorite={!!favorites && favorites[historyIdx]}
                  isLoading={isLoadingFavorites[historyIdx]}
                  onFavoriteChange={(newIsFavorite: boolean) =>
                    handleFavoriteChange(historyIdx, newIsFavorite)
                  }
                  onLoadingChange={(newIsLoading: boolean) =>
                    handleLoadingChange(historyIdx, newIsLoading)
                  }
                  questionNumber={String(order[historyIdx])}
                />
              </div>
              <div className="flex-1">
                <AccordionTrigger className="px-4">
                  <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                    {`${historyIdx + 1}問目`}
                  </h4>
                  <div className="transform-none">
                    {history.isCorrect ? (
                      <Check className="size-7 text-green-500" />
                    ) : (
                      <X className="size-7 text-red-500" />
                    )}
                  </div>
                </AccordionTrigger>
              </div>
            </div>
            <TestResultAccordionContent
              getQuestion={getQuestions[`${historyIdx}`]}
              history={history}
            />
          </AccordionItem>
        ))}
      </Accordion>
    )
  );
}
