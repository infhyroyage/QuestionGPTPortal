import {
  AnswerExplanation,
  ChoiceAndSelect,
  Discussion,
  Histories,
  Order,
  QuestionSelector,
  TestDetail,
  TestDetails,
  TranslationDiscussion,
  TranslationExplanation,
  TranslationSubjectChoice,
  Votes,
} from "@/types/atoms";
import {
  Choice,
  GetAnswer,
  GetDiscussionRes,
  GetProgressesRes,
  GetQuestion,
  GetTests,
  GetVotesRes,
  PostAnswerRes,
  PostDiscussionRes,
  PostProgressesReq,
  PostProgressReq,
  PostProgressRes,
  PutEn2JaReq,
  PutEn2JaRes,
} from "@/types/backend";
import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { atom } from "jotai";
import { accessBackend } from "./backend";
import { translateSubjectsAndChoices } from "./translation";

/**
 * 正解・解説文を管理するatom
 */
const answerExplanationAtom = atom<AnswerExplanation>(undefined);

/**
 * コミュニティ情報を管理するatom
 */
const discussionAtom = atom<Discussion>(undefined);

/**
 * 回答履歴を管理するatom
 */
const historiesAtom = atom<Histories>(undefined);

/**
 * ダークモードの場合はtrue、ライトモードの場合はfalseのatom
 * toggleDarkModeAtomで隠蔽するためexportしない
 */
const isDarkModeAtom = atom<boolean>(
  typeof window === "undefined"
    ? false
    : window.matchMedia("(prefers-color-scheme: dark)").matches,
);

/**
 * テストを解く問題番号の順番を管理するatom
 */
const orderAtom = atom<Order>(undefined);

/**
 * 問題文・選択肢を管理するatom
 */
const questionSelectorAtom = atom<QuestionSelector>(undefined);

/**
 * テスト詳細情報を管理するatom
 */
const testDetailsAtom = atom<TestDetails>(undefined);

/**
 * コミュニティ情報に対する翻訳文を管理するatom
 */
const translationDiscussionAtom = atom<TranslationDiscussion>(undefined);

/**
 * 解説文に対する翻訳文を管理するatom
 */
const translationExplanationAtom = atom<TranslationExplanation>(undefined);

/**
 * 問題文・選択肢に対する翻訳文を管理するatom
 */
const translationSubjectChoiceAtom = atom<TranslationSubjectChoice>(undefined);

/**
 * コミュニティでの回答の割合を管理するatom
 */
const votesAtom = atom<Votes>(undefined);

/**
 * 正解・解説文を取得するatom
 */
export const fetchAnswerExplanationAtom = atom(
  (get) => get(answerExplanationAtom),
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
    isResubmit: boolean = false,
  ) => {
    // テスト詳細情報がまだ存在しない場合は何も取得・更新しない
    const testDetails: TestDetails = get(testDetailsAtom);
    if (!testDetails) {
      return;
    }
    const testDetail: TestDetail | undefined = testDetails.find(
      (testDetail) => testDetail.testId === testId,
    );
    if (!testDetail) {
      return;
    }

    // 問題文・選択肢がまだ存在しない場合は何も取得・更新しない
    const questionSelector: QuestionSelector = get(questionSelectorAtom);
    if (!questionSelector) {
      return;
    }

    // 選択肢がいずれも選択していない場合は何も取得・更新しない
    const selectedFlags: boolean[] = questionSelector.choices.map(
      (choice: ChoiceAndSelect) => choice.isSelected,
    );
    if (selectedFlags.every((flag) => !flag)) {
      return;
    }

    // 回答・解説生成中に更新
    set(answerExplanationAtom, {
      isSubmitting: true,
    });

    let correctIdxes: number[];
    let explanations: string[];
    let answerKeyPoint: string | undefined;
    if (isResubmit) {
      // 回答・解説再生成の場合、解説文に対する翻訳文を初期化してから、
      // [POST] /tests/{testId}/answers/{questionNumber}にアクセス
      set(translationExplanationAtom, undefined);
      const postAnswerRes: PostAnswerRes = await accessBackend<PostAnswerRes>(
        "POST",
        `/tests/${testId}/answers/${questionNumber}`,
        instance,
        accountInfo,
      );
      correctIdxes = postAnswerRes.correctIdxes;
      explanations = postAnswerRes.explanations;
      answerKeyPoint = postAnswerRes.answerKeyPoint;
    } else {
      // 回答・解説再生成ではない場合、[GET] /tests/{testId}/answers/{questionNumber}にアクセスして事前に生成した回答・解説を取得
      // もし取得できなかった場合、[POST] /tests/{testId}/answers/{questionNumber}にアクセス
      const getAnswerRes: GetAnswer = await accessBackend<GetAnswer>(
        "GET",
        `/tests/${testId}/answers/${questionNumber}`,
        instance,
        accountInfo,
      );
      if (getAnswerRes.isExisted) {
        correctIdxes = getAnswerRes.correctIdxes || [];
        explanations = getAnswerRes.explanations || [];
        answerKeyPoint = getAnswerRes.answerKeyPoint;
      } else {
        const postAnswerRes: PostAnswerRes = await accessBackend<PostAnswerRes>(
          "POST",
          `/tests/${testId}/answers/${questionNumber}`,
          instance,
          accountInfo,
        );
        correctIdxes = postAnswerRes.correctIdxes;
        explanations = postAnswerRes.explanations;
        answerKeyPoint = postAnswerRes.answerKeyPoint;
      }
    }

    // 生成/取得した正解・解説文で更新
    const correctFlags: boolean[] = [
      ...Array(questionSelector.choices.length),
    ].map((_, idx: number) => correctIdxes.includes(idx));
    const isCorrect: boolean = selectedFlags.every(
      (selectedFlag, idx) => selectedFlag === correctFlags[idx],
    );
    set(answerExplanationAtom, {
      correctFlags,
      explanations,
      answerKeyPoint,
      isSubmitting: false,
      isCorrect,
      correctIdxes,
      isSavedProgress: false,
    });
  },
);

