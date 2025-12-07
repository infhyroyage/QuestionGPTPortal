import ApplyMSAL from "@/components/ApplyMSAL";
import { toggleDarkModeAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import NotFoundPage from "./pages/NotFoundPage";
import RootPage from "./pages/RootPage";
import TestQuestionPage from "./pages/TestQuestionPage";
import TestReadyPage from "./pages/TestReadyPage";
import TestResultPage from "./pages/TestResultPage";

/**
 * アプリケーションのエントリーポイント
 * @returns アプリケーションのエントリーポイント
 */
export default function App() {
  const isDarkMode = useAtomValue(toggleDarkModeAtom);

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
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootPage />} />
            <Route path="/tests/:testId">
              <Route path="ready" element={<TestReadyPage />} />
              <Route
                path="questions/:questionNumber"
                element={<TestQuestionPage />}
              />
              <Route path="result" element={<TestResultPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      <Toaster />
    </ApplyMSAL>
  );
}
