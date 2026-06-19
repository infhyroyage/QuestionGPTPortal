import { fetchVotesAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";

/**
 * コミュニティでの回答の割合を示すバッジ群を表示するコンポーネント
 * @returns コミュニティでの回答の割合を示すバッジ群を表示するコンポーネント
 */
export default function VoteBadges() {
  const votes = useAtomValue(fetchVotesAtom);

  return votes === undefined ? (
    <div className="flex mb-4">
      <div className="skeleton h-5 w-full" />
    </div>
  ) : votes.length === 0 ? (
    <div className="flex mb-4">
      <span className="badge badge-neutral">回答者なし</span>
    </div>
  ) : (
    <div className="flex space-x-4 mb-4">
      {votes.map((vote: string, idx: number) => (
        <span key={idx} className="badge badge-neutral">
          {vote}
        </span>
      ))}
    </div>
  );
}
