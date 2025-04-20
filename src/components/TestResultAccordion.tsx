import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import { accessBackend } from "@/lib/backend";
import {
  GetFavoritesRes,
  Progress,
  PutEn2JaReq,
  PutEn2JaRes,
} from "@/types/backend";
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
  const [translations, setTranslations] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);

  const { testId } = useParams();
  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const translationFailedToast = useTranslationFailedToast();

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

  // 新しく開かれたアコーディオンに対応する選択肢を、翻訳していない場合のみ翻訳
  const handleValueChange = useCallback(
    async (values: string[]) => {
      const newOpenValues = values.filter(
        (value) => !openValues.includes(value)
      );
      for (const value of newOpenValues) {
        // 新しく開かれたアコーディオンに対して、以下の場合は翻訳をスキップ
        // 1. 翻訳文が取得済みの場合
        // 2. 翻訳に失敗した場合
        if (translations[value] || isOccurredTranslationFailed) continue;

        // [PUT] /en2jaにアクセスして取得した選択肢の翻訳文で更新
        try {
          const translatedTexts: PutEn2JaRes = await accessBackend<
            PutEn2JaRes,
            PutEn2JaReq
          >(
            "PUT",
            "/en2ja",
            instance,
            accountInfo,
            progresses[parseInt(value)].choiceSentences
          );

          setTranslations((prev) => ({
            ...prev,
            [value]: translatedTexts,
          }));
        } catch {
          setIsOccurredTranslationFailed(true);
          translationFailedToast("選択肢", () =>
            setIsOccurredTranslationFailed(false)
          );
        }
      }

      setOpenValues(values);
    },
    [
      accountInfo,
      instance,
      isOccurredTranslationFailed,
      openValues,
      progresses,
      translationFailedToast,
      translations,
    ]
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
                {progress.isCorrect ? (
                  <Check className="size-7 text-green-500" />
                ) : (
                  <X className="size-7 text-red-500" />
                )}
              </AccordionTrigger>
            </div>
          </div>
          <TestResultAccordionContent
            progress={progress}
            progressIdx={i}
            translations={translations}
          />
        </AccordionItem>
      ))}
    </Accordion>
  );
}
