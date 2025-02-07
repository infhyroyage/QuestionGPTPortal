import { fetchTestDetailsAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { Progress } from "@/types/storage";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト結果ページのコンポーネント
 * @returns テスト結果ページのコンポーネント
 */
export default function TestResultPage() {
  const [testDetails] = useAtom(fetchTestDetailsAtom);

  const { testId } = useParams();

  const navigate = useNavigate();

  // tesiIdでの情報を習得していない場合はテスト準備ページにリダイレクト
  useEffect(() => {
    if (testId && !testDetails[testId]) {
      navigate(`${basePath}/tests/${testId}/ready`);
    }
  }, [navigate, testDetails, testId]);

  // ローカルストレージに保存しているテストの回答履歴を取得して削除
  useEffect(() => {
    const progressStr: string | null = localStorage.getItem("progress");
    if (testId && progressStr) {
      // TODO: テストの回答履歴を画面にレンダリング
      const progress: Progress = JSON.parse(progressStr);
      // const testHistory: ProgressTestHistory = progress[testId];

      // testIdにおけるテストの回答履歴を削除
      delete progress[testId];
      localStorage.setItem("progress", JSON.stringify(progress));
    }
  }, [testId]);

  return <div>TestResultPage {testId}</div>;
}
