import TopBar from "@/components/TopBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchTestDetailsAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { Progress, ProgressTestHistory } from "@/types/storage";
import { useAtom } from "jotai";
import { Check, X } from "lucide-react";
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

  // tesiIdでの情報を習得していない場合はテスト準備ページにリダイレクト
  useEffect(() => {
    if (testId && !testDetails[testId]) {
      navigate(`${basePath}/tests/${testId}/ready`);
    }
  }, [navigate, testDetails, testId]);

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
    testDetails[testId] && (
      <>
        <TopBar
          title={`[${testDetails[testId].courseName}] ${testDetails[testId].testName}`}
        />
        <div className="pt-16 px-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
            結果
          </h3>
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            {`全${testDetails[testId].length}問中${correctNum}問正解 (正答率${correctRate}%)`}
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>問題</TableHead>
                <TableHead>回答</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {histories.map((history: ProgressTestHistory, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>
                    {history.isCorrect ? (
                      <Check className="text-green-500" />
                    ) : (
                      <X className="text-red-500" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    )
  );
}
