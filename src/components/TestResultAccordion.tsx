import { accessBackend } from "@/lib/backend";
import { GetFavoritesRes, GetQuestion, Progress } from "@/types/backend";
import { TestResultAccordionProps } from "@/types/props";
import { useAccount, useMsal } from "@azure/msal-react";
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
export default function TestResultAccordion({
  progresses,
}: TestResultAccordionProps) {
  const [openValues, setOpenValues] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<boolean[]>(
    new Array(progresses.length).fill(false)
  );
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean[]>(
    new Array(progresses.length).fill(false)
  );
  const [getQuestions, setGetQuestions] = useState<{
    [key: string]: GetQuestion;
  }>({});

  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  // すべての問題番号のお気に入り状態を取得
  useEffect(() => {
    if (testId) {
      (async () => {
        try {
          setIsLoadingFavorites(new Array(progresses.length).fill(true));

          // [GET] /tests/{testId}/favoritesにアクセスしてお気に入り情報を取得
          const response: GetFavoritesRes =
            await accessBackend<GetFavoritesRes>(
              "GET",
              `/tests/${testId}/favorites`,
              instance,
              accountInfo
            );

          // お気に入り情報を設定して更新
          const newFavorites: boolean[] = new Array(progresses.length).fill(
            false
          );
          for (const item of response) {
            if (
              item.questionNumber > 0 &&
              item.questionNumber <= progresses.length
            ) {
              newFavorites[item.questionNumber - 1] = item.isFavorite;
            }
          }
          setFavorites(newFavorites);
        } finally {
          setIsLoadingFavorites(new Array(progresses.length).fill(false));
        }
      })();
    }
  }, [accountInfo, instance, progresses.length, testId]);

  // i番目(0スタート)の問題のお気に入り切替ボタンのお気に入り状態変更時の動作
  const handleFavoriteChange = useCallback(
    (i: number, newIsFavorite: boolean) =>
      setFavorites((prev) => {
        const newFavorites = [...prev];
        newFavorites[i] = newIsFavorite;
        return newFavorites;
      }),
    []
  );

  // i番目(0スタート)の問題のお気に入り切替ボタンのローディング状態変更時の動作
  const handleLoadingChange = useCallback(
    (i: number, newIsLoading: boolean) =>
      setIsLoadingFavorites((prev) => {
        const newIsLoadingFavorites = [...prev];
        newIsLoadingFavorites[i] = newIsLoading;
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
    <Accordion
      type="multiple"
      value={openValues}
      onValueChange={handleValueChange}
    >
      {progresses.map((progress: Progress, i: number) => (
        <AccordionItem key={i} value={`${i}`}>
          <div className="flex items-center">
            <div className="pl-4 flex items-center">
              <FavoriteButton
                isFavorite={favorites[i]}
                isLoading={isLoadingFavorites[i]}
                onFavoriteChange={(newIsFavorite: boolean) =>
                  handleFavoriteChange(i, newIsFavorite)
                }
                onLoadingChange={(newIsLoading: boolean) =>
                  handleLoadingChange(i, newIsLoading)
                }
                questionNumber={String(i + 1)}
              />
            </div>
            <div className="flex-1">
              <AccordionTrigger className="px-4">
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                  {`${i + 1}問目`}
                </h4>
                <div className="transform-none">
                  {progress.isCorrect ? (
                    <Check className="size-7 text-green-500" />
                  ) : (
                    <X className="size-7 text-red-500" />
                  )}
                </div>
              </AccordionTrigger>
            </div>
          </div>
          <TestResultAccordionContent
            progress={progress}
            getQuestion={getQuestions[`${i}`]}
          />
        </AccordionItem>
      ))}
    </Accordion>
  );
}
