import { Choice, Subject } from "@/types/backend";

/**
 * 選択肢のインデックスをアルファベットに変換する(0->A, 1->B, ...)
 * @param idx 選択肢のインデックス
 * @returns アルファベット
 */
function toAlphabet(idx: number): string {
  return String.fromCharCode(65 + idx);
}

/**
 * 箇条書きの1項目内に複数行の文字列を収めるため、2行目以降をインデントする
 * @param text 文字列
 * @returns 2行目以降をインデントした文字列
 */
function indentContinuation(text: string): string {
  return text.replace(/\r?\n/g, "\n  ");
}

/**
 * 問題文をMarkdown形式の文字列に変換する
 * @param subjects 各問題文
 * @returns Markdown形式の問題文
 */
function buildSubjectsMarkdown(subjects: Subject[]): string {
  const body: string = subjects
    .map((subject: Subject) =>
      subject.isIndicatedImg
        ? `![問題文の画像](${subject.sentence})`
        : subject.sentence,
    )
    .join("\n\n");
  return `## 問題\n\n${body}`;
}

/**
 * 選択肢をMarkdown形式の文字列に変換する
 * @param choices 各選択肢
 * @returns Markdown形式の選択肢
 */
function buildChoicesMarkdown(choices: Choice[]): string {
  const body: string = choices
    .map((choice: Choice, idx: number) => {
      const alphabet: string = toAlphabet(idx);
      const lines: string[] = [];
      if (choice.sentence) {
        lines.push(choice.sentence);
      }
      if (choice.img) {
        lines.push(`![選択肢${alphabet}の画像](${choice.img})`);
      }
      return `- ${alphabet}. ${indentContinuation(lines.join("\n"))}`;
    })
    .join("\n");
  return `## 選択肢\n\n${body}`;
}

/**
 * 問題文・選択肢をMarkdown形式の文字列に変換する
 * @param subjects 各問題文
 * @param choices 各選択肢
 * @returns Markdown形式の問題文・選択肢
 */
export function buildQuestionMarkdown(
  subjects: Subject[],
  choices: Choice[],
): string {
  return [buildSubjectsMarkdown(subjects), buildChoicesMarkdown(choices)].join(
    "\n\n",
  );
}

/**
 * 問題文・選択肢・回答・回答のポイント・解説をMarkdown形式の文字列に変換する
 * @param subjects 各問題文
 * @param choices 各選択肢
 * @param correctIdxes 正解の選択肢のインデックス
 * @param answerKeyPoint 回答のポイント
 * @param explanations 各選択肢の正解/不正解の理由
 * @returns Markdown形式の問題文・選択肢・回答・回答のポイント・解説
 */
export function buildQuestionAnswerMarkdown(
  subjects: Subject[],
  choices: Choice[],
  correctIdxes: number[],
  answerKeyPoint: string,
  explanations: string[],
): string {
  const answer: string = [...correctIdxes]
    .sort((a: number, b: number) => a - b)
    .map(toAlphabet)
    .join(", ");
  const explanationsBody: string = choices
    .map(
      (_, idx: number) =>
        `- ${toAlphabet(idx)}. ${indentContinuation(explanations[idx] ?? "")}`,
    )
    .join("\n");
  return [
    buildQuestionMarkdown(subjects, choices),
    `## 回答\n\n${answer}`,
    `## 回答のポイント\n\n${answerKeyPoint}`,
    `## 解説\n\n${explanationsBody}`,
  ].join("\n\n");
}
