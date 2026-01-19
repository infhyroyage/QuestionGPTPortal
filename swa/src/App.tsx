import ApplyMSAL from "@/components/ApplyMSAL";
import { toggleDarkModeAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

// ページコンポーネントを動的インポート（コード分割）
const RootPage = lazy(() => import("./pages/RootPage"));
const TestReadyPage = lazy(() => import("./pages/TestReadyPage"));
const TestQuestionPage = lazy(() => import("./pages/TestQuestionPage"));
const TestResultPage = lazy(() => import("./pages/TestResultPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

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
          <Suspense
            fallback={
              <div className="flex h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            }
          >
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      <Toaster />
    </ApplyMSAL>
  );
}
