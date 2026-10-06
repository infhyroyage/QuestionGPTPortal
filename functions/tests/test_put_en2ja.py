"""[PUT] /en2ja のテスト"""

import json
import os
import unittest
from unittest.mock import MagicMock, patch

import azure.functions as func
from requests.exceptions import HTTPError, Timeout
from src.put_en2ja import (
    put_en2ja,
    translate_by_azure_translator,
    translate_by_google,
    translate_en2ja,
    validate_request,
)

GOOGLE_TRANSLATION_API_URL = "https://translation.googleapis.com/language/translate/v2"


class TestValidateRequest(unittest.TestCase):
    """validate_request関数のテストケース"""

    def test_validate_request_success(self):
        """バリデーションチェックに成功する場合のテスト"""

        req = func.HttpRequest(
            method="PUT",
            url="/api/en2ja",
            body=json.dumps(["Hello"]).encode("utf-8"),
        )

        result = validate_request(req)

        self.assertIsNone(result)

    def test_validate_request_request_body_empty(self):
        """リクエストボディが空である場合のテスト"""

        req = func.HttpRequest(
            method="PUT",
            url="/api/en2ja",
            body=None,
        )

        result = validate_request(req)

        self.assertEqual(result, "Request Body is Empty")

    def test_validate_request_request_body_not_list(self):
        """リクエストボディがlistでない場合のテスト"""

        req = func.HttpRequest(
            method="PUT",
            url="/api/en2ja",
            body=json.dumps("Hello").encode("utf-8"),
        )

        result = validate_request(req)

        self.assertEqual(result, "Invalid texts: Hello")

    def test_validate_request_request_body_empty_list(self):
        """リクエストボディが空のlistである場合のテスト"""

        req = func.HttpRequest(
            method="PUT",
            url="/api/en2ja",
            body=json.dumps([]).encode("utf-8"),
        )

        result = validate_request(req)

        self.assertEqual(result, "Request Body is Empty")


