import { basePath } from "@/lib/github";
import { TopBarProps } from "@/types/props";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router";
import DarkModeSwitchButton from "./DarkModeSwitchButton";
import FavoriteButton from "./FavoriteButton";
import ReturnRootPageButton from "./ReturnRootPageButton";

/**
 * トップバーのコンポーネント
 * @returns トップバーのコンポーネント
 */
export default function TopBar({ title }: TopBarProps) {
  const location = useLocation();
  const { testId, questionNumber } = useParams();

  // TestQuestionPageから表示する場合はtrue、それ以外で表示する場合はfalse
  const isTestQuestionPage = useMemo(
    () =>
      testId &&
      questionNumber &&
      location.pathname ===
        `${basePath}/tests/${testId}/questions/${questionNumber}`,
    [location.pathname, questionNumber, testId]
  );

  return (
    <div className="fixed top-0 left-0 right-0 h-[52px] p-3 bg-slate-200 dark:bg-slate-800 z-10">
      <div className="mx-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-bold">{title}</h1>
          {isTestQuestionPage && (
            <div className="ml-2 flex items-center justify-center">
              <FavoriteButton />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {location.pathname !== `${basePath}/` && <ReturnRootPageButton />}
          <DarkModeSwitchButton />
        </div>
      </div>
    </div>
  );
}