/**
 * 解説文のみを取得するatom(回答済みの問題に遷移した際に使用)
 * 既存のanswerExplanationの状態を保持したまま、解説のみを追加する
 */
export const fetchExplanationsOnlyAtom = atom(
  null,
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
  ) => {
    // 既存のanswerExplanationを取得
    const answerExplanation: AnswerExplanation = get(answerExplanationAtom);
    if (!answerExplanation) {
      return;
    }

    // 回答・解説生成中、または今回のセッションで新規回答した直後は何もしない
    if (answerExplanation.isSubmitting || !answerExplanation.isSavedProgress) {
      return;
    }

    // 既に解説が存在する場合は何もしない
    if (answerExplanation.explanations) {
      return;
    }

    // [GET] /tests/{testId}/answers/{questionNumber}にアクセスして解説を取得
    const getAnswerRes: GetAnswer = await accessBackend<GetAnswer>(
      "GET",
      `/tests/${testId}/answers/${questionNumber}`,
      instance,
      accountInfo,
    );

    let explanations: string[];
    let answerKeyPoint: string | undefined;
    if (getAnswerRes.isExisted) {
      explanations = getAnswerRes.explanations || [];
      answerKeyPoint = getAnswerRes.answerKeyPoint;
    } else {
      // 解説がまだ生成されていない場合は、POSTで生成
      const postAnswerRes: PostAnswerRes = await accessBackend<PostAnswerRes>(
        "POST",
        `/tests/${testId}/answers/${questionNumber}`,
        instance,
        accountInfo,
      );
      explanations = postAnswerRes.explanations;
      answerKeyPoint = postAnswerRes.answerKeyPoint;
    }

    // 既存の状態を保持したまま、解説と回答のポイントを追加
    set(answerExplanationAtom, {
      ...answerExplanation,
      explanations,
      answerKeyPoint,
    });
  },
);

/**
 * コミュニティ情報を取得するatom
 */
