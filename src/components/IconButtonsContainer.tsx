import NextQuestionButton from "./NextQuestionButton";
import OpenExplanationButton from "./OpenExplanationButton";
import ResubmitButton from "./ResubmitButton";
import SubmitButton from "./SubmitButton";

/**
 * TestQuestionPageのアイコンボタン群を配置するコンテナ
 * @returns TestQuestionPageのアイコンボタン群を配置するコンテナ
 */
export default function IconButtonsContainer() {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col space-y-4">
      <div className="flex space-x-4">
        <SubmitButton />
        <OpenExplanationButton />
      </div>
      <div className="flex space-x-4">
        <ResubmitButton />
        <NextQuestionButton />
      </div>
    </div>
  );
}
