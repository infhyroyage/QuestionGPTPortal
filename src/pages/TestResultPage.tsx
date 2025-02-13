import TestResultAccordion from "@/components/TestResultAccordion";
import TopBar from "@/components/TopBar";
import { fetchTestDetailsAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { TestDetail } from "@/types/atoms";
import { Progress, ProgressTestHistory } from "@/types/storage";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テスト結果ページのコンポーネント
 * @returns テスト結果ページのコンポーネント
 */
export default function TestResultPage() {
  const [testDetails] = useAtom(fetchTestDetailsAtom);
  const [histories, setHistories] = useState<ProgressTestHistory[]>([]);

  const { testId } = useParams();

  const navigate = useNavigate();

  const testDetail = useMemo<TestDetail | undefined>(
    () =>
      testDetails &&
      testDetails.find(
        (testDetail: TestDetail) => testDetail.testId === testId
      ),
    [testDetails, testId]
  );

  // テスト詳細情報を習得していない場合はトップページにリダイレクト
  useEffect(() => {
    if (!testDetail) {
      navigate(`${basePath}/`);
    }
  }, [navigate, testDetail]);

  // ローカルストレージに保存しているテストの回答履歴を取得
  useEffect(() => {
    const progressStr: string | null = localStorage.getItem("progress");
    if (testId && progressStr) {
      const progress: Progress = JSON.parse(progressStr);
      setHistories(progress[testId] ? progress[testId].histories : []);
    }
  }, [testId]);

  // テストの回答履歴を取得後、ローカルストレージに保存しているテストの回答履歴を削除
  useEffect(() => {
    const progressStr: string | null = localStorage.getItem("progress");
    if (testId && progressStr && histories.length > 0) {
      const progress: Progress = JSON.parse(progressStr);
      delete progress[testId];
      localStorage.setItem("progress", JSON.stringify(progress));
    }
  }, [histories, testId]);

  // 正答数
  const correctNum: number = useMemo(
    () => histories.filter((history) => history.isCorrect).length,
    [histories]
  );

  // 正答率
  const correctRate: number = useMemo(
    () =>
      Math.round(
        (histories.filter((history) => history.isCorrect).length /
          histories.length) *
          100
      ),
    [histories]
  );

  return (
    testId &&
    testDetail && (
      <>
        <TopBar title={`[${testDetail.courseName}] ${testDetail.testName}`} />
        <div className="pt-16 px-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
            {`全${testDetail.length}問中${correctNum}問正解 (正答率${correctRate}%)`}
          </h3>
          <div className="mx-4 mt-4">
            <TestResultAccordion histories={histories} />
          </div>
        </div>
      </>
    )
  );
}
