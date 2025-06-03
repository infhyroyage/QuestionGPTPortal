import { basePath } from "@/lib/github";
import { CornerDownLeft } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/**
 * トップページに戻るボタンのコンポーネント
 * @returns トップページに戻るボタンのコンポーネント
 */
export default function ReturnRootPageButton() {
  const navigate = useNavigate();

  const onClick = useCallback(() => {
    navigate(`${basePath}/`);
  }, [navigate]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="size-7"
          onClick={onClick}
          variant="outline"
          size="icon"
        >
          <CornerDownLeft className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        トップページに戻る
      </TooltipContent>
    </Tooltip>
  );
}
