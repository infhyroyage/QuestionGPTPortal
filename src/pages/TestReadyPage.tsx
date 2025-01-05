import { useParams } from "react-router";

/**
 * テスト準備ページのコンポーネント
 * @returns テスト準備ページのコンポーネント
 */
export default function TestReadyPage() {
  const { testId } = useParams();

  return <div>TestReadyPage {testId}</div>;
}
