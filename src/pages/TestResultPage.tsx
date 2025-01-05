import { useParams } from "react-router";

/**
 * テスト結果ページのコンポーネント
 * @returns テスト結果ページのコンポーネント
 */
export default function TestResultPage() {
  const { testId } = useParams();

  return <div>TestResultPage {testId}</div>;
}
