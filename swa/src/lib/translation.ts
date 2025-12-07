import { TranslationSubjectChoice } from "@/types/atoms";
import { Choice, PutEn2JaReq, PutEn2JaRes, Subject } from "@/types/backend";
import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { accessBackend } from "./backend";

/**
 * 問題文と選択肢の翻訳を行う
 * @param {Subject[]} subjects 問題文
 * @param {Choice[]} choices 選択肢
 * @param {IPublicClientApplication} instance MSALインスタンス
 * @param {AccountInfo | null} accountInfo ログイン済のアカウント情報
 * @returns {TranslationSubjectChoice} 翻訳後の問題文と選択肢
 */
export async function translateSubjectsAndChoices(
  subjects: Subject[],
  choices: Choice[],
  instance: IPublicClientApplication,
  accountInfo: AccountInfo | null
): Promise<TranslationSubjectChoice> {
  // 問題文、選択肢それぞれに対して[PUT] /en2jpにアクセスせず、
  // 問題文→選択肢の順で連結した1つの配列を用いて、翻訳を1回にまとめて行うよう整形する
  const data: PutEn2JaReq = [
    ...subjects.reduce((prev: string[], subject: Subject) => {
      if (!subject.isEscapedTranslation && !subject.isIndicatedImg) {
        prev.push(subject.sentence);
      }
      return prev;
    }, []),
    ...choices.reduce((prev: string[], choice: Choice) => {
      if (!choice.isEscapedTranslation && choice.sentence !== null) {
        prev.push(choice.sentence);
      }
      return prev;
    }, []),
  ];

  // [PUT] /en2jpにアクセスして問題文・選択肢の翻訳文を取得
  const res: PutEn2JaRes = await accessBackend<PutEn2JaRes, PutEn2JaReq>(
    "PUT",
    "/en2ja",
    instance,
    accountInfo,
    data
  );

  // 取得した翻訳文を問題文、選択肢に対応させるように更新
  const translatedSubjects: string[] = subjects.map((subject: Subject) =>
    subject.isEscapedTranslation || subject.isIndicatedImg
      ? subject.sentence
      : (res.shift() as string)
  );
  const translatedChoices: (string | null)[] = choices.map((choice: Choice) =>
    choice.isEscapedTranslation || choice.sentence === null
      ? choice.sentence
      : (res.shift() as string)
  );

  return { subjects: translatedSubjects, choices: translatedChoices };
}
