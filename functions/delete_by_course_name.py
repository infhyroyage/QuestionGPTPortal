"""指定したコース名に対応する各コンテナーの項目を Cosmos DB から削除する"""

import argparse
import os
import sys

from azure.cosmos import ContainerProxy, CosmosClient
from azure.cosmos.exceptions import CosmosResourceNotFoundError

CONTAINER_NAMES_WITHOUT_TESTS: list[str] = [
    "Answer",
    "Community",
    "Favorite",
    "Progress",
    "Question",
]


def delete_items_by_test_ids(test_ids: set[str]) -> int:
    """
    testId が指定集合に含まれる各コンテナーの項目を削除する

    Args:
        test_ids (set[str]): 削除対象の testId の集合

    Returns:
        int: 削除した合計項目数
    """

    count: int = 0
    for container_name in CONTAINER_NAMES_WITHOUT_TESTS:
        container: ContainerProxy = (
            CosmosClient(
                url=os.environ["COSMOSDB_URI"], credential=os.environ["COSMOSDB_KEY"]
            )
            .get_database_client("Users")
            .get_container_client(container_name)
        )

        for test_id in sorted(test_ids):
            items: list[dict] = list(
                container.query_items(
                    query="SELECT c.id, c.testId FROM c WHERE c.testId = @testId",
                    parameters=[{"name": "@testId", "value": test_id}],
                    partition_key=test_id,
                )
            )
            for item in items:
                try:
                    container.delete_item(item=item["id"], partition_key=item["testId"])
                except CosmosResourceNotFoundError:
                    continue
                count += 1
                print(
                    f"Deleted {container_name} item: id={item['id']}, testId={item['testId']}"
                )
    return count


def delete_test_items(container: ContainerProxy, items: list[dict]) -> int:
    """
    Test コンテナーの項目を削除する

    Args:
        container (ContainerProxy): Test コンテナー
        items (list[dict]): 削除対象の Test 項目

    Returns:
        int: 削除した合計項目数
    """

    count: int = 0
    for item in items:
        container.delete_item(
            item=item["id"],
            partition_key=item["courseName"],
        )
        count += 1
        print(f"Deleted Test item: id={item['id']}, testName={item.get('testName')}")
    return count


if __name__ == "__main__":
    # コマンドライン引数からコース名を取得
    parser: argparse.ArgumentParser = argparse.ArgumentParser(
        description="Delete items by courseName"
    )
    parser.add_argument("course_name", help="Course name to delete (courseName)")
    args: argparse.Namespace = parser.parse_args()

    # Test コンテナーから指定したコース名に対応するtestIdをすべて取得
    test_container: ContainerProxy = (
        CosmosClient(
            url=os.environ["COSMOSDB_URI"], credential=os.environ["COSMOSDB_KEY"]
        )
        .get_database_client("Users")
        .get_container_client("Test")
    )
    test_items: list[dict] = list(
        test_container.query_items(
            query="SELECT * FROM c WHERE c.courseName = @courseName",
            parameters=[{"name": "@courseName", "value": args.course_name}],
            partition_key=args.course_name,
        )
    )
    if not test_items:
        print(f"No Test items found for courseName: {args.course_name}")
        sys.exit(0)

    # Test コンテナー以外の各コンテナーの項目を削除
    item_count: int = delete_items_by_test_ids({item["id"] for item in test_items})

    # Test コンテナーの項目を削除
    test_item_count: int = delete_test_items(test_container, test_items)

    print(
        f"Total deleted items by courseName: {args.course_name} : {item_count + test_item_count}"
    )
