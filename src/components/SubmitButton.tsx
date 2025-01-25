import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/ui/use-toast";
import { fetchQuestionSelectorAtom, proceedSubmitAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { Selector } from "@/types/atoms";
import { GetAnswer } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { Check, Loader2, SendHorizontal, X } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useParams } from "react-router";

/**
 * 回答・解説生成ボタンのコンポーネント
 * @returns 回答・解説生成ボタンのコンポーネント
 */
export default function SubmitButton() {
  const [submit, proceedSubmit] = useAtom(proceedSubmitAtom);
  const [questionSelector] = useAtom(fetchQuestionSelectorAtom);

  const { testId, questionNumber } = useParams();

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  // 選択肢を取得し、選択肢のいずれかが選択されている場合は回答・解説生成ボタンを活性状態とする
  const isDisabledSubmitButton = useMemo<boolean>(
    () =>
      !(
        questionSelector &&
        questionSelector.choices.some((choice: Selector) => choice.isSelected)
      ),
    [questionSelector]
  );

  // 回答・解説生成ボタン押下時の処理
  const onClickSubmit = useCallback(async () => {
    // 同じ問題に対し、回答・解説の生成は1回のみ
    if (submit !== "NOT_ANSWERED") return;

    proceedSubmit();

    try {
      // [GET] /tests/{testId}/questions/{questionNumber}/answerを実行
      const res: GetAnswer = await accessBackend<GetAnswer>(
        "GET",
        `/tests/${testId}/questions/${questionNumber}/answer`,
        instance,
        accountInfo
      );

      console.log(res); // DEBUG

      proceedSubmit();
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "システムエラーが発生しました",
        description: (
          <>
            <p>以下をシステム管理者にご連絡ください</p>
            <p>{String(e)}</p>
          </>
        ),
      });
    }
  }, [accountInfo, instance, proceedSubmit, questionNumber, submit, testId]);

  return (
    <Button
      className={`fixed bottom-[calc(40vh+1rem)] right-4${
        submit === "CORRECT"
          ? " bg-green-500"
          : submit === "INCORRECT"
          ? " bg-red-500"
          : ""
      }`}
      size="icon"
      disabled={isDisabledSubmitButton}
      onClick={onClickSubmit}
    >
      {submit === "ANSWERING" ? (
        <Loader2 className="animate-spin" />
      ) : submit === "CORRECT" ? (
        <Check />
      ) : submit === "INCORRECT" ? (
        <X />
      ) : (
        <SendHorizontal />
      )}
    </Button>
  );
}