class TestTranslateByGoogle(unittest.TestCase):
    """translate_by_google関数のテストケース"""

    @patch("src.put_en2ja.requests.post")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_by_google_success(self, mock_post):
        """Google翻訳APIでの翻訳が成功する場合のテスト"""

        # Given: APIキーが設定され、Google翻訳APIが1件の翻訳結果を返す
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": {"translations": [{"translatedText": "こんにちは"}]}
        }
        mock_post.return_value = mock_response

        # When: 1件の英語の文字列を翻訳する
        result = translate_by_google(["Hello"])

        # Then: APIキーをヘッダーに設定して英語→日本語のプレーンテキスト翻訳をリクエストし、翻訳結果を返す
        mock_post.assert_called_once_with(
            GOOGLE_TRANSLATION_API_URL,
            headers={
                "X-goog-api-key": "fake-google-key",
                "Content-Type": "application/json",
            },
            json={
                "q": ["Hello"],
                "source": "en",
                "target": "ja",
                "format": "text",
            },
            timeout=10,
        )
        mock_response.raise_for_status.assert_called_once()
        self.assertEqual(result, ["こんにちは"])

    @patch("src.put_en2ja.requests.post")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_by_google_multiple_texts(self, mock_post):
        """Google翻訳APIで複数の英語の文字列群を翻訳する場合のテスト"""

        # Given: Google翻訳APIがリクエスト順に2件の翻訳結果を返す
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": {
                "translations": [
                    {"translatedText": "こんにちは"},
                    {"translatedText": "世界"},
                ]
            }
        }
        mock_post.return_value = mock_response

        # When: 2件の英語の文字列群を翻訳する
        result = translate_by_google(["Hello", "World"])

        # Then: 1回のリクエストで2件をまとめて翻訳し、リクエスト順の翻訳結果を返す
        mock_post.assert_called_once()
        self.assertEqual(mock_post.call_args.kwargs["json"]["q"], ["Hello", "World"])
        self.assertEqual(result, ["こんにちは", "世界"])

    @patch("src.put_en2ja.requests.post")
    def test_translate_by_google_empty_texts(self, mock_post):
        """Google翻訳APIでの翻訳で空の英語の文字列群を指定した場合のテスト"""

        # Given: 空の英語の文字列群
        # When: 翻訳する
        result = translate_by_google([])

        # Then: Google翻訳APIを実行せずに空の配列を返す
        self.assertEqual(result, [])
        mock_post.assert_not_called()

    @patch("src.put_en2ja.requests.post")
    @patch.dict(os.environ, {}, clear=True)
    def test_translate_by_google_unset_key(self, mock_post):
        """Google翻訳APIでの翻訳で環境変数GOOGLE_TRANSLATION_API_KEYが未設定の場合のテスト"""

        # Given: 環境変数GOOGLE_TRANSLATION_API_KEYが未設定
        # When: 翻訳する
        with self.assertRaises(ValueError) as context:
            translate_by_google(["Hello"])

        # Then: ValueErrorが発生し、Google翻訳APIを実行しない
        self.assertEqual(str(context.exception), "Unset GOOGLE_TRANSLATION_API_KEY")
        mock_post.assert_not_called()

    @patch("src.put_en2ja.requests.post")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": ""})
    def test_translate_by_google_empty_key(self, mock_post):
        """Google翻訳APIでの翻訳で環境変数GOOGLE_TRANSLATION_API_KEYが空文字の場合のテスト"""

        # Given: 環境変数GOOGLE_TRANSLATION_API_KEYが空文字
        # When: 翻訳する
        with self.assertRaises(ValueError) as context:
            translate_by_google(["Hello"])

        # Then: ValueErrorが発生し、Google翻訳APIを実行しない
        self.assertEqual(str(context.exception), "Unset GOOGLE_TRANSLATION_API_KEY")
        mock_post.assert_not_called()

    @patch("src.put_en2ja.requests.post")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_by_google_http_error(self, mock_post):
        """Google翻訳APIがエラーレスポンスを返す場合のテスト"""

        # Given: Google翻訳APIが403エラーを返す
        mock_response = MagicMock()
        mock_http_error = HTTPError("403 Client Error: Forbidden")
        mock_http_error.response = MagicMock()
        mock_http_error.response.status_code = 403
        mock_response.raise_for_status.side_effect = mock_http_error
        mock_post.return_value = mock_response

        # When: 翻訳する
        with self.assertRaises(HTTPError) as context:
            translate_by_google(["Hello"])

        # Then: HTTPErrorが発生し、レスポンスボディを解析しない
        self.assertEqual(str(context.exception), "403 Client Error: Forbidden")
        mock_response.json.assert_not_called()

    @patch("src.put_en2ja.requests.post")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_by_google_timeout(self, mock_post):
        """Google翻訳APIの実行がタイムアウトする場合のテスト"""

        # Given: Google翻訳APIの実行がタイムアウトする
        mock_post.side_effect = Timeout("Read timed out")

        # When: 翻訳する
        with self.assertRaises(Timeout) as context:
            translate_by_google(["Hello"])

        # Then: Timeoutが発生する
        self.assertEqual(str(context.exception), "Read timed out")

    @patch("src.put_en2ja.requests.post")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_by_google_mismatched_translations(self, mock_post):
        """Google翻訳APIの翻訳結果の件数がリクエストした文字列群の件数と異なる場合のテスト"""

        # Given: 2件の翻訳をリクエストしたが、Google翻訳APIが1件の翻訳結果のみ返す
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": {"translations": [{"translatedText": "こんにちは"}]}
        }
        mock_post.return_value = mock_response

        # When: 2件の英語の文字列群を翻訳する
        with self.assertRaises(ValueError) as context:
            translate_by_google(["Hello", "World"])

        # Then: 件数不一致のValueErrorが発生する
        self.assertEqual(
            str(context.exception),
            "Mismatched number of translations: expected 2, got 1",
        )

    @patch("src.put_en2ja.requests.post")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_by_google_invalid_response(self, mock_post):
        """Google翻訳APIのレスポンスにdataフィールドが存在しない場合のテスト"""

        # Given: Google翻訳APIが想定外の形式のレスポンスを返す
        mock_response = MagicMock()
        mock_response.json.return_value = {"unexpected": []}
        mock_post.return_value = mock_response

        # When: 翻訳する
        with self.assertRaises(KeyError) as context:
            translate_by_google(["Hello"])

        # Then: 欠落したフィールド名を持つKeyErrorが発生する
        self.assertEqual(context.exception.args[0], "data")


