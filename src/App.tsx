import ApplyMSAL from "@/components/ApplyMSAL";
import { toggleDarkModeAtom } from "@/services/atoms";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import RootPage from "./pages/RootPage";

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

  // localhost環境以外の場合は、GitHub Pagesでのパスに合わせる
  const basePath: string = import.meta.env.DEV ? "" : "/QuestionGPTPortal";

  return (
    <ApplyMSAL>
      <BrowserRouter>
        <Routes>
          <Route path={`${basePath}/`} element={<RootPage />} />
        </Routes>
      </BrowserRouter>
    </ApplyMSAL>
  );
}