export const fetchDiscussionAtom = atom(
  (get) => get(discussionAtom),
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
    isRefresh: boolean = false,
  ) => {
    // テスト詳細情報がまだ存在しない場合は何も取得・更新しない
    const testDetails: TestDetails = get(testDetailsAtom);
    if (!testDetails) {
      return;
    }
    const testDetail: TestDetail | undefined = testDetails.find(
      (testDetail) => testDetail.testId === testId,
    );
    if (!testDetail) {
      return;
    }

    // 問題文・選択肢がまだ存在しない場合は何も取得・更新しない
    const questionSelector: QuestionSelector = get(questionSelectorAtom);
    if (!questionSelector) {
      return;
    }

    // 正解・解説文がまだ存在しない場合は何も取得・更新しない
    const answerExplanation: AnswerExplanation = get(answerExplanationAtom);
    if (!answerExplanation) {
      return;
    }

    let summary: string | undefined;
    if (isRefresh) {
      // コミュニティ情報再取得の場合、コミュニティ情報に対する翻訳文を初期化してから、
      // [POST] /tests/{testId}/discussions/{questionNumber}にアクセス
      set(translationDiscussionAtom, undefined);
      const postDiscussionRes: PostDiscussionRes =
        await accessBackend<PostDiscussionRes>(
          "POST",
          `/tests/${testId}/discussions/${questionNumber}`,
          instance,
          accountInfo,
        );
      summary = postDiscussionRes.summary;
    } else {
      // コミュニティ情報再取得ではない場合、[GET] /tests/{testId}/discussions/{questionNumber}にアクセスして事前に生成したコミュニティ情報を取得
      // もし取得できなかった場合、[POST] /tests/{testId}/discussions/{questionNumber}にアクセス
      const getDiscussionRes: GetDiscussionRes =
        await accessBackend<GetDiscussionRes>(
          "GET",
          `/tests/${testId}/discussions/${questionNumber}`,
          instance,
          accountInfo,
        );
      if (getDiscussionRes.isExisted) {
        summary = getDiscussionRes.summary;
      } else {
        const postDiscussionRes: PostDiscussionRes =
          await accessBackend<PostDiscussionRes>(
            "POST",
            `/tests/${testId}/discussions/${questionNumber}`,
            instance,
            accountInfo,
          );
        summary = postDiscussionRes.summary;
      }
    }
    set(discussionAtom, {
      summary,
    });
  },
);

/**
 * 回答履歴とテストを解く問題番号の順番を取得するatom
 */
export const fetchProgressesAtom = atom(
  (get) => ({
    histories: get(historiesAtom),
    order: get(orderAtom),
  }),
  async (
    _,
    set,
    testId: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
  ) => {
    // [GET] /tests/{testId}/progressesにアクセスして取得した進捗項目から
    // 回答履歴とテストを解く問題番号の順番を組み立てて更新
    const res: GetProgressesRes = await accessBackend<GetProgressesRes>(
      "GET",
      `/tests/${testId}/progresses`,
      instance,
      accountInfo,
    );
    set(historiesAtom, res.progresses);
    set(orderAtom, res.order);
  },
);

/**
 * 問題文・選択肢を取得するatom
 */
export const fetchQuestionSelectorAtom = atom(
  (get) => get(questionSelectorAtom),
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
  ) => {
    // [GET] /tests/{testId}/questions/{questionNumber}にアクセスして取得した問題文で更新
    const res: GetQuestion = await accessBackend<GetQuestion>(
      "GET",
      `/tests/${testId}/questions/${questionNumber}`,
      instance,
      accountInfo,
    );

    // 回答履歴とテストを解く問題番号の順番を取得
    const histories: Histories = get(historiesAtom);
    const order: Order = get(orderAtom);

    // 回答済みの問題かどうかを判定
    let isAnswered = false;
    let history:
      | { isCorrect: boolean; selectedIdxes: number[]; correctIdxes: number[] }
      | undefined;
    if (histories && order) {
      const currentIdx = order.indexOf(parseInt(questionNumber));
      if (currentIdx !== -1 && currentIdx < histories.length) {
        isAnswered = true;
        history = histories[currentIdx];
      }
    }

    // 問題文・選択肢を更新(回答済みの場合は選択状態を復元)
    set(questionSelectorAtom, {
      questionNumber,
      subjects: res.subjects,
      choices: res.choices.map((choice: Choice, idx: number) => ({
        ...choice,
        isSelected:
          isAnswered && history ? history.selectedIdxes.includes(idx) : false,
      })),
      isMultiplied: res.isMultiplied,
    });

    // 回答済みの場合は正解情報も復元
    if (isAnswered && history) {
      const correctFlags: boolean[] = res.choices.map((_, idx: number) =>
        history!.correctIdxes.includes(idx),
      );
      set(answerExplanationAtom, {
        isSubmitting: false,
        correctFlags,
        isCorrect: history.isCorrect,
        correctIdxes: history.correctIdxes,
        isSavedProgress: true,
      });
    }
  },
);

/**
 * テスト詳細情報を取得するatom
 */
