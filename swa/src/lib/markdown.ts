import { Choice, Subject } from "@/types/backend";

/**
 * 問題文、選択肢をMarkdown形式の文字列に変換する
 * @param {Subject[]} subjects 各問題文
 * @param {Choice[]} choices 各選択肢
 * @returns {string} Markdown形式の問題文、選択肢
 */
export function buildQuestionMarkdown(
  subjects: Subject[],
  choices: Choice[],
): string {
  // 問題文のMarkdown形式の文字列を生成
  const subjectsBody: string = subjects
    .map((subject: Subject) =>
      subject.isIndicatedImg
        ? `![問題文の画像](${subject.sentence})`
        : subject.sentence,
    )
    .join("\n\n");

  // 選択肢のMarkdown形式の文字列を生成
  const choicesBody: string = choices
    .map((choice: Choice, idx: number) => {
      // 選択肢のインデックスをアルファベットに変換(0->A, 1->B, ...)
      const alphabet: string = String.fromCharCode(65 + idx);
      const lines: string[] = [];
      if (choice.sentence) {
        lines.push(choice.sentence);
      }
      if (choice.img) {
        lines.push(`![選択肢${alphabet}の画像](${choice.img})`);
      }
      return `${alphabet}. ${lines.join("\n")}`;
    })
    .join("\n");

  return [`## 問題\n\n${subjectsBody}`, `## 選択肢\n\n${choicesBody}`].join(
    "\n\n",
  );
}

/**
 * 問題文、選択肢、回答、回答のポイント、解説をMarkdown形式の文字列に変換する
 * @param {Subject[]} subjects 各問題文
 * @param {Choice[]} choices 各選択肢
 * @param {number[]} correctIdxes 正解の選択肢のインデックス
 * @param {string} answerKeyPoint 回答のポイント
 * @param {string[]} explanations 各選択肢の正解/不正解の理由
 * @returns {string} Markdown形式の問題文、選択肢、回答、回答のポイント、解説
 */
export function buildQuestionAnswerMarkdown(
  subjects: Subject[],
  choices: Choice[],
  correctIdxes: number[],
  answerKeyPoint: string,
  explanations: string[],
): string {
  // 回答のMarkdown形式の文字列を生成
  const answerBody: string = [...correctIdxes]
    .sort((a: number, b: number) => a - b)
    .map((idx: number) => String.fromCharCode(65 + idx))
    .join(", ");

  // 解説のMarkdown形式の文字列を生成
  const explanationsBody: string = choices
    .map(
      (_, idx: number) =>
        `${String.fromCharCode(65 + idx)}. ${explanations[idx]}`,
    )
    .join("\n");

  return [
    buildQuestionMarkdown(subjects, choices),
    `## 回答\n\n${answerBody}`,
    `## 回答のポイント\n\n${answerKeyPoint}`,
    `## 解説\n\n${explanationsBody}`,
  ].join("\n\n");
}
