import { fetchQuestionSelectorAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import NextQuestionButton from "./NextQuestionButton";
import OpenExplanationButton from "./OpenExplanationButton";
import ResubmitButton from "./ResubmitButton";
import SubmitButton from "./SubmitButton";

/**
 * TestQuestionPageのアイコンボタン群を配置するコンテナ
 * @returns TestQuestionPageのアイコンボタン群を配置するコンテナ
 */
export default function IconButtonsContainer() {
  const questionSelector = useAtomValue(fetchQuestionSelectorAtom);

  // 選択肢がいずれも選択していない場合は、アイコンボタン群を表示しない
  const isHidden = useMemo<boolean>(
    () =>
      !questionSelector ||
      questionSelector.choices.every((choice) => !choice.isSelected),
    [questionSelector]
  );

  return (
    <div
      className={`space-x-4 absolute right-4 transition-all duration-300 ease-in-out ${
        isHidden ? "translate-y-20 opacity-0" : "bottom-4 opacity-100"
      }
      `}
    >
      <SubmitButton />
      <ResubmitButton />
      <OpenExplanationButton />
      <NextQuestionButton />
    </div>
  );
}
