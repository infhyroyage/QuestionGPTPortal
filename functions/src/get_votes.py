"""[GET] /tests/{testId}/votes/{questionNumber} のモジュール"""

import json
import logging
import traceback

import azure.functions as func
from azure.cosmos import ContainerProxy
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from type.cosmos import Question, QuestionDiscussion
from type.response import GetVotesRes
from util.cosmos import get_read_only_container

bp_get_votes = func.Blueprint()


def calculate_community_votes(discussions: list[QuestionDiscussion]) -> list[str]:
    """
    コミュニティでのディスカッションからユーザーが選択した選択肢を集計し、
    コミュニティでの回答の割合の文字列配列を生成する

    Args:
        discussions (list[QuestionDiscussion]): コミュニティでのディスカッション

    Returns:
        list[str]: コミュニティでの回答の割合の文字列配列(例：["A (60%)", "B (40%)"]、ユーザーが選択した選択肢がすべてNoneの場合は空配列)
    """

    # ユーザーが選択した選択肢(selectedAnswer)を集計
    answer_counts = {}
    total_votes = 0
    for discussion in discussions:
        selected_answer = discussion.get("selectedAnswer")
        if selected_answer:
            answer_counts[selected_answer] = answer_counts.get(selected_answer, 0) + 1
            total_votes += 1

    if total_votes == 0:
        return []

    # 割合を計算してコミュニティでの回答の割合の文字列配列を生成
    community_votes = []
    for answer, count in sorted(answer_counts.items()):
        percentage = round((count / total_votes) * 100)
        community_votes.append(f"{answer} ({percentage}%)")

    return community_votes


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


@bp_get_votes.route(
    route="tests/{testId}/votes/{questionNumber}",
    methods=["GET"],
    auth_level=func.AuthLevel.FUNCTION,
)
def get_votes(req: func.HttpRequest) -> func.HttpResponse:
    """
    指定したテストID・問題番号でのコミュニティでの回答の割合を取得します
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

        # Questionコンテナーの読み取り専用インスタンスを取得
        container: ContainerProxy = get_read_only_container(
            database_name="Users",
            container_name="Question",
        )

        try:
            # Questionコンテナーから項目取得
            item: Question = container.read_item(
                item=f"{test_id}_{question_number}", partition_key=test_id
            )
            logging.info({"item": item})
        except CosmosResourceNotFoundError:
            return func.HttpResponse(body="Not Found Question", status_code=404)

        # discussionsフィールドからコミュニティでの回答の割合を動的算出(存在しない場合は空配列)
        discussions: list[QuestionDiscussion] | None = item.get("discussions")
        votes: GetVotesRes = (
            calculate_community_votes(discussions) if discussions else []
        )
        logging.info({"votes": votes})

        return func.HttpResponse(
            body=json.dumps(votes),
            status_code=200,
            mimetype="application/json",
        )

    except Exception:
        logging.error(traceback.format_exc())
        return func.HttpResponse(
            body="Internal Server Error",
            status_code=500,
        )
