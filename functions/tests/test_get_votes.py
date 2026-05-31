"""[GET] /tests/{testId}/votes/{questionNumber} のテスト"""

import json
from unittest import TestCase
from unittest.mock import MagicMock, call, patch

import azure.functions as func
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from src.get_votes import calculate_community_votes, get_votes, validate_request
from type.cosmos import Question, QuestionDiscussion


class TestCalculateCommunityVotes(TestCase):
    """calculate_community_votes関数のテストケース"""

    def test_calculate_community_votes_no_selected_answers(self):
        """selectedAnswerがない場合のテスト"""
        # Given: selectedAnswerがNoneのディスカッションのみ
        discussions = [
            QuestionDiscussion(
                comment="Great question!", upvotedNum=5, selectedAnswer=None
            )
        ]
        # When: 割合を算出
        result = calculate_community_votes(discussions)
        # Then: 空配列
        self.assertEqual(result, [])

    def test_calculate_community_votes_single_answer(self):
        """単一の回答の場合のテスト"""
        # Given: 単一のselectedAnswer
        discussions = [
            QuestionDiscussion(
                comment="I think A is correct", upvotedNum=5, selectedAnswer="A"
            )
        ]
        # When: 割合を算出
        result = calculate_community_votes(discussions)
        # Then: 100%
        self.assertEqual(result, ["A (100%)"])

    def test_calculate_community_votes_multiple_answers(self):
        """複数の回答の場合のテスト"""
        # Given: 複数のselectedAnswer
        discussions = [
            QuestionDiscussion(
                comment="I think A is correct", upvotedNum=5, selectedAnswer="A"
            ),
            QuestionDiscussion(
                comment="B is the right answer", upvotedNum=3, selectedAnswer="B"
            ),
            QuestionDiscussion(
                comment="A definitely", upvotedNum=2, selectedAnswer="A"
            ),
        ]
        # When: 割合を算出
        result = calculate_community_votes(discussions)
        # Then: A: 2回 (67%), B: 1回 (33%)
        self.assertEqual(result, ["A (67%)", "B (33%)"])

    def test_calculate_community_votes_equal_distribution(self):
        """等しい分布の場合のテスト"""
        # Given: 同数のselectedAnswer
        discussions = [
            QuestionDiscussion(
                comment="A is correct", upvotedNum=5, selectedAnswer="A"
            ),
            QuestionDiscussion(
                comment="B is correct", upvotedNum=3, selectedAnswer="B"
            ),
        ]
        # When: 割合を算出
        result = calculate_community_votes(discussions)
        # Then: 各50%
        self.assertEqual(result, ["A (50%)", "B (50%)"])

    def test_calculate_community_votes_sorted_order(self):
        """アルファベット順にソートされることのテスト"""
        # Given: 複数のselectedAnswer
        discussions = [
            QuestionDiscussion(
                comment="C is correct", upvotedNum=5, selectedAnswer="C"
            ),
            QuestionDiscussion(
                comment="A is correct", upvotedNum=3, selectedAnswer="A"
            ),
            QuestionDiscussion(
                comment="B is correct", upvotedNum=2, selectedAnswer="B"
            ),
        ]
        # When: 割合を算出
        result = calculate_community_votes(discussions)
        # Then: アルファベット順
        self.assertEqual(result, ["A (33%)", "B (33%)", "C (33%)"])

    def test_calculate_community_votes_mixed_answers(self):
        """選択肢が混在する場合のテスト"""
        # Given: Noneを含むselectedAnswer
        discussions = [
            QuestionDiscussion(
                comment="I think A is correct", upvotedNum=5, selectedAnswer="A"
            ),
            QuestionDiscussion(comment="No answer", upvotedNum=3, selectedAnswer=None),
            QuestionDiscussion(comment="B is right", upvotedNum=2, selectedAnswer="B"),
            QuestionDiscussion(comment="A again", upvotedNum=1, selectedAnswer="A"),
        ]
        # When: 割合を算出
        result = calculate_community_votes(discussions)
        # Then: Noneは除外
        self.assertEqual(result, ["A (67%)", "B (33%)"])


class TestValidateRequest(TestCase):
    """validate_request関数のテストケース"""

    def test_validate_request_success(self):
        """バリデーションチェックに成功した場合のテスト"""
        # Given: 有効なルートパラメータ
        req = MagicMock(spec=func.HttpRequest)
        req.route_params = {"testId": "1", "questionNumber": "1"}
        # When: バリデーション
        result = validate_request(req)
        # Then: 成功
        self.assertIsNone(result)

    def test_validate_request_test_id_empty(self):
        """testIdが空である場合のテスト"""
        # Given: testIdなし
        req = MagicMock(spec=func.HttpRequest)
        req.route_params = {"questionNumber": "1"}
        # When: バリデーション
        result = validate_request(req)
        # Then: エラー
        self.assertEqual(result, "testId is Empty")

    def test_validate_request_question_number_empty(self):
        """questionNumberが空である場合のテスト"""
        # Given: questionNumberなし
        req = MagicMock(spec=func.HttpRequest)
        req.route_params = {"testId": "1"}
        # When: バリデーション
        result = validate_request(req)
        # Then: エラー
        self.assertEqual(result, "questionNumber is Empty")

    def test_validate_request_question_number_not_digit(self):
        """questionNumberが数値でない場合のテスト"""
        # Given: 非数値のquestionNumber
        req = MagicMock(spec=func.HttpRequest)
        req.route_params = {"testId": "1", "questionNumber": "a"}
        # When: バリデーション
        result = validate_request(req)
        # Then: エラー
        self.assertEqual(result, "Invalid questionNumber: a")


