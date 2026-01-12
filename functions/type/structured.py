"""Structured Outputsで取得したJSON形式のレスポンスのフォーマット"""

from pydantic import BaseModel, Field


class AnswerFormat(BaseModel):
    """
    Structured Outputsで取得した正解の選択肢・正解/不正解の理由のフォーマット
    """

    correct_indexes: list[int] = Field(
        ...,
        description="An array of indexes of correct options",
    )
    """
    正解の選択肢のインデックス
    """

    explanations: list[str] = Field(
        ...,
        description="An array of explanations of why each option is correct/incorrect",
    )
    """
    各選択肢の正解/不正解の理由
    """

    answer_key_point: str = Field(
        ...,
        description="A summary of approximately 300 characters explaining "
        "the key point to derive the correct answer from the question",
    )
    """
    問題文から正しい回答を割り出すための回答のポイント(約300文字)
    """
