import useTranslationFailedToast from "@/hooks/useTranslationFailedToast";
import { accessBackend } from "@/lib/backend";
import { Progress, PutEn2JaReq, PutEn2JaRes } from "@/types/backend";
import { TestResultAccordionProps } from "@/types/props";
import { useAccount, useMsal } from "@azure/msal-react";
import { Check, X } from "lucide-react";
import { useCallback, useState } from "react";
import SelectorButton from "./SelectorButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

/**
 * テスト結果アコーディオンのコンポーネント
 * @returns テスト結果アコーディオンのコンポーネント
 */
export default function TestResultAccordion({
  progresses,
}: TestResultAccordionProps) {
  const [openValues, setOpenValues] = useState<string[]>([]);
  const [translations, setTranslations] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [isOccurredTranslationFailed, setIsOccurredTranslationFailed] =
    useState<boolean>(false);

  const { instance } = useMsal();
  const account = useAccount();

  const translationFailedToast = useTranslationFailedToast();

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
            account,
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
      account,
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
          <AccordionTrigger className="px-4">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {`${i + 1}問目`}
            </h4>
            <span>
              {progress.isCorrect ? (
                <Check className="size-7 text-green-500" />
              ) : (
                <X className="size-7 text-red-500" />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="mx-8 my-4 space-y-8">
              <div className="space-y-4">
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  選択した選択肢
                </p>
                <div className="mx-4 space-y-4">
                  {progress.selectedIdxes.map((j: number) => (
                    <SelectorButton
                      key={j}
                      img={progress.choiceImgs[j]}
                      sentence={progress.choiceSentences[j]}
                      translation={
                        translations[`${i}`] && translations[`${i}`][j]
                      }
                      variant="outline"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  正解の選択肢
                </p>
                <div className="mx-4 space-y-4">
                  {progress.correctIdxes.map((j: number) => (
                    <SelectorButton
                      key={j}
                      img={progress.choiceImgs[j]}
                      sentence={progress.choiceSentences[j]}
                      translation={
                        translations[`${i}`] && translations[`${i}`][j]
                      }
                      variant="outline"
                    />
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
