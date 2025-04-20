import { accessBackend } from "@/lib/backend";
import { GetFavoriteRes, PostFavoriteReq } from "@/types/backend";
import { useMsal } from "@azure/msal-react";
import { Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * お気に入り切替ボタンのコンポーネント
 * @returns お気に入り切替ボタンのコンポーネント
 */
export default function FavoriteButton() {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { testId, questionNumber } = useParams();
  const { instance, accounts } = useMsal();

  // 問題番号変更時にお気に入り状態を取得
  useEffect(() => {
    if (testId && questionNumber) {
      (async () => {
        try {
          setIsLoading(true);
          const response = await accessBackend<GetFavoriteRes>(
            "GET",
            `/tests/${testId}/favorites/${questionNumber}`,
            instance,
            accounts[0] || null
          );
          setIsFavorite(response.isFavorite);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [testId, questionNumber, instance, accounts]);

  // お気に入り状態を切り替える
  const onClick = useCallback(async () => {
    if (testId && questionNumber) {
      try {
        setIsLoading(true);
        const req: PostFavoriteReq = {
          isFavorite: !isFavorite,
        };
        await accessBackend<void, PostFavoriteReq>(
          "POST",
          `/tests/${testId}/favorites/${questionNumber}`,
          instance,
          accounts[0] || null,
          req
        );
        setIsFavorite(!isFavorite);
      } finally {
        setIsLoading(false);
      }
    }
  }, [accounts, instance, isFavorite, questionNumber, testId]);

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
