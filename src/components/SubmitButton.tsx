import { Button } from "@/components/ui/button";
import { fetchQuestionSelectorAtom } from "@/lib/atoms";
import { Selector } from "@/types/atoms";
import { useAtom } from "jotai";
import { SendHorizontal } from "lucide-react";
import { useMemo } from "react";

/**
 * 回答・解説生成ボタンのコンポーネント
 * @returns 回答・解説生成ボタンのコンポーネント
 */
export default function SubmitButton() {
  const [questionSelector] = useAtom(fetchQuestionSelectorAtom);

  // 選択肢を取得し、選択肢のいずれかが選択されている場合は送信ボタンを活性状態とする
  const isDisabledSubmitButton = useMemo<boolean>(
    () =>
      !(
        questionSelector &&
        questionSelector.choices.some((choice: Selector) => choice.isSelected)
      ),
    [questionSelector]
  );

  return (
    <Button
      className="fixed bottom-[calc(40vh+1rem)] right-4"
      size="icon"
      disabled={isDisabledSubmitButton}
      // onClick={onClickSubmit} // TODO: 回答・解説生成ボタンのクリック時の処理を実装
    >
      <SendHorizontal />
    </Button>
  );
}
