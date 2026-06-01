"""Communityコンテナーの項目をupsertするQueueトリガーの関数アプリのテスト"""

import json
import unittest
from unittest.mock import MagicMock, patch

import azure.functions as func
from src.queue_triggered_discussion import queue_triggered_discussion
from type.cosmos import Community
from type.message import MessageDiscussion


class TestQueueTriggeredCommunity(unittest.TestCase):
    """queue_triggered_discussion関数のテストケース"""

    @patch("src.queue_triggered_discussion.get_read_write_container")
    @patch("src.queue_triggered_discussion.logging")
    def test_queue_triggered_discussion(
        self,
        mock_logging,
        mock_get_read_write_container,
    ):
        """正常にCommunityコンテナーの項目をupsertする場合のテスト"""

        mock_container = MagicMock()
        mock_get_read_write_container.return_value = mock_container

        message_discussion: MessageDiscussion = {
            "testId": "1",
            "questionNumber": 1,
            "summary": "Community discussion focuses on answer B with strong consensus.",
        }

        msg: func.QueueMessage = MagicMock(spec=func.QueueMessage)
        msg.get_body.return_value = json.dumps(message_discussion).encode("utf-8")

        queue_triggered_discussion(msg)

        expected_community_item: Community = {
            "id": "1_1",
            "questionNumber": 1,
            "testId": "1",
            "discussionsSummary": "Community discussion focuses on answer B with strong consensus.",
        }

        mock_get_read_write_container.assert_called_once_with(
            database_name="Users",
            container_name="Community",
        )
        mock_container.upsert_item.assert_called_once_with(expected_community_item)
        mock_logging.info.assert_has_calls(
            [
                unittest.mock.call({"message_discussion": message_discussion}),
                unittest.mock.call({"community_item": expected_community_item}),
            ]
        )
