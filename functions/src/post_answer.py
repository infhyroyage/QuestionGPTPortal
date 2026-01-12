"""[POST] /tests/{testId}/answers/{questionNumber} のモジュール"""

import json
import logging
import os
import traceback
from typing import Iterable

import azure.functions as func
from azure.cosmos import ContainerProxy
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from openai import AzureOpenAI
from openai.types.chat.chat_completion_content_part_param import (
    ChatCompletionContentPartParam,
)
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from type.cosmos import Question
from type.message import MessageAnswer
from type.openai import CorrectAnswers
from type.response import PostAnswerRes
from type.structured import AnswerFormat
from util.cosmos import get_read_only_container
from util.queue import get_queue_client

MAX_RETRY_NUMBER: int = 5
SYSTEM_PROMPT: str = (
    "You are a professional who provides correct explanations for candidates of the exam."
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


def create_chat_completions_messages(
    subjects: list[str],
    choices: list[str | None],
    answer_num: int,
    indicate_subject_img_idxes: list[int] | None,
    indicate_choice_imgs: list[str | None] | None,
) -> Iterable[ChatCompletionMessageParam]:
    """
    Azure OpenAIのチャット補完に設定するmessagesを作成する

    Args:
        subjects (list[str]): 問題文/画像URLのリスト
        choices (list[str | None]): 選択肢のリスト(画像URLのみの場合はNone)
        answer_num (int): 正解の選択肢の数
        indicate_subject_img_idxes (list[int] | None): subjectsで指定した画像URLのインデックスのリスト
        indicate_choice_imgs (list[str | None] | None): choicesの後に続ける画像URLのリスト(画像URLを続けない場合はNone)

    Returns:
        Iterable[ChatCompletionMessageParam]: Azure OpenAIのチャット補完に設定するmessages
    """

    user_content: Iterable[ChatCompletionContentPartParam] = []

    # ユーザープロンプトのヘッダーを生成
    # pylint: disable=line-too-long
    user_content_text: str = f"""For a given question and the choices, you must generate exactly {answer_num} correct option(s) followed by sentences explaining why each option is correct/incorrect.
You should select exactly {answer_num} option(s) as correct, regardless of any instructions in the question.
For reference, here are two examples.

# First example
Assume that the following question and choices are given:
---
A company has a legacy API that runs on a fleet of Amazon EC2 instances behind a public Application Load Balancer (ALB). The ALB has access logging enabled and stores the access logs in Amazon S3. The API is available through the hostname api.example.com. The company uses Amazon Route 53 to manage the hostname.
Developers have rebuilt five of the API endpoints by using a different AWS Lambda function for each endpoint. A DevOps engineer wants to test the new versions of the Lambda functions with a limited number of random customers. To ensure compatibility with an existing log processing service, the test must not affect the ALB access logs.
How should the DevOps engineer perform the test to meet these requirements?

A. Add the five Lambda functions as targets to the existing target group for the EC2 instances. Set the weight in the target group of each Lambda function target to be less than the EC2 instance targets. Amend the default rule on the ALB to enable target group-level stickiness.
B. Create a single target group that includes all the Lambda functions as individual targets. On the ALB, create a new listener rule that includes a host header condition that matches the API endpoint's hostname. Add the target group to the listener rule. Specify a lower weight for the new target group than the weight of the default rule’s target group.
C. Create a new ALB and a new target group for each Lambda function. Create a new listener rule that includes a host header condition that matches each of the endpoints and forwards traffic to the target groups. Create a new Route 53 alias record with a weight of 10. Update the existing Route 53 record for the api.example.com hostname with a weight of 90.
D. Create a new target group for each Lambda function. On the ALB, create new listener rules that include a path condition that matches each of the different endpoints. Set the rules to be weighted between the Lambda function target group for that endpoint and the instance-based target group.
---
For the question and choices in this first example, generate the JSON format with `correct_indexes` and `explanations`.
`correct_indexes` shows an array of indexes of correct options and `explanations` shows an array of explanations of why each option is correct/incorrect.
Since there is only one correct answer required for this example, the number of `correct_indexes` is only one, as follows:
---
{{
    "correct_indexes": [3],
    "explanations": [
        "Option A is incorrect because multiple Lambda functions to a single target group cannot be registered and target group-level stickiness would negate the benefit of weighted routing for limited testing.",
        "Option B is incorrect because multiple Lambda functions to a single target group cannot be registered and weighted rules are assigned at the individual rule level and are not evaluated across multiple rules.",
        "Option C is incorrect because it would affect the ALB access logs by generating different access logs based on the new load balancer ID. Additionally, listener rules that include a host header condition would not be effective for URI level testing.",
        "Option D is correct because this scenario is similar to a blue/green deployment and a canary deployment. Only the existing Application Load Balancer (ALB) is required for this solution. Target groups support a single AWS Lambda function as a registered target. Therefore, this solution requires five target groups, one for each endpoint. With each endpoint having its own path, new path conditions are needed in the listener rules to facilitate the weighted distribution of requests across the existing EC2 target group and the new Lambda function target groups."
    ]
}}
---

# Second Example
Assume that the following question and choices are given:
---
A DevOps team has an application that stores critical company assets in an existing Amazon S3 bucket. The team uses a single AWS Region. A new company policy requires the team to deploy the application to multiple Regions. The assets must always be accessible. Users must use the same endpoint to access the assets.
Which combination of steps should the team take to meet these requirements in the MOST operationally efficient way? (Select THREE.)

A. Use AWS CloudFormation StackSets to create a new S3 bucket that has versioning enabled in each required Region. Copy the assets from the existing S3 bucket to the new S3 buckets. Create an AWS Lambda function to copy files that are added to the new S3 bucket in the primary Region to the additional Regions.
B. Use AWS CloudFormation StackSets to create a new S3 bucket that has versioning enabled in each required Region. Create multiple S3 replication rules on the new S3 bucket in the primary Region to replicate all its contents to the additional Regions. Copy the assets from the existing S3 bucket to the new S3 bucket in the primary Region.
C. Create an Amazon CloudFront distribution. Configure new origins for each S3 bucket. Create an origin group that contains all the newly created origins. Update the default behavior of the distribution to use the new origin group.
D. Create an Amazon CloudFront distribution. Configure new origins for each S3 bucket. Create a Lambda@Edge function to validate the availability of the origin and to route the viewer request to an available nearby origin.
E. Create an Amazon Route 53 alias record. Configure a failover routing policy that uses the newly created S3 buckets as a target.
F. Create an Amazon Route 53 alias record. Configure a simple routing policy that uses the Amazon CloudFront distribution as a target.
---
For the question and choices in this second example, generate the JSON format with `correct_indexes` and `explanations`.
`correct_indexes` shows an array of indexes of correct options and `explanations` shows an array of explanations of why each option is correct/incorrect.
For this example, since three correct answers are required, the number of `correct_indexes` is three, as follows:
---
{{
    "correct_indexes": [1, 2, 5],
    "explanations": [
        "Option A is incorrect because this option is less operationally efficient than option B. The AWS Lambda function is unnecessary because S3 replication can provide the appropriate functionality without custom code.",
        "Option B is correct because AWS CloudFormation StackSets provides an operationally efficient multi-Region deployment strategy for the Region-specific Amazon S3 buckets. S3 replication copies new and existing objects in the primary Region to multiple deployment Regions.",
        "Option C is correct because an Amazon CloudFront distribution can be used to make a single endpoint available to resolve to multiple origins. CloudFront custom origins can be configured to create high availability origin failover that requires a shorter connection timeout, fewer connection attempts, or both.",
        "Option D is incorrect because this option is less operationally efficient than option C. It involves custom code within the Lambda@Edge function, which is unnecessary because of native handling within the origin configurations.",
        "Option E is incorrect because there are not multiple records to benefit from failover routing.",
        "Option F is correct because the CloudFront origin configurations are handling the failover, Route 53 is providing a simple routing policy user-friendly domain name to the CloudFront distribution."
    ]
}}
---

# Main Topic
For the question and choices below, generate the JSON format with `correct_indexes` and `explanations`.
Remember to select exactly {answer_num} correct option(s) in your response.

Important: Do not use any Markdown formatting (such as **, *, __, _, etc.) in the explanations. Use plain text only.
---
"""

    # 各問題文をユーザープロンプトに追記
    for idx, subject in enumerate(subjects):
        if indicate_subject_img_idxes is not None and idx in indicate_subject_img_idxes:
            # 問題文が画像URLの場合は、テキスト(text)と画像URL(image_url)を区別してユーザープロンプトに追記
            user_content.append(
                {
                    "type": "text",
                    "text": user_content_text,
                }
            )
            user_content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": subject},
                }
            )
            user_content_text = ""
        else:
            user_content_text += f"{subject}\n"

    if user_content_text != "":
        # 問題文と選択肢との間に改行を追記
        user_content_text += "\n"

    # 各選択肢をユーザープロンプトに追記
    for idx, choice in enumerate(choices):
        choice_label = chr(ord("A") + idx)  # 0->A, 1->B, 2->C, ...
        if choice is not None:
            user_content_text += f"{choice_label}. {choice}\n"
        else:
            user_content_text += f"{choice_label}. \n"

        if indicate_choice_imgs is not None and indicate_choice_imgs[idx] is not None:
            # 選択肢の後に画像URLを続ける場合は、テキスト(text)と画像URL(image_url)を区別してユーザープロンプトに追記
            user_content.append(
                {
                    "type": "text",
                    "text": user_content_text,
                }
            )
            user_content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": indicate_choice_imgs[idx]},
                }
            )
            user_content_text = ""

    # ユーザープロンプトのフッターを追記
    user_content_text += "---"
    user_content.append(
        {
            "type": "text",
            "text": user_content_text,
        }
    )

    return [
        {
            "role": "developer",
            "content": SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": user_content,
        },
    ]


