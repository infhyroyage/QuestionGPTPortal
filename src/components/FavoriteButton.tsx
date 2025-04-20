import { Star } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * お気に入り切替ボタンのコンポーネント
 * @returns お気に入り切替ボタンのコンポーネント
 */
export default function FavoriteButton() {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="bg-transparent border-none p-0 ml-1 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
          onClick={() => setIsFavorite(!isFavorite)}
          aria-label={isFavorite ? "お気に入り解除" : "お気に入り登録"}
        >
          <Star
            className={`size-7 ${
              isFavorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            } transition-colors`}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {isFavorite ? "お気に入り解除" : "お気に入り登録"}
      </TooltipContent>
    </Tooltip>
  );
}
