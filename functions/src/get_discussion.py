"""[GET] /tests/{testId}/discussions/{questionNumber} のモジュール"""

import json
import logging
import traceback

import azure.functions as func
from azure.cosmos import ContainerProxy
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from type.cosmos import Community
from type.response import GetDiscussionRes
from util.cosmos import get_read_only_container

bp_get_discussion = func.Blueprint()


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


@bp_get_discussion.route(
    route="tests/{testId}/discussions/{questionNumber}",
    methods=["GET"],
    auth_level=func.AuthLevel.FUNCTION,
)
def get_discussion(req: func.HttpRequest) -> func.HttpResponse:
    """
    指定したテストID・問題番号でのコミュニティでのディスカッションの要約を取得します
    """

    try:
        # バリデーションチェック
        error_message = validate_request(req)
        if error_message:
            return func.HttpResponse(body=error_message, status_code=400)

        test_id = req.route_params.get("testId")
        question_number = req.route_params.get("questionNumber")

        # Communityコンテナーの読み取り専用インスタンスを取得
        container: ContainerProxy = get_read_only_container(
            database_name="Users",
            container_name="Community",
        )

        try:
            # Communityコンテナーから項目取得
            item: Community = container.read_item(
                item=f"{test_id}_{question_number}", partition_key=test_id
            )
            logging.info({"item": item})

            # レスポンス整形
            body: GetDiscussionRes = {
                "summary": item["discussionsSummary"],
                "isExisted": True,
            }

            logging.info({"body": body})

            return func.HttpResponse(
                body=json.dumps(body),
                status_code=200,
                mimetype="application/json",
            )
        except CosmosResourceNotFoundError:
            # Communityコンテナーから項目を取得できない場合、
            # コミュニティでのディスカッションの要約を除いてレスポンス
            body: GetDiscussionRes = {
                "isExisted": False,
            }
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
