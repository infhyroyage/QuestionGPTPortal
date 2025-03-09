import { Button } from "@/components/ui/button";
import { toggleDarkModeAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
/**
 * ダークモード切替えボタンのコンポーネント
 * @returns ダークモード切替えボタンのコンポーネント
 */
export default function DarkModeSwitchButton() {
  const [isDarkMode, toggleDarkMode] = useAtom(toggleDarkModeAtom);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="size-7"
          onClick={toggleDarkMode}
          variant="outline"
          size="icon"
        >
          {isDarkMode ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isDarkMode ? "ダークモード" : "ライトモード"}
      </TooltipContent>
    </Tooltip>
  );
}