class TestTranslateByAzureTranslator(unittest.TestCase):
    """translate_by_azure_translator関数のテストケース"""

    @patch("src.put_en2ja.requests.post")
    @patch("src.put_en2ja.logging")
    @patch.dict(os.environ, {"TRANSLATOR_KEY": "fake-key"})
    def test_translate_by_azure_translator_success(self, mock_logging, mock_post):
        """Azure Translatorでの翻訳が成功する場合のテスト"""

        mock_response = MagicMock()
        mock_response.json.return_value = [
            {"translations": [{"text": "こんにちは", "to": "ja"}]}
        ]
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        result = translate_by_azure_translator(["Hello"])
        mock_post.assert_called_once_with(
            "https://api.cognitive.microsofttranslator.com/translate",
            headers={
                "Ocp-Apim-Subscription-Key": "fake-key",
                "Ocp-Apim-Subscription-Region": "japaneast",
                "Content-Type": "application/json",
            },
            params={
                "api-version": "3.0",
                "from": "en",
                "to": "ja",
            },
            json=[{"Text": "Hello"}],
            timeout=10,
        )
        self.assertEqual(result, ["こんにちは"])
        mock_logging.error.assert_not_called()

    @patch("src.put_en2ja.logging")
    def test_translate_by_azure_translator_empty_texts(self, mock_logging):
        """Azure Translatorでの翻訳で空の英語の文字列群を指定した場合のテスト"""

        result = translate_by_azure_translator([])
        self.assertEqual(result, [])
        mock_logging.error.assert_not_called()

    @patch("src.put_en2ja.logging")
    def test_translate_by_azure_translator_unset_key(self, mock_logging):
        """Azure Translatorでの翻訳で環境変数TRANSLATOR_KEYが未設定の場合のテスト"""

        with self.assertRaises(ValueError) as context:
            translate_by_azure_translator(["Hello"])
        self.assertEqual(str(context.exception), "Unset TRANSLATOR_KEY")
        mock_logging.error.assert_not_called()

    @patch("src.put_en2ja.requests.post")
    @patch.dict(os.environ, {"TRANSLATOR_KEY": "fake-key"})
    def test_translate_by_azure_translator_exception(self, mock_post):
        """Azure Translatorでの翻訳で例外が発生する場合のテスト"""

        mock_response = MagicMock()
        mock_http_error = HTTPError()
        mock_http_error.response = MagicMock()
        mock_http_error.response.status_code = 500
        mock_response.raise_for_status.side_effect = mock_http_error
        mock_post.return_value = mock_response

        with self.assertRaises(HTTPError):
            translate_by_azure_translator(["Hello"])


