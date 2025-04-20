import { accessBackend } from "@/lib/backend";
import { PostFavoriteReq } from "@/types/backend";
import { FavoriteButtonProps } from "@/types/props";
import { useAccount, useMsal } from "@azure/msal-react";
import { Star } from "lucide-react";
import { useCallback } from "react";
import { useParams } from "react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * お気に入り切替ボタンのコンポーネント
 * @returns お気に入り切替ボタンのコンポーネント
 */
export default function FavoriteButton({
  isFavorite,
  isLoading,
  onFavoriteChange,
  onLoadingChange,
  questionNumber,
}: FavoriteButtonProps) {
  const { testId } = useParams();
  const { instance } = useMsal();
  const account = useAccount();

  const onClick = useCallback(async () => {
    if (testId) {
      onLoadingChange(true);

      try {
        // [POST] /tests/{testId}/favorites/{questionNumber}にアクセスして、切替後のお気に入り状態を更新
        const req: PostFavoriteReq = {
          isFavorite: !isFavorite,
        };
        await accessBackend<void, PostFavoriteReq>(
          "POST",
          `/tests/${testId}/favorites/${questionNumber}`,
          instance,
          account,
          req
        );

        onFavoriteChange(!isFavorite);
      } finally {
        onLoadingChange(false);
      }
    }
  }, [
    account,
    instance,
    isFavorite,
    onFavoriteChange,
    onLoadingChange,
    questionNumber,
    testId,
  ]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={`bg-transparent border-none p-0 ml-1 cursor-pointer hover:opacity-80 transition-all duration-300 focus:outline-none ${
            isLoading ? "opacity-50" : ""
          }`}
          onClick={onClick}
          aria-label={isFavorite ? "お気に入り解除" : "お気に入り登録"}
          disabled={isLoading}
        >
          <Star
            className={`size-7 transition-all duration-300 ${
              isLoading
                ? "animate-pulse"
                : isFavorite
                ? "fill-yellow-400 text-yellow-400 scale-110 animate-[bounce_0.3s_ease-in-out]"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            }`}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {isFavorite ? "お気に入り解除" : "お気に入り登録"}
      </TooltipContent>
    </Tooltip>
  );
}
