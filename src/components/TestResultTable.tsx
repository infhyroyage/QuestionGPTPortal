import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TestResultTableProps } from "@/types/props";
import { ProgressTestHistory } from "@/types/storage";
import { Check, X } from "lucide-react";
import { Fragment, useCallback, useState } from "react";

/**
 * テスト結果テーブルのコンポーネント
 * @returns テスト結果テーブルのコンポーネント
 */
export default function TestResultTable({ histories }: TestResultTableProps) {
  const [opens, setOpens] = useState<boolean[]>(
    [...Array(histories.length)].fill(false)
  );

  const onClick = useCallback((idx: number) => {
    setOpens((prev) => {
      const newOpens = [...prev];
      newOpens[idx] = !newOpens[idx];
      return newOpens;
    });
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>問題</TableHead>
          <TableHead>回答</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {histories.map((history: ProgressTestHistory, idx: number) => (
          <Fragment key={idx}>
            <TableRow
              onClick={() => onClick(idx)}
              className={`cursor-pointer${
                opens[idx] ? " rounded-t-md border-b-0" : ""
              }`}
            >
              <TableCell className="font-medium">{idx + 1}</TableCell>
              <TableCell>
                {history.isCorrect ? (
                  <Check className="text-green-500" />
                ) : (
                  <X className="text-red-500" />
                )}
              </TableCell>
            </TableRow>
            {opens[idx] && (
              <TableRow className="rounded-b-md border-t-0">
                <TableCell colSpan={2}>TODO</TableCell>
              </TableRow>
            )}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