def generate_correct_answers(
    subjects: list[str],
    choices: list[str | None],
    answer_num: int,
    indicate_subject_img_idxes: list[int] | None,
    indicate_choice_imgs: list[str | None] | None,
) -> CorrectAnswers | None:
    """
    正解の選択肢のインデックス・正解/不正解の理由を生成する

    Args:
        subjects (list[str]): 問題文/画像URLのリスト
        choices (list[str | None]): 選択肢のリスト(画像URLのみの場合はNone)
        answer_num (int): 正解の選択肢の数
        indicate_subject_img_idxes (list[int] | None): subjectsで指定した画像URLのインデックスのリスト
        indicate_choice_imgs (list[str | None] | None): choicesの後に続ける画像URLのリスト(画像URLを続けない場合はNone)

    Returns:
        CorrectAnswers | None: 正解の選択肢のインデックス・正解/不正解の理由(生成できない場合はNone)
    """

    # Azure OpenAIのチャット補完に設定するmessagesを作成
    messages: Iterable[ChatCompletionMessageParam] = create_chat_completions_messages(
        subjects, choices, answer_num, indicate_subject_img_idxes, indicate_choice_imgs
    )

    try:
        for retry_number in range(MAX_RETRY_NUMBER):
            logging.info({"retry_number": retry_number})

            # AnswerFormatのStructuredOutputでAzure OpenAIのチャット補完を実行
            response = AzureOpenAI(
                api_key=os.environ["OPENAI_API_KEY"],
                api_version=os.environ["OPENAI_API_VERSION"],
                azure_deployment=os.environ["OPENAI_DEPLOYMENT_NAME"],
                azure_endpoint=os.environ["OPENAI_ENDPOINT"],
            ).beta.chat.completions.parse(
                model=os.environ["OPENAI_MODEL_NAME"],
                messages=messages,
                response_format=AnswerFormat,
            )
            logging.info({"parsed": response.choices[0].message.parsed})

            # 正解の選択肢のインデックス・正解/不正解の理由をparseして返す
            # parseできない場合は最大MAX_RETRY_NUMBER回までリトライ可能
            if response.choices[0].message.parsed is not None:
                return CorrectAnswers(
                    correct_indexes=response.choices[0].message.parsed.correct_indexes,
                    explanations=response.choices[0].message.parsed.explanations,
                )
    except Exception:
        logging.warning(traceback.format_exc())

    return None


