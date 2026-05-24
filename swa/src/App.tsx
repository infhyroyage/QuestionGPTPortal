import ApplyMSAL from "@/components/ApplyMSAL";
import { Toaster } from "@/components/Toaster";
import { toggleDarkModeAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

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

  // htmlタグにdaisyUIテーマを反映
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode]);

  return (
    <ApplyMSAL>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary" />
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
      <Toaster />
    </ApplyMSAL>
  );
}