export const fetchTestDetailsAtom = atom(
  (get) => get(testDetailsAtom),
  async (
    _,
    set,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
  ) => {
    // [GET] /testsにアクセス
    const res: GetTests = await accessBackend<GetTests>(
      "GET",
      `/tests`,
      instance,
      accountInfo,
    );

    // テスト詳細情報の組み立て
    const testDetails: TestDetail[] = Object.entries(res).flatMap(
      ([courseName, tests]) =>
        tests.map((test) => ({ courseName, ...test, testId: test.id })),
    );

    set(testDetailsAtom, testDetails);
  },
);

/**
 * コミュニティ情報に対する翻訳文を取得するatom
 */
export const fetchTranslationDiscussionAtom = atom(
  (get) => get(translationDiscussionAtom),
  async (
    get,
    set,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
  ) => {
    // 翻訳対象のコミュニティ情報がまだ存在しない場合は何も翻訳しない
    const discussion: Discussion = get(discussionAtom);
    if (!discussion || !discussion.summary) {
      return;
    }

    // [PUT] /en2jaにアクセスして取得したコミュニティ情報の翻訳文で更新
    const res: PutEn2JaRes = await accessBackend<PutEn2JaRes, PutEn2JaReq>(
      "PUT",
      "/en2ja",
      instance,
      accountInfo,
      [discussion.summary],
    );

    set(translationDiscussionAtom, { summary: res[0] });
  },
);

/**
 * 解説文に対する翻訳文を取得するatom
 */
export const fetchTranslationExplanationAtom = atom(
  (get) => get(translationExplanationAtom),
  async (
    get,
    set,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
  ) => {
    // 翻訳対象の解説文がまだ存在しない場合は何も翻訳しない
    const answerExplanation: AnswerExplanation = get(answerExplanationAtom);
    if (!answerExplanation || !answerExplanation.explanations) {
      return;
    }

    // 翻訳対象の文字列を準備(解説文 + 回答のポイント)
    const textsToTranslate: string[] = [...answerExplanation.explanations];
    const hasAnswerKeyPoint = !!answerExplanation.answerKeyPoint;
    if (hasAnswerKeyPoint) {
      textsToTranslate.push(answerExplanation.answerKeyPoint!);
    }

    // [PUT] /en2jaにアクセスして取得した解説文の翻訳文で更新
    const res: PutEn2JaRes = await accessBackend<PutEn2JaRes, PutEn2JaReq>(
      "PUT",
      "/en2ja",
      instance,
      accountInfo,
      textsToTranslate,
    );

    // 翻訳結果を分割
    const explanationsTranslation = res.slice(
      0,
      answerExplanation.explanations.length,
    );
    const answerKeyPointTranslation = hasAnswerKeyPoint
      ? res[answerExplanation.explanations.length]
      : undefined;

    set(translationExplanationAtom, {
      explanations: explanationsTranslation,
      answerKeyPoint: answerKeyPointTranslation,
    });
  },
);

/**
 * 問題文・選択肢に対する翻訳文を取得するatom
 */
export const fetchTranslationSubjectChoiceAtom = atom(
  (get) => get(translationSubjectChoiceAtom),
  async (
    get,
    set,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
  ) => {
    // 翻訳対象の問題文・選択肢がまだ存在しない場合は何も翻訳しない
    const questionSelector: QuestionSelector = get(questionSelectorAtom);
    if (!questionSelector) {
      return;
    }

    // 翻訳開始時の問題番号を保持
    const questionNumberAtStart = questionSelector.questionNumber;

    // 問題文・選択肢を翻訳
    const translationSubjectChoice: TranslationSubjectChoice =
      await translateSubjectsAndChoices(
        questionSelector.subjects,
        questionSelector.choices,
        instance,
        accountInfo,
      );

    // 翻訳完了後、問題番号が変わっていた場合は結果をセットしない
    const currentQuestionSelector: QuestionSelector = get(questionSelectorAtom);
    if (
      !currentQuestionSelector ||
      currentQuestionSelector.questionNumber !== questionNumberAtStart
    ) {
      return;
    }

    set(translationSubjectChoiceAtom, translationSubjectChoice);
  },
);

/**
 * コミュニティでの回答の割合を取得するatom
 */
