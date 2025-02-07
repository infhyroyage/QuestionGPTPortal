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

/**
 * テスト結果テーブルのコンポーネント
 * @returns テスト結果テーブルのコンポーネント
 */
export default function TestResultTable({ histories }: TestResultTableProps) {
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
  );
}
