import { fetchTestDetailsAtom } from "@/lib/atoms";
import { TestDetail } from "@/types/atoms";
import { useAtomValue } from "jotai";
import { ScrollText } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "./Button";

/**
 * 全テストのアコーディオンのコンポーネント
 * @returns 全テストのアコーディオンのコンポーネント
 */
export default function TestListAccordion() {
  const testDetails = useAtomValue(fetchTestDetailsAtom);

  const navigate = useNavigate();

  // testIdのテスト準備ページへ遷移
  const onClickInnerButton = useCallback(
    (testId: string) => {
      navigate(`/tests/${testId}/ready`);
    },
    [navigate]
  );

  // テスト一覧情報のコース名の一覧(重複排除)
  const courseNames = useMemo(() => {
    return testDetails
      ? Array.from(
          new Set(
            testDetails.map((testDetail: TestDetail) => testDetail.courseName)
          )
        )
      : [];
  }, [testDetails]);

  return (
    testDetails && (
      <div>
        {courseNames.map((courseName: string, i: number) => (
          <div
            key={i}
            className="collapse collapse-arrow border-b border-base-300 px-4"
          >
            <input type="checkbox" />
            <div className="collapse-title">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-left">
                {courseName}
              </h3>
            </div>
            <div className="collapse-content">
              {testDetails
                .filter(
                  (testDetail: TestDetail) =>
                    testDetail.courseName === courseName
                )
                .map((testDetail: TestDetail, j: number) => (
                  <Button
                    variant="ghost"
                    onClick={() => onClickInnerButton(testDetail.testId)}
                    key={j}
                    className="flex items-center justify-start space-x-4 w-full py-8"
                  >
                    <ScrollText className="size-7" />
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                      {testDetail.testName}
                    </h4>
                  </Button>
                ))}
            </div>
          </div>
        ))}
      </div>
    )
  );
}
