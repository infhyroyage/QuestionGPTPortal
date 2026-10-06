"""[PUT] /en2ja のモジュール"""

import json
import logging
import os
import traceback

import azure.functions as func
import requests
from type.request import PutEn2JaReq
from type.response import PutEn2JaRes
from type.translation import AzureTranslatorRes, GoogleTranslationRes


def validate_request(req: func.HttpRequest) -> str | None:
    """
    リクエストのバリデーションチェックを行う

    Args:
        req (func.HttpRequest): リクエスト

    Returns:
        str | None: バリデーションチェックに成功した場合はNone、失敗した場合はエラーメッセージ
    """

    errors = []

    texts_encoded: bytes = req.get_body()
    if not texts_encoded:
        errors.append("Request Body is Empty")
    else:
        texts: PutEn2JaReq = json.loads(texts_encoded.decode("utf-8"))
        if not isinstance(texts, list):
            errors.append(f"Invalid texts: {texts}")
        if len(texts) == 0:
            errors.append("Request Body is Empty")

    return errors[0] if errors else None


def translate_by_google(texts: list[str]) -> list[str]:
    """
    指定した英語の文字列群をGoogle翻訳APIでそれぞれ日本語に翻訳する

    Args:
        texts (list[str]): 英語の文字列群

    Returns:
        list[str]: 日本語に翻訳した文字列群
    """

    if not texts:
        return []

    google_translation_api_key = os.getenv("GOOGLE_TRANSLATION_API_KEY")
    if not google_translation_api_key:
        raise ValueError("Unset GOOGLE_TRANSLATION_API_KEY")

    # APIキーをクエリパラメーターで渡すと例外メッセージのURLに含まれてログ出力されるため、ヘッダーで渡す
    headers = {
        "X-goog-api-key": google_translation_api_key,
        "Content-Type": "application/json",
    }
    body = {
        "q": texts,
        "source": "en",
        "target": "ja",
        "format": "text",
    }

    response = requests.post(
        "https://translation.googleapis.com/language/translate/v2",
        headers=headers,
        json=body,
        timeout=10,
    )
    response.raise_for_status()
    data: GoogleTranslationRes = response.json()
    translations = data["data"]["translations"]
    if len(translations) != len(texts):
        raise ValueError(
            f"Mismatched number of translations: expected {len(texts)}, got {len(translations)}"
        )
    return [translation["translatedText"] for translation in translations]


def translate_by_azure_translator(texts: list[str]) -> list[str]:
    """
    指定した英語の文字列群をAzure Translatorでそれぞれ日本語に翻訳する

    Args:
        texts (list[str]): 英語の文字列群

    Returns:
        list[str]: 日本語に翻訳した文字列群
    """

    if not texts:
        return []

    translator_key = os.getenv("TRANSLATOR_KEY")
    if not translator_key:
        raise ValueError("Unset TRANSLATOR_KEY")

    headers = {
        "Ocp-Apim-Subscription-Key": translator_key,
        "Ocp-Apim-Subscription-Region": "japaneast",
        "Content-Type": "application/json",
    }
    params = {
        "api-version": "3.0",
        "from": "en",
        "to": "ja",
    }
    body = [{"Text": text} for text in texts]

    response = requests.post(
        "https://api.cognitive.microsofttranslator.com/translate",
        headers=headers,
        params=params,
        json=body,
        timeout=10,
    )
    response.raise_for_status()
    data: AzureTranslatorRes = response.json()
    return [item["translations"][0]["text"] for item in data]


bp_put_en2ja = func.Blueprint()


@bp_put_en2ja.route(
    route="en2ja",
    methods=["PUT"],
    auth_level=func.AuthLevel.FUNCTION,
)
def put_en2ja(req: func.HttpRequest) -> func.HttpResponse:
    """
    英語の各メッセージを日本語に翻訳します
    """

    try:
        # バリデーションチェック
        error_message = validate_request(req)
        if error_message:
            return func.HttpResponse(body=error_message, status_code=400)

        texts: PutEn2JaReq = json.loads(req.get_body().decode("utf-8"))

        logging.info({"texts": texts})

        # Google翻訳APIで翻訳し、失敗した場合はAzure Translatorで翻訳
        body: PutEn2JaRes
        try:
            body = translate_by_google(texts)
        except Exception:
            logging.warning(traceback.format_exc())
            body = translate_by_azure_translator(texts)

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
