import TopBar from "@/components/TopBar";
import { fetchTestDetailsAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const [testDetails] = useAtom(fetchTestDetailsAtom);

  const { testId, questionNumber } = useParams();

  return (
    <>
      <TopBar
        title={
          testId
            ? `[${testDetails[testId].courseName}] ${testDetails[testId].testName}`
            : "Question GPT Portal"
        }
      />
      <div className="pt-16">
        TestQuestionPage {testId} {questionNumber}
      </div>
    </>
  );
}
