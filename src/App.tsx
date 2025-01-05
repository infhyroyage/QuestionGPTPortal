import ApplyMSAL from "@/components/ApplyMSAL";
import { Button } from "@/components/ui/button";
import { toggleDarkModeAtom } from "@/services/atoms";
import { useAtom } from "jotai";
import { useEffect } from "react";
import TopBar from "./components/TopBar";

/**
 * アプリケーションのエントリーポイント
 * @returns アプリケーションのエントリーポイント
 */
export default function App() {
  const [isDarkMode] = useAtom(toggleDarkModeAtom);

  // htmlタグにダークモード反映
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <ApplyMSAL>
      <TopBar />
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <div>Hello World</div>
        <Button>Click me</Button>
      </div>
    </ApplyMSAL>
  );
}
