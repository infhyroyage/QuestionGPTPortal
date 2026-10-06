"""翻訳エンジンのレスポンスの型定義"""

from typing import List, TypedDict


class AzureTranslatorTranslationsItem(TypedDict):
    """
    Azure Translatorのレスポンスの各要素のtranslationsフィールドの型
    """

    text: str
    """
    Azure Translatorで翻訳した文章
    """

    to: str
    """
    Azure Translatorが検出した言語コード
    """


class AzureTranslatorTranslations(TypedDict):
    """
    Azure Translatorのレスポンスの各要素の型
    """

    translations: List[AzureTranslatorTranslationsItem]
    """
    Azure Translatorの翻訳結果
    """


class AzureTranslatorRes(TypedDict):
    """
    Azure Translatorのレスポンスの型
    """

    __root__: List[AzureTranslatorTranslations]
    """
    Azure Translatorの翻訳結果
    """


class GoogleTranslationTranslationsItem(TypedDict):
    """
    Google翻訳APIのレスポンスのdata.translationsフィールドの各要素の型
    """

    translatedText: str
    """
    Google翻訳APIで翻訳した文章
    """


class GoogleTranslationData(TypedDict):
    """
    Google翻訳APIのレスポンスのdataフィールドの型
    """

    translations: List[GoogleTranslationTranslationsItem]
    """
    Google翻訳APIの翻訳結果(リクエストした文章の順序と同じ)
    """


class GoogleTranslationRes(TypedDict):
    """
    Google翻訳APIのレスポンスの型
    """

    data: GoogleTranslationData
    """
    Google翻訳APIの翻訳結果
    """
