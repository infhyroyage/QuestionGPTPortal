import {
  fetchQuestionSelectorAtom,
  fetchTranslationInitAtom,
} from "@/lib/atoms";
import { Subject } from "@/types/backend";
import { useAtom } from "jotai";
import { Skeleton } from "./ui/skeleton";

export default function QuestionSubjects() {
  const [questionSelector] = useAtom(fetchQuestionSelectorAtom);
  const [translationInit] = useAtom(fetchTranslationInitAtom);

  return (
    <>
      <div className="space-y-4 mb-4">
        {questionSelector ? (
          questionSelector.subjects.map((subject: Subject, idx: number) => (
            <div key={idx} className="space-y-1">
              <p className="leading-7">{subject.sentence}</p>
              {translationInit ? (
                <p className="text-sm text-muted-foreground">
                  {translationInit.subjects[idx]}
                </p>
              ) : (
                <Skeleton className="h-5 w-full" />
              )}
            </div>
          ))
        ) : (
          <>
            <div className="space-y-1">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </>
        )}
      </div>
      <div className="h-[40vh]" />
    </>
  );
}