export const fetchVotesAtom = atom(
  (get) => get(votesAtom),
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
  ) => {
    // テスト詳細情報がまだ存在しない場合は何も取得・更新しない
    const testDetails: TestDetails = get(testDetailsAtom);
    if (!testDetails) {
      return;
    }
    const testDetail: TestDetail | undefined = testDetails.find(
      (testDetail) => testDetail.testId === testId,
    );
    if (!testDetail) {
      return;
    }

    // 問題文・選択肢がまだ存在しない場合は何も取得・更新しない
    const questionSelector: QuestionSelector = get(questionSelectorAtom);
    if (!questionSelector) {
      return;
    }

    // 正解・解説文がまだ存在しない場合は何も取得・更新しない
    const answerExplanation: AnswerExplanation = get(answerExplanationAtom);
    if (!answerExplanation) {
      return;
    }

    const votesRes: GetVotesRes = await accessBackend<GetVotesRes>(
      "GET",
      `/tests/${testId}/votes/${questionNumber}`,
      instance,
      accountInfo,
    );
    set(votesAtom, votesRes);
  },
);

/**
 * 回答履歴とテストを解く問題番号の順番を初期化し、初期化後の最初の問題番号を返すatom(write only)
 */
export const initializeProgressesAtom = atom(
  null,
  async (
    get,
    set,
    testId: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
    favoriteQuestionNumbers?: number[],
  ) => {
    // テスト詳細情報がまだ存在しない場合は何も取得・更新しない
    const testDetails: TestDetails = get(testDetailsAtom);
    if (!testDetails) {
      return;
    }
    const testDetail: TestDetail | undefined = testDetails.find(
      (testDetail) => testDetail.testId === testId,
    );
    if (!testDetail) {
      return;
    }

    // 回答履歴を取得していない場合は何も初期化しない
    const histories: Histories = get(historiesAtom);
    if (!histories) {
      return;
    }

    // [DELETE] /tests/{testId}/progressesにアクセスして回答履歴とテストを解く問題番号の順番を削除
    await accessBackend(
      "DELETE",
      `/tests/${testId}/progresses`,
      instance,
      accountInfo,
    );

    // お気に入り登録した問題のみテストを解く場合はその問題番号の順番を、
    // それ以外の場合は1問目からすべての問題番号の順番を生成
    const order: Order =
      favoriteQuestionNumbers && favoriteQuestionNumbers.length > 0
        ? favoriteQuestionNumbers
        : Array.from({ length: testDetail.length }, (_, idx) => idx + 1);

    // [POST] /tests/{testId}/progressesにアクセスしてテストを解く問題番号の順番を保存
    await accessBackend<void, PostProgressesReq>(
      "POST",
      `/tests/${testId}/progresses`,
      instance,
      accountInfo,
      { order },
    );

    set(historiesAtom, []);
    set(orderAtom, order);

    return order[0];
  },
);

/**
 * TestReadyPage/TestQuestionPage/TestResultPageのレンダリングで必要なatomをすべて初期値に戻すatom(write only)
 */
export const resetAtomsForAllTestPagesAtom = atom(null, (_, set) => {
  set(answerExplanationAtom, undefined);
  set(discussionAtom, undefined);
  set(historiesAtom, undefined);
  set(orderAtom, undefined);
  set(questionSelectorAtom, undefined);
  set(translationDiscussionAtom, undefined);
  set(translationSubjectChoiceAtom, undefined);
  set(translationExplanationAtom, undefined);
  set(votesAtom, undefined);
});

/**
 * TestQuestionPageのレンダリングで必要なatomをすべて初期値に戻すatom(write only)
 */
export const resetAtomsForTestQuestionAtom = atom(null, (_, set) => {
  set(answerExplanationAtom, undefined);
  set(discussionAtom, undefined);
  set(questionSelectorAtom, undefined);
  set(translationDiscussionAtom, undefined);
  set(translationSubjectChoiceAtom, undefined);
  set(translationExplanationAtom, undefined);
  set(votesAtom, undefined);
});

/**
 * コミュニティ情報と翻訳を初期値に戻すatom(write only)
 */
export const resetDiscussionAtom = atom(null, (_, set) => {
  set(discussionAtom, undefined);
  set(translationDiscussionAtom, undefined);
  set(votesAtom, undefined);
});

/**
 * 回答履歴を保存するatom(write only)
 */
