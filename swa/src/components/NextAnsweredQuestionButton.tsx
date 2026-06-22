import { fetchAnswerExplanationAtom, fetchProgressesAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { ChevronRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import Tooltip from "./Tooltip";

/**
 * 現在表示している問題に対し、1つ後の回答済みの問題番号に遷移するボタンのコンポーネント
 * @returns 現在表示している問題に対し、1つ後の回答済みの問題番号に遷移するボタンのコンポーネント
 */
export default function NextAnsweredQuestionButton() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();

  // 現在の問題がorderの何番目かを取得
  const currentIdx = useMemo(() => {
    if (!order || !questionNumber) return -1;
    return order.indexOf(parseInt(questionNumber));
  }, [order, questionNumber]);

  // 以下のいずれかの場合は非活性
  // - 現在の問題が最新の未回答問題(またはそれ以降)の場合
  // - 現在の問題が最後の問題の場合(次の問題が存在しない)
  // - 回答・解説が生成中の場合
  const isDisabled = useMemo(
    () =>
      !histories ||
      !order ||
      currentIdx === -1 ||
      currentIdx + 1 >= order.length ||
      currentIdx >= histories.length ||
      (answerExplanation?.isSubmitting ?? false),
    [histories, order, currentIdx, answerExplanation],
  );

  // ボタン押下時に1つ後の問題に遷移
  const onClick = useCallback(() => {
    if (
      testId &&
      order &&
      histories &&
      currentIdx !== -1 &&
      currentIdx < histories.length &&
      currentIdx + 1 < order.length
    ) {
      navigate(`/tests/${testId}/questions/${order[currentIdx + 1]}`);
    }
  }, [testId, order, histories, currentIdx, navigate]);

  return (
    <Tooltip tip="次の問題へ">
      <button
        type="button"
        className="btn btn-outline btn-square size-7"
        disabled={isDisabled}
        onClick={onClick}
      >
        <ChevronRight className="size-4" />
      </button>
    </Tooltip>
  );
}
