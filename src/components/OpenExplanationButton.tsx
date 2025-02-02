import { fetchAnswerExplanationAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { ArrowLeftFromLine } from "lucide-react";
import { useMemo } from "react";
import { Button } from "./ui/button";

/**
 * 解説表示ボタンのコンポーネント
 * @returns 解説表示ボタンのコンポーネント
 */
export default function OpenExplanationButton() {
  const [answerExplanation] = useAtom(fetchAnswerExplanationAtom);

  // 回答・解説を生成していない場合は、解説表示ボタンを非活性とする
  const isDisabledOpenExplanationButton = useMemo<boolean>(
    () => !answerExplanation || !answerExplanation.explanations,
    [answerExplanation]
  );

  return (
    <Button size="icon" disabled={isDisabledOpenExplanationButton}>
      <ArrowLeftFromLine />
    </Button>
  );
}