export const saveProgressAtom = atom(
  null,
  async (
    get,
    set,
    testId: string,
    questionNumber: string,
    instance: IPublicClientApplication,
    accountInfo: AccountInfo | null,
  ) => {
    // 問題文・選択肢がまだ存在しない場合は回答履歴を保存しない
    const questionSelector: QuestionSelector = get(questionSelectorAtom);
    if (!questionSelector) {
      return;
    }

    // 回答・解説がまだ存在しない場合は回答履歴を保存しない
    const answerExplanation: AnswerExplanation = get(answerExplanationAtom);
    if (
      !answerExplanation ||
      answerExplanation.isSavedProgress ||
      answerExplanation.isCorrect === undefined ||
      answerExplanation.correctIdxes === undefined
    ) {
      return;
    }

    // 回答履歴を作成
    const progress: PostProgressReq = {
      isCorrect: answerExplanation.isCorrect,
      selectedIdxes: questionSelector.choices.reduce<number[]>(
        (prev: number[], choice: ChoiceAndSelect, idx: number) => {
          if (choice.isSelected) {
            prev.push(idx);
          }
          return prev;
        },
        [],
      ),
      correctIdxes: answerExplanation.correctIdxes,
    };

    // 回答履歴を保存
    const res: PostProgressRes = await accessBackend<
      PostProgressRes,
      PostProgressReq
    >(
      "POST",
      `/tests/${testId}/progresses/${questionNumber}`,
      instance,
      accountInfo,
      progress,
    );

    // 回答履歴が保存済みであることを記録
    set(answerExplanationAtom, {
      ...answerExplanation,
      isSavedProgress: true,
    });

    set(
      historiesAtom,
      res.map((progress) => ({
        isCorrect: progress.isCorrect,
        selectedIdxes: progress.selectedIdxes,
        correctIdxes: progress.correctIdxes,
      })),
    );
  },
);

/**
 * ダークモード化のフラグと、ダークモード切替え用のatom
 */
export const toggleDarkModeAtom = atom(
  (get) => get(isDarkModeAtom),
  (get, set) => {
    const isDarkMode = get(isDarkModeAtom);
    set(isDarkModeAtom, !isDarkMode);
  },
);

/**
 * 回答済みの問題の状態を復元するatom(write only)
 * histories から選択状態と正解情報を復元する
 */
export const restoreAnsweredQuestionAtom = atom(
  null,
  (get, set, questionNumber: string) => {
    // 問題文・選択肢がまだ存在しない場合は何もしない
    const questionSelector: QuestionSelector = get(questionSelectorAtom);
    if (!questionSelector) {
      return false;
    }

    // 回答履歴とテストを解く問題番号の順番がまだ存在しない場合は何もしない
    const histories: Histories = get(historiesAtom);
    const order: Order = get(orderAtom);
    if (!histories || !order) {
      return false;
    }

    // 現在の問題が order の何番目かを取得
    const currentIdx = order.indexOf(parseInt(questionNumber));
    if (currentIdx === -1) {
      return false;
    }

    // 回答済みでない場合は何もしない
    if (currentIdx >= histories.length) {
      return false;
    }

    // histories から回答情報を取得
    const history = histories[currentIdx];

    // 選択状態を復元
    set(questionSelectorAtom, {
      ...questionSelector,
      choices: questionSelector.choices.map(
        (choice: ChoiceAndSelect, idx: number) => ({
          ...choice,
          isSelected: history.selectedIdxes.includes(idx),
        }),
      ),
    });

    // 正解情報を復元
    const correctFlags: boolean[] = questionSelector.choices.map(
      (_, idx: number) => history.correctIdxes.includes(idx),
    );
    set(answerExplanationAtom, {
      isSubmitting: false,
      correctFlags,
      isCorrect: history.isCorrect,
      correctIdxes: history.correctIdxes,
      isSavedProgress: true,
    });

    return true;
  },
);

/**
 * 選択肢の選択状態の切り替えを管理するatom(write only)
 */
export const toggleSelectedChoiceAtom = atom(null, (get, set, idx: number) => {
  // まだ選択肢を取得していない場合は何もしない
  const questionSelector: QuestionSelector = get(questionSelectorAtom);
  if (!questionSelector) return;

  // 複数個の回答が存在する場合(isMultiplied=true)はidx番目のみ選択状態を反転し、その他はそのまま
  // 1つの回答のみが存在する場合(isMultiplied=false)は以下のように動作：
  //   - idx番目が選択されている場合：idx番目を非選択にする
  //   - idx番目が選択されていない場合：idx番目を選択・その他を非選択にする
  set(questionSelectorAtom, {
    ...questionSelector,
    choices: questionSelector.choices.map(
      (choice: ChoiceAndSelect, i: number) => ({
        ...choice,
        isSelected:
          i === idx
            ? !choice.isSelected
            : questionSelector.isMultiplied && choice.isSelected,
      }),
    ),
  });
});
