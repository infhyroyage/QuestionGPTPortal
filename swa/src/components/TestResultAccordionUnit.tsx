import { TestResultAccordionUnitProps } from "@/types/props";
import { Check, ChevronDown, X } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import TestResultAccordionUnitContent from "./TestResultAccordionUnitContent";

/**
 * テスト結果アコーディオンの行単位のコンポーネント
 * @returns テスト結果アコーディオンの行単位のコンポーネント
 */
export default function TestResultAccordionUnit({
  getQuestion,
  history,
  historyIdx,
  questionNumber,
  isFavorite,
  isOpen,
  isLoadingFavoriteButton,
  onFavoriteChange,
  onToggle,
}: TestResultAccordionUnitProps) {
  return (
    <div className="collapse border-b border-base-300">
      <input
        type="checkbox"
        className="peer"
        checked={isOpen}
        onChange={(e) => onToggle(`${historyIdx}`, e.target.checked)}
      />
      <div className="collapse-title flex min-h-0 items-center p-0">
        <div
          className="flex items-center pl-4"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <FavoriteButton
            isFavorite={isFavorite}
            isLoading={isLoadingFavoriteButton}
            onFavoriteChange={(newIsFavorite: boolean) =>
              onFavoriteChange(historyIdx, newIsFavorite)
            }
            questionNumber={questionNumber}
          />
        </div>
        <div className="flex flex-1 items-center justify-between px-4 py-4">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            {`${historyIdx + 1}問目`}
          </h4>
          <div className="flex items-center gap-4">
            <div className="transform-none">
              {history.isCorrect ? (
                <Check className="size-7 text-green-500" />
              ) : (
                <X className="size-7 text-red-500" />
              )}
            </div>
            <ChevronDown
              className={`size-4 shrink-0 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </div>
      <TestResultAccordionUnitContent
        getQuestion={getQuestion}
        history={history}
      />
    </div>
  );
}
