"""指定したテスト名に対応する各コンテナーの項目を Cosmos DB から削除する"""

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


def delete_items_by_test_id(test_id: str) -> int:
    """
    testId が指定された各コンテナーの項目を削除する

    Args:
        test_id (str): 削除対象の testId

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


def delete_test_item(container: ContainerProxy, item: dict) -> None:
    """
    Test コンテナーの項目を削除する

    Args:
        container (ContainerProxy): Test コンテナー
        item (dict): 削除対象の Test 項目
    """

    container.delete_item(
        item=item["id"],
        partition_key=item["courseName"],
    )
    print(f"Deleted Test item: id={item['id']}, testName={item.get('testName')}")


if __name__ == "__main__":
    # コマンドライン引数からテスト名を取得
    parser: argparse.ArgumentParser = argparse.ArgumentParser(
        description="Delete items by testName"
    )
    parser.add_argument("test_name", help="Test name to delete (testName)")
    args: argparse.Namespace = parser.parse_args()

    # Test コンテナーから指定したテスト名に対応するtestIdを取得
    test_container: ContainerProxy = (
        CosmosClient(
            url=os.environ["COSMOSDB_URI"], credential=os.environ["COSMOSDB_KEY"]
        )
        .get_database_client("Users")
        .get_container_client("Test")
    )
    test_items: list[dict] = list(
        test_container.query_items(
            query="SELECT * FROM c WHERE c.testName = @testName",
            parameters=[{"name": "@testName", "value": args.test_name}],
            partition_key=args.test_name,
        )
    )
    if not test_items:
        print(f"No Test items found for testName: {args.test_name}")
        sys.exit(0)
    if len(test_items) > 1:
        print(f"Multiple Test items found for testName: {args.test_name}")
        sys.exit(1)

    # Test コンテナー以外の各コンテナーの項目を削除
    item_count: int = delete_items_by_test_id(test_items[0]["id"])

    # Test コンテナーの項目を削除
    delete_test_item(test_container, test_items[0])
    print(f"Total deleted items by testName: {args.test_name} : {item_count + 1}")