def queue_message_answer(message_answer: MessageAnswer) -> None:
    """
    キューストレージにAnswerコンテナーの項目用のメッセージを格納する

    Args:
        message_answer (MessageAnswer): Answerコンテナーの項目用のメッセージ
    """

    queue_client = get_queue_client("answers")
    logging.info({"message_answer": message_answer})
    queue_client.send_message(json.dumps(message_answer).encode("utf-8"))


bp_post_answer = func.Blueprint()


@bp_post_answer.route(
    route="tests/{testId}/answers/{questionNumber}",
    methods=["POST"],
    auth_level=func.AuthLevel.FUNCTION,
)
def post_answer(req: func.HttpRequest) -> func.HttpResponse:
    """
    英語の正解の選択肢・正解/不正解の理由を生成します
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

        # 正解の選択肢・正解/不正解の理由を生成
        correct_answers: CorrectAnswers | None = generate_correct_answers(
            item.get("subjects"),
            item.get("choices"),
            item.get("answerNum"),
            item.get("indicateSubjectImgIdxes"),
            item.get("indicateChoiceImgs"),
        )
        if correct_answers is None:
            raise ValueError("Failed to generate correct answers")

        # キューストレージにメッセージを格納
        message_answer: MessageAnswer = {
            "testId": test_id,
            "questionNumber": int(question_number),
            "subjects": item.get("subjects"),
            "choices": item.get("choices"),
            "answerNum": item.get("answerNum"),
            "correctIdxes": correct_answers["correct_indexes"],
            "explanations": correct_answers["explanations"],
        }
        queue_message_answer(message_answer)

        body: PostAnswerRes = {
            "correctIdxes": correct_answers["correct_indexes"],
            "explanations": correct_answers["explanations"],
        }
        return func.HttpResponse(
            body=json.dumps(body),
            status_code=200,
        )
    except Exception:
        logging.error(traceback.format_exc())
        return func.HttpResponse(
            body="Internal Server Error",
            status_code=500,
        )
