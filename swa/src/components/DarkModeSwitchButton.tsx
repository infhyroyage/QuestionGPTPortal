import { toggleDarkModeAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { Moon, Sun } from "lucide-react";
import Tooltip from "./Tooltip";

/**
 * ダークモード切替えボタンのコンポーネント
 * @returns ダークモード切替えボタンのコンポーネント
 */
export default function DarkModeSwitchButton() {
  const [isDarkMode, toggleDarkMode] = useAtom(toggleDarkModeAtom);

  return (
    <Tooltip tip={isDarkMode ? "ダークモード" : "ライトモード"}>
      <button
        type="button"
        className="btn btn-outline btn-square size-7"
        onClick={toggleDarkMode}
      >
        {isDarkMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </button>
    </Tooltip>
  );
}
