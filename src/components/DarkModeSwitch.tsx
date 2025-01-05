import { Button } from "@/components/ui/button";
import { toggleDarkModeAtom } from "@/services/atoms";
import { useAtom } from "jotai";
import { Moon, Sun } from "lucide-react";

export default function DarkModeSwitch() {
  const [isDarkMode, toggleDarkMode] = useAtom(toggleDarkModeAtom);

  return (
    <Button onClick={toggleDarkMode}>{isDarkMode ? <Moon /> : <Sun />}</Button>
  );
}
