import { Subject } from "@/types/backend";
import { SubjectDisplayProps } from "@/types/props";
import ImageDialog from "./ImageDialog";

/**
 * 問題文を表示するコンポーネント
 * @returns 問題文を表示するコンポーネント
 */
export default function SubjectDisplay({
  subjects,
  translation,
}: SubjectDisplayProps) {
  return (
    <div className="space-y-4">
      {subjects ? (
        subjects.map((subject: Subject, idx: number) =>
          subject.isIndicatedImg ? (
            <ImageDialog
              key={idx}
              img={subject.sentence}
              alt={subject.sentence}
            />
          ) : (
            <div key={idx} className="space-y-1">
              <p className="leading-7">{subject.sentence}</p>
              {translation ? (
                <p className="text-sm text-base-content/60">
                  {translation[idx]}
                </p>
              ) : (
                <div className="skeleton h-5 w-full" />
              )}
            </div>
          )
        )
      ) : (
        <>
          <div className="space-y-1">
            <div className="skeleton h-7 w-full" />
            <div className="skeleton h-5 w-full" />
          </div>
          <div className="space-y-1">
            <div className="skeleton h-7 w-full" />
            <div className="skeleton h-5 w-full" />
          </div>
        </>
      )}
    </div>
  );
}
