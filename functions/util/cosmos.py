"""Cosmos DBのユーティリティ関数"""

import os
from typing import Any

from azure.cosmos import ContainerProxy, CosmosClient

# Cosmos DB Linux Emulator (PostgreSQL) は JSON 内の \uXXXX を
# PostgreSQL の Unicode エスケープとして解釈するため、Typographic な引用符等は ASCII に置換する
_COSMOS_STRING_TRANSLATION = str.maketrans(
    {
        "\u2018": "'",  # ‘
        "\u2019": "'",  # ’
        "\u201a": "'",  # ‚
        "\u201b": "'",  # ‛
        "\u201c": '"',  # “
        "\u201d": '"',  # ”
        "\u201e": '"',  # „
        "\u201f": '"',  # ‟
        "\u2032": "'",  # ′
        "\u2033": '"',  # ″
        "\u2035": "'",  # ‵
        "\u2036": '"',  # ‶
        "\u2037": '"',  # ‷
        "\u2013": "-",  # –
        "\u2014": "-",  # —
        "\u2212": "-",  # −
        "\u00a0": " ",  # non-breaking space
    }
)


def normalize_unicode_punctuation(value: str) -> str:
    """
    Cosmos DB へ格納する文字列の Unicode 句読点を ASCII 互換の文字へ置換する

    Args:
        value (str): 置換対象の文字列

    Returns:
        str: 置換後の文字列
    """

    return value.translate(_COSMOS_STRING_TRANSLATION)


def sanitize_document_strings(document: Any) -> Any:
    """
    ドキュメント内の文字列フィールドを再帰的に走査し、Unicode 句読点を正規化する

    Args:
        document (Any): Cosmos DB へ upsert するドキュメント

    Returns:
        Any: 正規化後のドキュメント
    """

    if isinstance(document, str):
        return normalize_unicode_punctuation(document)
    if isinstance(document, list):
        return [sanitize_document_strings(item) for item in document]
    if isinstance(document, dict):
        return {
            key: sanitize_document_strings(value) for key, value in document.items()
        }
    return document


def get_read_only_container(database_name: str, container_name: str) -> ContainerProxy:
    """
    指定したCosmos DBアカウントのコンテナーの読み取り専用インスタンスを返す

    Args:
        database_name (str): Cosmos DBアカウントのデータベース名
        container_name (str): Cosmos DBアカウントのコンテナー名

    Returns:
        ContainerProxy: Cosmos DBアカウントのコンテナーの読み取り専用インスタンス
    """

    return (
        CosmosClient(
            url=os.environ["COSMOSDB_URI"],
            credential=os.environ["COSMOSDB_READONLY_KEY"],
        )
        .get_database_client(database_name)
        .get_container_client(container_name)
    )


def get_read_write_container(database_name: str, container_name: str) -> ContainerProxy:
    """
    指定したCosmos DBアカウントのコンテナーのインスタンスを返す

    Args:
        database_name (str): Cosmos DBアカウントのデータベース名
        container_name (str): Cosmos DBアカウントのコンテナー名

    Returns:
        ContainerProxy: Cosmos DBアカウントのコンテナーのインスタンス
    """

    return (
        CosmosClient(
            url=os.environ["COSMOSDB_URI"],
            credential=os.environ["COSMOSDB_KEY"],
        )
        .get_database_client(database_name)
        .get_container_client(container_name)
    )
