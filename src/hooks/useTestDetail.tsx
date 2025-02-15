import { fetchTestDetailsAtom } from "@/lib/atoms";
import { TestDetail } from "@/types/atoms";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { useParams } from "react-router";

/**
 * testIdで指定されたテスト詳細情報を返すカスタムフック
 * @returns {TestDetail | undefined} testIdで指定されたテスト詳細情報(存在しない場合はundefined)
 */
export default function useTestDetail(): TestDetail | undefined {
  const [testDetails] = useAtom(fetchTestDetailsAtom);

  const { testId } = useParams();

  // テスト詳細情報を取得していない場合はundefined
  return useMemo<TestDetail | undefined>(
    () =>
      testDetails &&
      testDetails.find(
        (testDetail: TestDetail) => testDetail.testId === testId
      ),
    [testDetails, testId]
  );
}