class TestTranslateEn2Ja(unittest.TestCase):
    """translate_en2ja関数のテストケース"""

    @patch("src.put_en2ja.translate_by_azure_translator")
    @patch("src.put_en2ja.translate_by_google")
    @patch("src.put_en2ja.logging")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_en2ja_by_google(
        self, mock_logging, mock_translate_by_google, mock_translate_by_azure_translator
    ):
        """APIキーを設定し、Google翻訳APIでの翻訳に成功した場合のテスト"""

        # Given: GOOGLE_TRANSLATION_API_KEYが設定され、Google翻訳APIでの翻訳が成功する
        mock_translate_by_google.return_value = ["Google翻訳からこんにちは"]

        # When: 翻訳する
        result = translate_en2ja(["Hello"])

        # Then: Google翻訳APIの翻訳結果を返し、Azure Translatorを実行しない
        self.assertEqual(result, ["Google翻訳からこんにちは"])
        mock_translate_by_google.assert_called_once_with(["Hello"])
        mock_translate_by_azure_translator.assert_not_called()
        mock_logging.warning.assert_not_called()

    @patch("src.put_en2ja.translate_by_azure_translator")
    @patch("src.put_en2ja.translate_by_google")
    @patch("src.put_en2ja.logging")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_en2ja_fallback_on_http_error(
        self, mock_logging, mock_translate_by_google, mock_translate_by_azure_translator
    ):
        """APIキーを設定し、Google翻訳APIがエラーレスポンスを返した場合のテスト"""

        # Given: Google翻訳APIでの翻訳がHTTPErrorで失敗し、Azure Translatorでの翻訳が成功する
        mock_translate_by_google.side_effect = HTTPError("403 Client Error: Forbidden")
        mock_translate_by_azure_translator.return_value = [
            "Azure Translatorからこんにちは"
        ]

        # When: 翻訳する
        result = translate_en2ja(["Hello"])

        # Then: 警告ログを出力してAzure Translatorの翻訳結果を返す
        self.assertEqual(result, ["Azure Translatorからこんにちは"])
        mock_translate_by_google.assert_called_once_with(["Hello"])
        mock_translate_by_azure_translator.assert_called_once_with(["Hello"])
        mock_logging.warning.assert_called_once()
        self.assertIn(
            "403 Client Error: Forbidden", mock_logging.warning.call_args.args[0]
        )

    @patch("src.put_en2ja.translate_by_azure_translator")
    @patch("src.put_en2ja.translate_by_google")
    @patch("src.put_en2ja.logging")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_en2ja_fallback_on_timeout(
        self, mock_logging, mock_translate_by_google, mock_translate_by_azure_translator
    ):
        """APIキーを設定し、Google翻訳APIの実行がタイムアウトした場合のテスト"""

        # Given: Google翻訳APIの実行がタイムアウトし、Azure Translatorでの翻訳が成功する
        mock_translate_by_google.side_effect = Timeout("Read timed out")
        mock_translate_by_azure_translator.return_value = ["こんにちは"]

        # When: 翻訳する
        result = translate_en2ja(["Hello"])

        # Then: 警告ログを出力してAzure Translatorの翻訳結果を返す
        self.assertEqual(result, ["こんにちは"])
        mock_translate_by_azure_translator.assert_called_once_with(["Hello"])
        mock_logging.warning.assert_called_once()
        self.assertIn("Read timed out", mock_logging.warning.call_args.args[0])

    @patch("src.put_en2ja.translate_by_azure_translator")
    @patch("src.put_en2ja.translate_by_google")
    @patch("src.put_en2ja.logging")
    @patch.dict(os.environ, {}, clear=True)
    def test_translate_en2ja_unset_google_key(
        self, mock_logging, mock_translate_by_google, mock_translate_by_azure_translator
    ):
        """GOOGLE_TRANSLATION_API_KEYが未設定の場合のテスト"""

        # Given: GOOGLE_TRANSLATION_API_KEYが未設定で、Azure Translatorでの翻訳が成功する
        mock_translate_by_azure_translator.return_value = ["こんにちは"]

        # When: 翻訳する
        result = translate_en2ja(["Hello"])

        # Then: Google翻訳APIを実行せず、警告ログも出力せずにAzure Translatorの翻訳結果を返す
        self.assertEqual(result, ["こんにちは"])
        mock_translate_by_google.assert_not_called()
        mock_translate_by_azure_translator.assert_called_once_with(["Hello"])
        mock_logging.warning.assert_not_called()

    @patch("src.put_en2ja.translate_by_azure_translator")
    @patch("src.put_en2ja.translate_by_google")
    @patch("src.put_en2ja.logging")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": ""})
    def test_translate_en2ja_empty_google_key(
        self, mock_logging, mock_translate_by_google, mock_translate_by_azure_translator
    ):
        """GOOGLE_TRANSLATION_API_KEYが空文字の場合のテスト"""

        # Given: GOOGLE_TRANSLATION_API_KEYが空文字(GitHub Actionsのシークレット未登録時の設定値)
        mock_translate_by_azure_translator.return_value = ["こんにちは"]

        # When: 翻訳する
        result = translate_en2ja(["Hello"])

        # Then: Google翻訳APIを実行せず、警告ログも出力せずにAzure Translatorの翻訳結果を返す
        self.assertEqual(result, ["こんにちは"])
        mock_translate_by_google.assert_not_called()
        mock_translate_by_azure_translator.assert_called_once_with(["Hello"])
        mock_logging.warning.assert_not_called()

    @patch("src.put_en2ja.translate_by_azure_translator")
    @patch("src.put_en2ja.translate_by_google")
    @patch("src.put_en2ja.logging")
    @patch.dict(os.environ, {"GOOGLE_TRANSLATION_API_KEY": "fake-google-key"})
    def test_translate_en2ja_both_failed(
        self, mock_logging, mock_translate_by_google, mock_translate_by_azure_translator
    ):
        """Google翻訳API・Azure Translatorでの翻訳がいずれも失敗した場合のテスト"""

        # Given: Google翻訳API・Azure Translatorでの翻訳がいずれも失敗する
        mock_translate_by_google.side_effect = Timeout("Read timed out")
        mock_translate_by_azure_translator.side_effect = HTTPError(
            "500 Server Error: Internal Server Error"
        )

        # When: 翻訳する
        with self.assertRaises(HTTPError) as context:
            translate_en2ja(["Hello"])

        # Then: 警告ログを出力し、Azure TranslatorのHTTPErrorを送出する
        self.assertEqual(
            str(context.exception), "500 Server Error: Internal Server Error"
        )
        mock_logging.warning.assert_called_once()

    @patch("src.put_en2ja.translate_by_azure_translator")
    @patch("src.put_en2ja.translate_by_google")
    @patch.dict(os.environ, {}, clear=True)
    def test_translate_en2ja_unset_google_key_azure_failed(
        self, mock_translate_by_google, mock_translate_by_azure_translator
    ):
        """GOOGLE_TRANSLATION_API_KEYが未設定で、Azure Translatorでの翻訳が失敗した場合のテスト"""

        # Given: GOOGLE_TRANSLATION_API_KEY・TRANSLATOR_KEYがいずれも未設定
        mock_translate_by_azure_translator.side_effect = ValueError(
            "Unset TRANSLATOR_KEY"
        )

        # When: 翻訳する
        with self.assertRaises(ValueError) as context:
            translate_en2ja(["Hello"])

        # Then: Google翻訳APIを実行せず、Azure TranslatorのValueErrorを送出する
        self.assertEqual(str(context.exception), "Unset TRANSLATOR_KEY")
        mock_translate_by_google.assert_not_called()


