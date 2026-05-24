"""Cosmos DBユーティリティ関数のテスト"""

import unittest

from util.cosmos import normalize_unicode_punctuation, sanitize_document_strings


class TestNormalizeUnicodePunctuation(unittest.TestCase):
    """normalize_unicode_punctuation関数のテストケース"""

    def test_replaces_typographic_apostrophe(self):
        """Typographic なアポストロフィを ASCII へ置換するテスト"""
        # Given: Typographic な右シングルクォートを含む文字列
        value = "node group\u2019s Auto Scaling"

        # When: 正規化を実行
        result = normalize_unicode_punctuation(value)

        # Then: ASCII のアポストロフィへ置換される
        self.assertEqual(result, "node group's Auto Scaling")

    def test_leaves_ascii_unchanged(self):
        """ASCII のみの文字列は変更しないテスト"""
        # Given: ASCII のみの文字列
        value = "node group's Auto Scaling"

        # When: 正規化を実行
        result = normalize_unicode_punctuation(value)

        # Then: 変更されない
        self.assertEqual(result, value)


class TestSanitizeDocumentStrings(unittest.TestCase):
    """sanitize_document_strings関数のテストケース"""

    def test_sanitizes_nested_document(self):
        """ネストしたドキュメント内の文字列を正規化するテスト"""
        # Given: ネストしたドキュメントに Typographic 文字が含まれる
        document = {
            "subjects": ["company\u2019s VPC"],
            "choices": ["option A"],
            "answerNum": 1,
        }

        # When: ドキュメント全体を正規化
        result = sanitize_document_strings(document)

        # Then: 文字列フィールドのみ置換され、構造と数値は保持される
        self.assertEqual(result["subjects"], ["company's VPC"])
        self.assertEqual(result["choices"], ["option A"])
        self.assertEqual(result["answerNum"], 1)

    def test_returns_non_string_values_unchanged(self):
        """非文字列フィールドは変更しないテスト"""
        # Given: 文字列以外の値
        document = {"answerNum": 2, "flags": [True, None]}

        # When: 正規化を実行
        result = sanitize_document_strings(document)

        # Then: 非文字列はそのまま
        self.assertEqual(result, document)
