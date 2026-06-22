import { fetchAnswerExplanationAtom, fetchProgressesAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { Check, Ellipsis, X } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import Tooltip from "./Tooltip";

/**
 * 別の問題へ遷移するメニューのコンポーネント
 * @returns 別の問題へ遷移するメニューのコンポーネント
 */
export default function ChangeQuestionsMenu() {
  const { histories, order } = useAtomValue(fetchProgressesAtom);
  const answerExplanation = useAtomValue(fetchAnswerExplanationAtom);

  const navigate = useNavigate();
  const { testId, questionNumber } = useParams();

  // 回答・解説が生成中の場合は非活性
  const isDisabled = useMemo(
    () => answerExplanation?.isSubmitting ?? false,
    [answerExplanation],
  );

  // "X問目"のメニューを選択したときの処理
  const onSelectQuestion = useCallback(
    (idx: number) => {
      if (testId && order && !isDisabled) {
        navigate(`/tests/${testId}/questions/${order[idx]}`);
      }
    },
    [testId, order, isDisabled, navigate],
  );

  return (
    questionNumber &&
    histories &&
    order && (
      <Tooltip tip="別の問題へ">
        <div className="dropdown dropdown-end">
          <button
            type="button"
            className="btn btn-outline btn-square size-7"
            disabled={isDisabled}
          >
            <Ellipsis className="size-4" />
          </button>
          <ul className="dropdown-content menu max-h-[75vh] w-max flex-nowrap overflow-x-hidden overflow-y-auto rounded-box bg-base-100 shadow-lg">
            {Array.from(
              { length: Math.min(histories.length + 1, order.length) },
              (_, idx: number) => (
                <li key={idx}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-8 whitespace-nowrap${
                      idx + 1 === Number(questionNumber) ? " menu-active" : ""
                    }`}
                    disabled={isDisabled}
                    onClick={() => onSelectQuestion(idx)}
                  >
                    <span className="text-lg">{`${idx + 1}問目`}</span>
                    {idx < histories.length && histories[idx].isCorrect ? (
                      <Check className="size-6 text-green-500" />
                    ) : idx < histories.length && !histories[idx].isCorrect ? (
                      <X className="size-6 text-red-500" />
                    ) : null}
                  </button>
                </li>
              ),
            )}
          </ul>
        </div>
      </Tooltip>
    )
  );
}
