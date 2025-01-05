import { useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const { testId, questionNumber } = useParams();

  return (
    <div>
      TestQuestionPage {testId} {questionNumber}
    </div>
  );
}