class TestGetVotes(TestCase):
    """get_votes関数のテストケース"""

    @patch("src.get_votes.validate_request")
    @patch("src.get_votes.get_read_only_container")
    @patch("src.get_votes.logging")
    def test_get_votes_success(
        self, mock_logging, mock_get_read_only_container, mock_validate_request
    ):
        """正常にvotesを取得する場合のテスト"""
        # Given: discussionsを持つQuestion項目
        mock_validate_request.return_value = None
        mock_container = MagicMock()
        mock_item: Question = {
            "id": "1_1",
            "number": 1,
            "subjects": ["What is 2 + 2?"],
            "choices": ["3", "4", "5"],
            "answerNum": 1,
            "testId": "1",
            "discussions": [
                {
                    "comment": "I think the answer is B because 2 + 2 = 4.",
                    "upvotedNum": 10,
                    "selectedAnswer": "B",
                },
                {
                    "comment": "C is also possible.",
                    "upvotedNum": 3,
                    "selectedAnswer": "C",
                },
                {
                    "comment": "B is definitely correct.",
                    "upvotedNum": 2,
                    "selectedAnswer": "B",
                },
            ],
        }
        mock_container.read_item.return_value = mock_item
        mock_get_read_only_container.return_value = mock_container

        req = MagicMock(spec=func.HttpRequest)
        req.route_params = {"testId": "1", "questionNumber": "1"}

        # When: get_votesを実行
        response = get_votes(req)

        # Then: 200と割合配列
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "application/json")
        expected_body = ["B (67%)", "C (33%)"]
        self.assertEqual(json.loads(response.get_body().decode()), expected_body)

        mock_validate_request.assert_called_once_with(req)
        mock_get_read_only_container.assert_called_once_with(
            database_name="Users",
            container_name="Question",
        )
        mock_container.read_item.assert_called_once_with(
            item="1_1",
            partition_key="1",
        )
        mock_logging.info.assert_has_calls(
            [
                call({"question_number": "1", "test_id": "1"}),
                call({"item": mock_item}),
                call({"votes": expected_body}),
            ]
        )
        mock_logging.error.assert_not_called()

    @patch("src.get_votes.validate_request")
    @patch("src.get_votes.get_read_only_container")
    @patch("src.get_votes.logging")
    def test_get_votes_no_discussions(
        self, mock_logging, mock_get_read_only_container, mock_validate_request
    ):
        """discussionsが存在しない場合のテスト"""
        # Given: discussionsなしのQuestion項目
        mock_validate_request.return_value = None
        mock_container = MagicMock()
        mock_item: Question = {
            "id": "1_1",
            "number": 1,
            "subjects": ["What is 2 + 2?"],
            "choices": ["3", "4", "5"],
            "answerNum": 1,
            "testId": "1",
            "discussions": None,
        }
        mock_container.read_item.return_value = mock_item
        mock_get_read_only_container.return_value = mock_container

        req = MagicMock(spec=func.HttpRequest)
        req.route_params = {"testId": "1", "questionNumber": "1"}

        # When: get_votesを実行
        response = get_votes(req)

        # Then: 空配列
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.get_body().decode()), [])

        mock_logging.error.assert_not_called()

    @patch("src.get_votes.validate_request")
    def test_get_votes_validation_error(self, mock_validate_request):
        """バリデーションチェックに失敗した場合のテスト"""
        # Given: バリデーションエラー
        mock_validate_request.return_value = "Validation Error"

        req = MagicMock(spec=func.HttpRequest)
        req.route_params = {"testId": "1", "questionNumber": "1"}

        # When: get_votesを実行
        response = get_votes(req)

        # Then: 400
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_body().decode(), "Validation Error")

    @patch("src.get_votes.validate_request")
    @patch("src.get_votes.get_read_only_container")
    @patch("src.get_votes.logging")
    def test_get_votes_not_found_question(
        self, mock_logging, mock_get_read_only_container, mock_validate_request
    ):
        """Questionコンテナーの項目が見つからない場合のテスト"""
        # Given: CosmosResourceNotFoundError
        mock_validate_request.return_value = None
        mock_container = MagicMock()
        mock_container.read_item.side_effect = CosmosResourceNotFoundError(
            message="Not Found"
        )
        mock_get_read_only_container.return_value = mock_container

        req = MagicMock(spec=func.HttpRequest)
        req.route_params = {"testId": "1", "questionNumber": "1"}

        # When: get_votesを実行
        response = get_votes(req)

        # Then: 404
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_body().decode(), "Not Found Question")
        mock_logging.error.assert_not_called()

    @patch("src.get_votes.validate_request")
    @patch("src.get_votes.get_read_only_container")
    @patch("src.get_votes.logging")
    def test_get_votes_exception(
        self, mock_logging, mock_get_read_only_container, mock_validate_request
    ):
        """例外が発生した場合のテスト"""
        # Given: 予期しない例外
        mock_validate_request.return_value = None
        mock_get_read_only_container.side_effect = Exception(
            "Error in src.get_votes.get_read_only_container"
        )

        req = MagicMock(spec=func.HttpRequest)
        req.route_params = {"testId": "1", "questionNumber": "1"}

        # When: get_votesを実行
        response = get_votes(req)

        # Then: 500
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.get_body().decode(), "Internal Server Error")
        mock_logging.error.assert_called_once()
