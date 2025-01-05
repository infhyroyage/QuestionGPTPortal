import { Button } from "@/components/ui/button";
import { toggleDarkModeAtom } from "@/services/atoms";
import { useAtom } from "jotai";
import { Moon, Sun } from "lucide-react";

/**
 * ダークモード切替えボタンのコンポーネント
 * @returns ダークモード切替えボタンのコンポーネント
 */
export default function DarkModeSwitch() {
  const [isDarkMode, toggleDarkMode] = useAtom(toggleDarkModeAtom);

  return (
    <Button onClick={toggleDarkMode}>{isDarkMode ? <Moon /> : <Sun />}</Button>
  );
}
