"""指定したコース名、テスト名、またはテストIDに対応する各コンテナーの項目を Cosmos DB から削除する"""

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


def get_container(container_name: str) -> ContainerProxy:
    """
    指定したコンテナーのクライアントを取得する

    Args:
        container_name (str): コンテナー名

    Returns:
        ContainerProxy: コンテナークライアント
    """

    return (
        CosmosClient(
            url=os.environ["COSMOSDB_URI"], credential=os.environ["COSMOSDB_KEY"]
        )
        .get_database_client("Users")
        .get_container_client(container_name)
    )


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
        container: ContainerProxy = get_container(container_name)

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
                    container.delete_item(
                        item=item["id"], partition_key=item["testId"]
                    )
                except CosmosResourceNotFoundError:
                    continue
                count += 1
                print(
                    f"Deleted {container_name} item: "
                    f"id={item['id']}, testId={item['testId']}"
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


def delete_by_course_name(course_name: str) -> int:
    """
    指定したコース名に対応する各コンテナーの項目を削除する

    Args:
        course_name (str): 削除対象のコース名

    Returns:
        int: 削除した合計項目数。対象が無い場合は 0
    """

    test_container: ContainerProxy = get_container("Test")
    test_items: list[dict] = list(
        test_container.query_items(
            query="SELECT * FROM c WHERE c.courseName = @courseName",
            parameters=[{"name": "@courseName", "value": course_name}],
            partition_key=course_name,
        )
    )
    if not test_items:
        print(f"No Test items found for courseName: {course_name}")
        return 0

    item_count: int = delete_items_by_test_ids({item["id"] for item in test_items})
    test_item_count: int = delete_test_items(test_container, test_items)
    total: int = item_count + test_item_count
    print(f"Total deleted items by courseName: {course_name} : {total}")
    return total


def delete_by_test_name(test_name: str) -> int:
    """
    指定したテスト名に対応する各コンテナーの項目を削除する

    同名の Test 項目が複数ある場合は何も削除せず終了コード 1 で終了する。

    Args:
        test_name (str): 削除対象のテスト名

    Returns:
        int: 削除した合計項目数。対象が無い場合は 0
    """

    test_container: ContainerProxy = get_container("Test")
    # Test のパーティションキーは courseName なので、テスト名指定時はクロスパーティションで検索する
    test_items: list[dict] = list(
        test_container.query_items(
            query="SELECT * FROM c WHERE c.testName = @testName",
            parameters=[{"name": "@testName", "value": test_name}],
        )
    )
    if not test_items:
        print(f"No Test items found for testName: {test_name}")
        return 0
    if len(test_items) > 1:
        print(f"Multiple Test items found for testName: {test_name}")
        sys.exit(1)

    item_count: int = delete_items_by_test_ids({test_items[0]["id"]})
    test_item_count: int = delete_test_items(test_container, [test_items[0]])
    total: int = item_count + test_item_count
    print(f"Total deleted items by testName: {test_name} : {total}")
    return total


def delete_by_test_id(test_id: str) -> int:
    """
    指定したテストIDに対応する各コンテナーの項目を削除する

    同じ id の Test 項目が複数ある場合は何も削除せず終了コード 1 で終了する。

    Args:
        test_id (str): 削除対象のテストID

    Returns:
        int: 削除した合計項目数。対象が無い場合は 0
    """

    test_container: ContainerProxy = get_container("Test")
    # Test のパーティションキーは courseName なので、テストID指定時はクロスパーティションで検索する
    test_items: list[dict] = list(
        test_container.query_items(
            query="SELECT * FROM c WHERE c.id = @id",
            parameters=[{"name": "@id", "value": test_id}],
        )
    )
    if not test_items:
        print(f"No Test items found for testId: {test_id}")
        return 0
    if len(test_items) > 1:
        print(f"Multiple Test items found for testId: {test_id}")
        sys.exit(1)

    item_count: int = delete_items_by_test_ids({test_items[0]["id"]})
    test_item_count: int = delete_test_items(test_container, [test_items[0]])
    total: int = item_count + test_item_count
    print(f"Total deleted items by testId: {test_id} : {total}")
    return total


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """
    コマンドライン引数を解析する

    第1引数に --course-name、--test-name、--test-id のいずれか、
    第2引数に削除対象を指定する。

    Args:
        argv (list[str] | None): 解析する引数。None の場合は sys.argv を使う

    Returns:
        argparse.Namespace: 解析結果
    """

    parser: argparse.ArgumentParser = argparse.ArgumentParser(
        description="Delete items by courseName, testName, or testId"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--course-name",
        help="Course name to delete (courseName)",
    )
    group.add_argument(
        "--test-name",
        help="Test name to delete (testName)",
    )
    group.add_argument(
        "--test-id",
        help="Test id to delete (id)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """
    引数に応じてコース名、テスト名、またはテストIDの削除を実行する

    Args:
        argv (list[str] | None): コマンドライン引数

    Returns:
        int: 正常終了時は 0
    """

    args: argparse.Namespace = parse_args(argv)
    if args.course_name is not None:
        delete_by_course_name(args.course_name)
        return 0
    if args.test_name is not None:
        delete_by_test_name(args.test_name)
        return 0
    delete_by_test_id(args.test_id)
    return 0


if __name__ == "__main__":
    main()
