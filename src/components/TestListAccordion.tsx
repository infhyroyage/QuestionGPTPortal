import { fetchTestDetailsAtom } from "@/lib/atoms";
import { basePath } from "@/lib/github";
import { TestDetail } from "@/types/atoms";
import { useAtom } from "jotai";
import { ScrollText } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";

/**
 * 全テストのアコーディオンのコンポーネント
 * @returns 全テストのアコーディオンのコンポーネント
 */
export default function TestListAccordion() {
  const [testDetails] = useAtom(fetchTestDetailsAtom);

  const navigate = useNavigate();

  // testIdのテスト準備ページへ遷移
  const onClickInnerButton = useCallback(
    (testId: string) => {
      navigate(`${basePath}/tests/${testId}/ready`);
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
      <Accordion type="multiple">
        {courseNames.map((courseName: string, i: number) => (
          <AccordionItem key={i} value={`${i}`} className="px-4">
            <AccordionTrigger>
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-left">
                {courseName}
              </h3>
            </AccordionTrigger>
            <AccordionContent>
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
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    )
  );
}
