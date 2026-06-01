"""Communityコンテナーの項目をupsertするQueueトリガーの関数アプリのモジュール"""

import json
import logging

import azure.functions as func
from azure.cosmos import ContainerProxy
from type.cosmos import Community
from type.message import MessageDiscussion
from util.cosmos import get_read_write_container

bp_queue_triggered_discussion = func.Blueprint()


@bp_queue_triggered_discussion.queue_trigger(
    arg_name="msg",
    connection="AzureWebJobsStorage",
    queue_name="discussions",
)
def queue_triggered_discussion(msg: func.QueueMessage):
    """
    キューストレージに格納したメッセージからCommunityコンテナーの項目をupsertします
    """

    # メッセージをMessageDiscussion型として読込み
    message_discussion: MessageDiscussion = json.loads(msg.get_body().decode("utf-8"))
    logging.info({"message_discussion": message_discussion})

    # Communityコンテナーの項目をupsert
    container_community: ContainerProxy = get_read_write_container(
        database_name="Users",
        container_name="Community",
    )
    community_item: Community = {
        "id": f"{message_discussion['testId']}_{message_discussion['questionNumber']}",
        "questionNumber": message_discussion["questionNumber"],
        "testId": message_discussion["testId"],
        "discussionsSummary": message_discussion["summary"],
    }
    logging.info({"community_item": community_item})
    container_community.upsert_item(community_item)