class TestPutEn2Ja(unittest.TestCase):
    """put_en2ja関数のテストケース"""

    @patch("src.put_en2ja.validate_request")
    @patch("src.put_en2ja.translate_en2ja")
    @patch("src.put_en2ja.logging")
    def test_put_en2ja_success(
        self, mock_logging, mock_translate_en2ja, mock_validate_request
    ):
        """レスポンスが正常であることのテスト"""

        # Given: バリデーションチェックに成功し、翻訳が成功する
        mock_validate_request.return_value = None
        mock_translate_en2ja.return_value = ["こんにちは"]
        req = func.HttpRequest(
            method="PUT",
            url="/api/en2ja",
            body=json.dumps(["Hello"]).encode("utf-8"),
        )

        # When: 翻訳APIを実行する
        response = put_en2ja(req)

        # Then: 200で翻訳結果をJSONで返す
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "application/json")
        self.assertEqual(
            response.get_body(), json.dumps(["こんにちは"]).encode("utf-8")
        )
        mock_validate_request.assert_called_once_with(req)
        mock_translate_en2ja.assert_called_once_with(["Hello"])
        mock_logging.info.assert_called_once_with({"texts": ["Hello"]})
        mock_logging.error.assert_not_called()

    @patch("src.put_en2ja.validate_request")
    @patch("src.put_en2ja.translate_en2ja")
    def test_put_en2ja_validation_error(
        self, mock_translate_en2ja, mock_validate_request
    ):
        """バリデーションチェックに失敗した場合のテスト"""

        # Given: バリデーションチェックに失敗するリクエスト
        mock_validate_request.return_value = "Validation Error"

        req = MagicMock(spec=func.HttpRequest)
        req.get_body.return_value = json.dumps(
            {
                "courseName": "Math",
                "subjects": ["What is 2 + 2?"],
                "choices": ["3", "4", "5"],
            }
        ).encode("utf-8")

        # When: 翻訳APIを実行する
        response = put_en2ja(req)

        # Then: 400エラーを返し、翻訳を実行しない
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_body().decode(), "Validation Error")
        mock_validate_request.assert_called_once_with(req)
        mock_translate_en2ja.assert_not_called()

    @patch("src.put_en2ja.validate_request")
    @patch("src.put_en2ja.translate_en2ja")
    @patch("src.put_en2ja.logging")
    def test_put_en2ja_translation_failed(
        self, mock_logging, mock_translate_en2ja, mock_validate_request
    ):
        """翻訳に失敗した場合のテスト"""

        # Given: Google翻訳API・Azure Translatorのいずれでも翻訳に失敗する
        mock_validate_request.return_value = None
        mock_translate_en2ja.side_effect = HTTPError(
            "500 Server Error: Internal Server Error"
        )
        req = func.HttpRequest(
            method="PUT",
            url="/api/en2ja",
            body=json.dumps(["Hello"]).encode("utf-8"),
        )

        # When: 翻訳APIを実行する
        response = put_en2ja(req)

        # Then: エラーログを出力して500エラーを返す
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.get_body(), b"Internal Server Error")
        mock_logging.info.assert_called_once_with({"texts": ["Hello"]})
        mock_logging.error.assert_called_once()
        self.assertIn(
            "500 Server Error: Internal Server Error",
            mock_logging.error.call_args.args[0],
        )

    @patch("src.put_en2ja.validate_request")
    @patch("src.put_en2ja.translate_en2ja")
    @patch("src.put_en2ja.logging")
    def test_put_en2ja_exception(
        self, mock_logging, mock_translate_en2ja, mock_validate_request
    ):
        """翻訳処理より前に例外が発生した場合のテスト"""

        # Given: バリデーションチェックで想定外の例外が発生する
        mock_validate_request.side_effect = Exception("Unexpected Error")
        req = func.HttpRequest(
            method="PUT",
            url="/api/en2ja",
            body=json.dumps(["Hello"]).encode("utf-8"),
        )

        # When: 翻訳APIを実行する
        response = put_en2ja(req)

        # Then: エラーログを出力して500エラーを返し、翻訳を実行しない
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.get_body(), b"Internal Server Error")
        mock_translate_en2ja.assert_not_called()
        mock_logging.error.assert_called_once()
        self.assertIn("Unexpected Error", mock_logging.error.call_args.args[0])
