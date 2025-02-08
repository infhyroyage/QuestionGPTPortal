import {
  fetchQuestionSelectorAtom,
  fetchTranslationSubjectChoiceAtom,
} from "@/lib/atoms";
import { Subject } from "@/types/backend";
import { useAtom } from "jotai";
import { ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";

export default function QuestionSubjects() {
  const [questionSelector] = useAtom(fetchQuestionSelectorAtom);
  const [translationSubjectChoice] = useAtom(fetchTranslationSubjectChoiceAtom);

  return (
    <>
      <div className="space-y-4 mb-4">
        {questionSelector ? (
          questionSelector.subjects.map((subject: Subject, idx: number) =>
            subject.isIndicatedImg ? (
              <Dialog key={idx}>
                <DialogTrigger asChild>
                  <div className="group relative inline-block">
                    <img
                      src={subject.sentence}
                      alt={subject.sentence}
                      className="w-auto max-h-[30vh] object-cover"
                    />
                    <div className="absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-70 transition duration-300" />
                    <ZoomIn className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition duration-300 text-white size-[10vh]" />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <img src={subject.sentence} alt={subject.sentence} />
                </DialogContent>
              </Dialog>
            ) : (
              <div key={idx} className="space-y-1">
                <p className="leading-7">{subject.sentence}</p>
                {translationSubjectChoice ? (
                  <p className="text-sm text-muted-foreground">
                    {translationSubjectChoice.subjects[idx]}
                  </p>
                ) : (
                  <Skeleton className="h-5 w-full" />
                )}
              </div>
            )
          )
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
