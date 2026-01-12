"""
Azure OpenAIのレスポンスから生成した型定義
"""

from typing import TypedDict


class CorrectAnswers(TypedDict):
    """
    正解の選択肢のインデックス・正解/不正解の理由の型
    """

    correct_indexes: list[int]
    """
    正解の選択肢のインデックス
    """

    explanations: list[str]
    """
    各選択肢の正解/不正解の理由
    """

    answer_key_point: str
    """
    問題文から正しい回答を割り出すための回答のポイント（約300文字）
    """
