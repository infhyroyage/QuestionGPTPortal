"""[POST] /tests/{testId}/discussions/{questionNumber} のモジュール"""

import json
import logging
import os
import traceback

import azure.functions as func
from azure.cosmos import ContainerProxy
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from openai import AzureOpenAI
from type.cosmos import Question, QuestionDiscussion
from type.message import MessageDiscussion
from type.response import PostDiscussionRes
from util.cosmos import get_read_only_container
from util.queue import get_queue_client

MAX_RETRY_NUMBER: int = 5
SYSTEM_PROMPT: str = (
    "You are a professional content summarizer who creates concise summaries "
    "of community discussions."
)


def validate_request(req: func.HttpRequest) -> str | None:
    """
    リクエストのバリデーションチェックを行う

    Args:
        req (func.HttpRequest): リクエスト

    Returns:
        str | None: バリデーションチェックに成功した場合はNone、失敗した場合はエラーメッセージ
    """

    errors = []

    test_id = req.route_params.get("testId")
    if not test_id:
        errors.append("testId is Empty")

    question_number = req.route_params.get("questionNumber")
    if not question_number:
        errors.append("questionNumber is Empty")
    elif not question_number.isdigit():
        errors.append(f"Invalid questionNumber: {question_number}")

    return errors[0] if errors else None


def create_discussion_summary_prompt(discussions: list[QuestionDiscussion]) -> str:
    """
    ディスカッション要約用のプロンプトを作成する

    Args:
        discussions (list[QuestionDiscussion]): ディスカッション情報のリスト

    Returns:
        str: 要約用のプロンプト
    """

    if not discussions:
        return "No community discussions available for this question."

    # ディスカッションの情報を整理
    discussion_content: list[str] = []
    for i, discussion in enumerate(discussions, 1):
        comment: str = discussion.get("comment")
        upvoted_num: int = discussion.get("upvotedNum")
        selected_answer: str | None = discussion.get("selectedAnswer")
        if selected_answer is None:
            selected_answer = "Not specified"

        discussion_content.append(
            f"Discussion {i}:\n"
            f"- Comment: {comment}\n"
            f"- Upvotes: {upvoted_num}\n"
            f"- Selected Answer: {selected_answer}"
        )

    # プロンプトを構築
    # pylint: disable=line-too-long
    prompt: str = f"""Please create a concise summary (approximately 300 characters) of the following \
community discussions about an exam question. Focus on the main points, popular opinions \
(based on upvotes), and the general consensus on answer choices.

Community Discussions:
{'\n\n'.join(discussion_content)}

Please provide a summary that captures:
1. The overall sentiment and main discussion points
2. Popular answer choices mentioned by users
3. Key insights or concerns raised by the community

Important: Do not use any Markdown formatting (such as **, *, __, _, etc.) in the summary. Use plain text only.

Summary (approximately 300 characters):"""

    return prompt


def generate_discussion_summary(discussions: list[QuestionDiscussion]) -> str | None:
    """
    コミュニティでのディスカッションの要約を生成する

    Args:
        discussions (list[QuestionDiscussion]): ディスカッション情報のリスト

    Returns:
        str | None: 生成された要約文字列(生成できない場合はNone)
    """

    # プロンプトを作成
    prompt: str = create_discussion_summary_prompt(discussions)

    try:
        for retry_number in range(MAX_RETRY_NUMBER):
            logging.info({"retry_number": retry_number})

            # Azure OpenAIのチャット補完を実行
            response = AzureOpenAI(
                api_key=os.environ["OPENAI_API_KEY"],
                api_version=os.environ["OPENAI_API_VERSION"],
                azure_deployment=os.environ["OPENAI_DEPLOYMENT_NAME"],
                azure_endpoint=os.environ["OPENAI_ENDPOINT"],
            ).chat.completions.create(
                model=os.environ["OPENAI_MODEL_NAME"],
                messages=[
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
            )
            logging.info({"content": response.choices[0].message.content})

            # レスポンスから要約文字列を取得
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content.strip()

    except Exception:
        logging.warning(traceback.format_exc())

    return None


def queue_message_discussion(message_discussion: MessageDiscussion) -> None:
    """
    キューストレージにCommunityコンテナーの項目用のメッセージを格納する

    Args:
        message_discussion (MessageDiscussion): Communityコンテナーの項目用のメッセージ
    """

    queue_client = get_queue_client("discussions")
    logging.info({"message_discussion": message_discussion})
    queue_client.send_message(json.dumps(message_discussion).encode("utf-8"))


bp_post_discussion = func.Blueprint()


@bp_post_discussion.route(
    route="tests/{testId}/discussions/{questionNumber}",
    methods=["POST"],
    auth_level=func.AuthLevel.FUNCTION,
)
def post_discussion(req: func.HttpRequest) -> func.HttpResponse:
    """
    コミュニティでのディスカッションの要約を生成します
    """

    try:
        # バリデーションチェック
        error_message = validate_request(req)
        if error_message:
            return func.HttpResponse(body=error_message, status_code=400)

        test_id = req.route_params.get("testId")
        question_number = req.route_params.get("questionNumber")

        logging.info(
            {
                "question_number": question_number,
                "test_id": test_id,
            }
        )

        # Questionコンテナーの項目を取得
        container: ContainerProxy = get_read_only_container(
            database_name="Users",
            container_name="Question",
        )
        try:
            item: Question = container.read_item(
                item=f"{test_id}_{question_number}", partition_key=test_id
            )
            logging.info({"item": item})
        except CosmosResourceNotFoundError:
            return func.HttpResponse(body="Not Found Question", status_code=404)

        # discussionsフィールドが存在する場合はコミュニティでのディスカッションの要約を生成(存在しない場合は空文字列)
        discussions: list[QuestionDiscussion] | None = item.get("discussions")
        body: PostDiscussionRes = {
            "isExisted": False,
        }

        if discussions and len(discussions) > 0:
            # コミュニティでのディスカッションの要約を生成
            summary: str | None = generate_discussion_summary(discussions)
            if summary is None:
                raise ValueError("Failed to generate discussion summary")
            body["summary"] = summary
            body["isExisted"] = True

            # キューストレージにメッセージを格納
            queue_message_discussion(
                {
                    "testId": test_id,
                    "questionNumber": int(question_number),
                    "summary": summary,
                }
            )

        return func.HttpResponse(
            body=json.dumps(body),
            status_code=200,
            mimetype="application/json",
        )

    except Exception:
        logging.error(traceback.format_exc())
        return func.HttpResponse(
            body="Internal Server Error",
            status_code=500,
        )
