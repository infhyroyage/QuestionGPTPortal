"""delete.py のユニットテスト"""

import os
import runpy
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from unittest.mock import MagicMock, call, patch

from azure.cosmos.exceptions import CosmosResourceNotFoundError

from delete import (
    CONTAINER_NAMES_WITHOUT_TESTS,
    delete_by_course_name,
    delete_by_test_name,
    delete_items_by_test_ids,
    delete_test_items,
    get_container,
    main,
    parse_args,
)

CHILD_QUERY = "SELECT c.id, c.testId FROM c WHERE c.testId = @testId"
COURSE_QUERY = "SELECT * FROM c WHERE c.courseName = @courseName"
TEST_QUERY = "SELECT * FROM c WHERE c.testName = @testName"


def _prepare(mock_get_container: MagicMock) -> dict[str, MagicMock]:
    """各コンテナーのモックを用意し、クエリ結果は空にする"""
    containers = {
        name: MagicMock() for name in ["Test", *CONTAINER_NAMES_WITHOUT_TESTS]
    }
    mock_get_container.side_effect = containers.__getitem__
    for container in containers.values():
        container.query_items.return_value = []
    return containers


def _child_query_call(test_id: str) -> call:
    """関連コンテナー検索の期待呼び出しを返す"""
    return call(
        query=CHILD_QUERY,
        parameters=[{"name": "@testId", "value": test_id}],
        partition_key=test_id,
    )


class TestParseArgs(unittest.TestCase):
    """コマンドライン引数のテストケース"""

    def test_parse_course_name(self):
        """TC-N-01: --course-name でコース名を受け取る"""
        # Given: コース名フラグとコース名
        # When: 引数を解析する
        args = parse_args(["--course-name", "AWS-SAA"])

        # Then: コース名だけが設定される
        self.assertEqual(args.course_name, "AWS-SAA")
        self.assertIsNone(args.test_name)

    def test_parse_test_name(self):
        """TC-N-02: --test-name でテスト名を受け取る"""
        # Given: テスト名フラグとテスト名
        # When: 引数を解析する
        args = parse_args(["--test-name", "Practice-1"])

        # Then: テスト名だけが設定される
        self.assertEqual(args.test_name, "Practice-1")
        self.assertIsNone(args.course_name)

    def test_parse_empty_course_name(self):
        """TC-B-01: 空のコース名を受け取る"""
        # Given: 空文字のコース名
        # When: 引数を解析する
        args = parse_args(["--course-name", ""])

        # Then: 空文字のままコース名になる
        self.assertEqual(args.course_name, "")
        self.assertIsNone(args.test_name)

    def test_parse_empty_test_name(self):
        """TC-B-02: 空のテスト名を受け取る"""
        # Given: 空文字のテスト名
        # When: 引数を解析する
        args = parse_args(["--test-name", ""])

        # Then: 空文字のままテスト名になる
        self.assertEqual(args.test_name, "")
        self.assertIsNone(args.course_name)

    def test_parse_course_name_zero(self):
        """TC-B-03: コース名 0 を文字列として受け取る"""
        # Given: コース名が文字列の 0
        # When: 引数を解析する
        args = parse_args(["--course-name", "0"])

        # Then: 数値へ変換されず文字列 0 になる
        self.assertEqual(args.course_name, "0")

    def test_parse_test_name_zero(self):
        """TC-B-04: テスト名 0 を文字列として受け取る"""
        # Given: テスト名が文字列の 0
        # When: 引数を解析する
        args = parse_args(["--test-name", "0"])

        # Then: 数値へ変換されず文字列 0 になる
        self.assertEqual(args.test_name, "0")

    def test_parse_requires_flag(self):
        """TC-A-01: 引数なしは受け付けない"""
        # Given: 引数なし
        # When: 引数を解析する
        # Then: 終了コード 2 で必須エラーになる
        self._assert_parse_error([], "is required")

    def test_parse_rejects_both_flags(self):
        """TC-A-02: 両方のフラグは同時に指定できない"""
        # Given: コース名とテスト名の両方
        # When: 引数を解析する
        # Then: 終了コード 2 で排他エラーになる
        self._assert_parse_error(
            ["--course-name", "AWS", "--test-name", "SAA"],
            "not allowed with argument",
        )

    def test_parse_course_name_missing_value(self):
        """TC-A-03: --course-name の値が無い"""
        # Given: コース名フラグのみ
        # When: 引数を解析する
        # Then: 終了コード 2 で値不足エラーになる
        self._assert_parse_error(["--course-name"], "expected one argument")

    def test_parse_test_name_missing_value(self):
        """TC-A-04: --test-name の値が無い"""
        # Given: テスト名フラグのみ
        # When: 引数を解析する
        # Then: 終了コード 2 で値不足エラーになる
        self._assert_parse_error(["--test-name"], "expected one argument")

    def test_parse_unknown_flag(self):
        """TC-A-05: 未知のフラグは受け付けない"""
        # Given: 正しいフラグに加えて未定義のフラグがある
        # When: 引数を解析する
        # Then: 終了コード 2 で不正引数エラーになる
        self._assert_parse_error(
            ["--course-name", "AWS", "--unknown", "x"],
            "unrecognized arguments",
        )

    def test_parse_rejects_positional(self):
        """TC-A-06: 旧仕様の位置引数だけでは受け付けない"""
        # Given: フラグなしのコース名
        # When: 引数を解析する
        # Then: 終了コード 2 で必須フラグ不足として拒否する
        self._assert_parse_error(["AWS-SAA"], "is required")

        # Given: フラグに加えて位置引数がある
        # When: 引数を解析する
        # Then: 終了コード 2 で不正引数エラーになる
        self._assert_parse_error(["--course-name", "AWS", "AWS-SAA"], "unrecognized arguments",)

    def test_parse_help(self):
        """TC-A-07: ヘルプは削除せず終了コード 0 になる"""
        # Given: ヘルプフラグ
        stdout = StringIO()

        # When: 引数を解析する
        with redirect_stdout(stdout):
            with self.assertRaises(SystemExit) as ctx:
                parse_args(["-h"])

        # Then: 終了コード 0 で両方のフラグを案内する
        self.assertEqual(ctx.exception.code, 0)
        self.assertIn("--course-name", stdout.getvalue())
        self.assertIn("--test-name", stdout.getvalue())

    def _assert_parse_error(self, argv: list[str], message: str) -> None:
        """引数エラーの終了コードとメッセージを検証する"""
        stderr = StringIO()
        with redirect_stderr(stderr):
            with self.assertRaises(SystemExit) as ctx:
                parse_args(argv)
        self.assertEqual(ctx.exception.code, 2)
        self.assertIn(message, stderr.getvalue())


class TestGetContainer(unittest.TestCase):
    """get_container 関数のテストケース"""

    @patch("delete.CosmosClient")
    def test_get_container_success(self, mock_client_cls):
        """TC-N-03: URI とキーで Users 配下のコンテナーを取得する"""
        # Given: 接続情報とコンテナー名
        mock_container = MagicMock()
        database = mock_client_cls.return_value.get_database_client.return_value
        database.get_container_client.return_value = mock_container
        env = {"COSMOSDB_URI": "https://example", "COSMOSDB_KEY": "secret"}

        # When: Question コンテナーを取得する
        with patch.dict(os.environ, env):
            result = get_container("Question")

        # Then: 指定した URI・キー・データベース・コンテナーで接続する
        self.assertIs(result, mock_container)
        mock_client_cls.assert_called_once_with(url="https://example", credential="secret")
        mock_client_cls.return_value.get_database_client.assert_called_once_with("Users")
        database.get_container_client.assert_called_once_with("Question")

    @patch("delete.CosmosClient")
    def test_get_container_empty_credentials(self, mock_client_cls):
        """TC-B-05: 空の URI とキーもそのまま渡す"""
        # Given: URI とキーが空文字
        env = {"COSMOSDB_URI": "", "COSMOSDB_KEY": ""}

        # When: コンテナーを取得する
        with patch.dict(os.environ, env):
            get_container("Test")

        # Then: 空文字のままクライアントを生成する
        mock_client_cls.assert_called_once_with(url="", credential="")

    def test_get_container_missing_uri(self):
        """TC-A-08: COSMOSDB_URI が未設定なら KeyError"""
        # Given: キーのみ設定されている
        env = {"COSMOSDB_KEY": "secret"}

        # When: コンテナーを取得する
        # Then: COSMOSDB_URI の KeyError になる
        with patch.dict(os.environ, env, clear=True):
            with self.assertRaises(KeyError) as ctx:
                get_container("Test")
        self.assertEqual(str(ctx.exception), "'COSMOSDB_URI'")

    def test_get_container_missing_key(self):
        """TC-A-09: COSMOSDB_KEY が未設定なら KeyError"""
        # Given: URI のみ設定されている
        env = {"COSMOSDB_URI": "https://example"}

        # When: コンテナーを取得する
        # Then: COSMOSDB_KEY の KeyError になる
        with patch.dict(os.environ, env, clear=True):
            with self.assertRaises(KeyError) as ctx:
                get_container("Test")
        self.assertEqual(str(ctx.exception), "'COSMOSDB_KEY'")

    @patch("delete.CosmosClient", side_effect=RuntimeError("cosmos unavailable"))
    def test_get_container_client_failure(self, mock_client_cls):
        """TC-A-10: Cosmos クライアント生成失敗を伝播する"""
        # Given: クライアント生成が失敗する
        env = {"COSMOSDB_URI": "https://example", "COSMOSDB_KEY": "secret"}

        # When: コンテナーを取得する
        # Then: RuntimeError とメッセージを伝播する
        with patch.dict(os.environ, env):
            with self.assertRaises(RuntimeError) as ctx:
                get_container("Test")
        self.assertEqual(str(ctx.exception), "cosmos unavailable")
        mock_client_cls.assert_called_once_with(url="https://example", credential="secret")


class TestMain(unittest.TestCase):
    """main とスクリプトエントリーポイントのテストケース"""

    @patch("delete.delete_by_course_name", return_value=2)
    def test_main_course_name(self, mock_delete):
        """TC-N-11: --course-name はコース名削除へ渡す"""
        # Given: コース名フラグ
        # When: main を実行する
        result = main(["--course-name", "AWS-SAA"])

        # Then: コース名削除だけを実行して 0 を返す
        self.assertEqual(result, 0)
        mock_delete.assert_called_once_with("AWS-SAA")

    @patch("delete.delete_by_course_name")
    @patch("delete.delete_by_test_name", return_value=1)
    def test_main_test_name(self, mock_delete_test, mock_delete_course):
        """TC-N-12: --test-name はテスト名削除へ渡す"""
        # Given: テスト名フラグ
        # When: main を実行する
        result = main(["--test-name", "SAA"])

        # Then: テスト名削除だけを実行して 0 を返す
        self.assertEqual(result, 0)
        mock_delete_test.assert_called_once_with("SAA")
        mock_delete_course.assert_not_called()

    @patch("delete.delete_by_course_name", return_value=0)
    def test_main_empty_course_name(self, mock_delete):
        """TC-B-16: 空のコース名もそのまま渡す"""
        # Given: 空文字のコース名
        # When: main を実行する
        result = main(["--course-name", ""])

        # Then: 空文字のままコース名削除する
        self.assertEqual(result, 0)
        mock_delete.assert_called_once_with("")

    @patch("delete.delete_by_test_name", return_value=0)
    def test_main_test_name_zero(self, mock_delete):
        """TC-B-17: テスト名 0 を文字列のまま渡す"""
        # Given: テスト名が文字列の 0
        # When: main を実行する
        result = main(["--test-name", "0"])

        # Then: 文字列 0 のままテスト名削除する
        self.assertEqual(result, 0)
        mock_delete.assert_called_once_with("0")

    @patch("delete.delete_by_test_name", side_effect=SystemExit(1))
    def test_main_propagates_exit(self, mock_delete):
        """TC-A-22: 複数一致の終了コード 1 を伝播する"""
        # Given: テスト名削除が終了コード 1 で終わる
        # When: main を実行する
        # Then: 終了コード 1 が伝播する
        with self.assertRaises(SystemExit) as ctx:
            main(["--test-name", "SAA"])
        self.assertEqual(ctx.exception.code, 1)
        mock_delete.assert_called_once_with("SAA")

    def test_main_without_args(self):
        """TC-A-23: フラグなしでは main も失敗する"""
        # Given: 引数なし
        stderr = StringIO()

        # When: main を実行する
        with redirect_stderr(stderr):
            with self.assertRaises(SystemExit) as ctx:
                main([])

        # Then: 終了コード 2 で必須エラーになる
        self.assertEqual(ctx.exception.code, 2)
        self.assertIn("is required", stderr.getvalue())

    @patch("azure.cosmos.CosmosClient")
    def test_script_entrypoint(self, mock_client_cls):
        """TC-N-13: スクリプト実行時に --course-name の削除処理へ入る"""
        # Given: 対象コースが存在しない
        mock_container = MagicMock()
        database = mock_client_cls.return_value.get_database_client.return_value
        database.get_container_client.return_value = mock_container
        mock_container.query_items.return_value = []
        script = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "delete.py"))
        env = {"COSMOSDB_URI": "https://example", "COSMOSDB_KEY": "secret"}
        stdout = StringIO()

        # When: スクリプトを --course-name で実行する
        with patch.dict(os.environ, env):
            with patch.object(sys, "argv", ["delete.py", "--course-name", "AWS-SAA"]):
                with redirect_stdout(stdout):
                    runpy.run_path(script, run_name="__main__")

        # Then: コース名の未検出メッセージを出す
        self.assertIn("No Test items found for courseName: AWS-SAA", stdout.getvalue())
        mock_container.query_items.assert_called_once_with(
            query=COURSE_QUERY,
            parameters=[{"name": "@courseName", "value": "AWS-SAA"}],
            partition_key="AWS-SAA",
        )


class TestDeleteItemsByTestIds(unittest.TestCase):
    """delete_items_by_test_ids 関数のテストケース"""

    @patch("delete.get_container")
    def test_delete_items_single_id(self, mock_get_container):
        """TC-N-04: 1件の testId に紐づく項目を削除する"""
        # Given: Answer と Question に対象が1件ずつある
        containers = _prepare(mock_get_container)
        containers["Answer"].query_items.return_value = [{"id": "a1", "testId": "t1"}]
        containers["Question"].query_items.return_value = [{"id": "q1", "testId": "t1"}]

        # When: testId t1 を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_items_by_test_ids({"t1"})

        # Then: 2件削除し、パーティションキーは testId
        self.assertEqual(total, 2)
        containers["Answer"].delete_item.assert_called_once_with(item="a1", partition_key="t1")
        containers["Question"].delete_item.assert_called_once_with(item="q1", partition_key="t1")
        containers["Answer"].query_items.assert_called_once_with(
            query=CHILD_QUERY,
            parameters=[{"name": "@testId", "value": "t1"}],
            partition_key="t1",
        )
        self.assertIn("Deleted Answer item: id=a1, testId=t1", stdout.getvalue())
        self.assertIn("Deleted Question item: id=q1, testId=t1", stdout.getvalue())

    @patch("delete.get_container")
    def test_delete_items_multiple_ids_sorted(self, mock_get_container):
        """TC-N-05: 複数 testId は昇順で検索する"""
        # Given: 順不同の testId が2件
        containers = _prepare(mock_get_container)

        # When: 集合 b, a を削除する
        with redirect_stdout(StringIO()):
            total = delete_items_by_test_ids({"b", "a"})

        # Then: 各コンテナーで a の次に b を検索し、削除件数は 0
        self.assertEqual(total, 0)
        expected = [_child_query_call("a"), _child_query_call("b")]
        for name in CONTAINER_NAMES_WITHOUT_TESTS:
            containers[name].query_items.assert_has_calls(expected)
            containers[name].delete_item.assert_not_called()

    @patch("delete.get_container")
    def test_delete_items_empty_ids(self, mock_get_container):
        """TC-B-06: testId が 0 件なら削除しない"""
        # Given: 空の testId 集合
        containers = _prepare(mock_get_container)

        # When: 空集合で削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_items_by_test_ids(set())

        # Then: 検索も削除もせず 0 を返す
        self.assertEqual(total, 0)
        self.assertEqual(stdout.getvalue(), "")
        containers["Answer"].query_items.assert_not_called()
        self.assertEqual(
            mock_get_container.call_args_list,
            [call(name) for name in CONTAINER_NAMES_WITHOUT_TESTS],
        )

    @patch("delete.get_container")
    def test_delete_items_no_matching_items(self, mock_get_container):
        """TC-B-07: 一致項目が空なら削除しない"""
        # Given: 検索結果がすべて空
        containers = _prepare(mock_get_container)

        # When: testId t1 を削除する
        with redirect_stdout(StringIO()):
            total = delete_items_by_test_ids({"t1"})

        # Then: 削除せず 0 を返す
        self.assertEqual(total, 0)
        containers["Answer"].delete_item.assert_not_called()
        containers["Answer"].query_items.assert_called_once()

    @patch("delete.get_container")
    def test_delete_items_not_found_is_skipped(self, mock_get_container):
        """TC-A-11: 削除時の CosmosResourceNotFoundError はスキップする"""
        # Given: 先頭項目だけ既に存在しない
        containers = _prepare(mock_get_container)
        containers["Answer"].query_items.return_value = [
            {"id": "a1", "testId": "t1"},
            {"id": "a2", "testId": "t1"},
        ]
        containers["Community"].query_items.return_value = [{"id": "c1", "testId": "t1"}]
        containers["Answer"].delete_item.side_effect = [
            CosmosResourceNotFoundError(message="Resource Not Found"),
            None,
        ]

        # When: testId t1 を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_items_by_test_ids({"t1"})

        # Then: 見つからない項目を除いた 2 件だけ削除する
        self.assertEqual(total, 2)
        self.assertNotIn("id=a1", stdout.getvalue())
        self.assertIn("Deleted Answer item: id=a2, testId=t1", stdout.getvalue())
        self.assertIn("Deleted Community item: id=c1, testId=t1", stdout.getvalue())

    @patch("delete.get_container")
    def test_delete_items_none_ids(self, mock_get_container):
        """TC-A-12: testId 集合が NULL なら TypeError"""
        # Given: testId が None
        # When: 削除する
        # Then: NoneType の TypeError になる
        with self.assertRaises(TypeError) as ctx:
            delete_items_by_test_ids(None)
        self.assertEqual(str(ctx.exception), "'NoneType' object is not iterable")
        mock_get_container.assert_called_once_with("Answer")

    @patch("delete.get_container")
    def test_delete_items_query_failure(self, mock_get_container):
        """TC-A-13: 検索失敗を伝播する"""
        # Given: Answer の検索が失敗する
        containers = _prepare(mock_get_container)
        containers["Answer"].query_items.side_effect = RuntimeError("query failed")

        # When: testId t1 を削除する
        # Then: RuntimeError とメッセージを伝播する
        with self.assertRaises(RuntimeError) as ctx:
            delete_items_by_test_ids({"t1"})
        self.assertEqual(str(ctx.exception), "query failed")
        containers["Answer"].delete_item.assert_not_called()

    @patch("delete.get_container")
    def test_delete_items_delete_failure(self, mock_get_container):
        """TC-A-14: NotFound 以外の削除失敗を伝播する"""
        # Given: 削除が RuntimeError で失敗する
        containers = _prepare(mock_get_container)
        containers["Answer"].query_items.return_value = [{"id": "a1", "testId": "t1"}]
        containers["Answer"].delete_item.side_effect = RuntimeError("delete failed")

        # When: testId t1 を削除する
        # Then: RuntimeError とメッセージを伝播する
        with self.assertRaises(RuntimeError) as ctx:
            delete_items_by_test_ids({"t1"})
        self.assertEqual(str(ctx.exception), "delete failed")

    @patch("delete.get_container")
    def test_delete_items_missing_test_id_field(self, mock_get_container):
        """TC-A-26: testId が無い項目は KeyError"""
        # Given: testId を持たない項目
        containers = _prepare(mock_get_container)
        containers["Answer"].query_items.return_value = [{"id": "a1"}]

        # When: testId t1 を削除する
        # Then: testId の KeyError になり削除は呼ばれない
        with self.assertRaises(KeyError) as ctx:
            delete_items_by_test_ids({"t1"})
        self.assertEqual(str(ctx.exception), "'testId'")
        containers["Answer"].delete_item.assert_not_called()


class TestDeleteTestItems(unittest.TestCase):
    """delete_test_items 関数のテストケース"""

    def test_delete_test_items_one(self):
        """TC-N-06: Test 項目を1件削除する"""
        # Given: Test 項目が1件
        container = MagicMock()
        item = {"id": "t1", "courseName": "AWS", "testName": "SAA"}

        # When: Test 項目を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_test_items(container, [item])

        # Then: コース名をパーティションキーとして1件削除する
        self.assertEqual(total, 1)
        container.delete_item.assert_called_once_with(item="t1", partition_key="AWS")
        self.assertIn("Deleted Test item: id=t1, testName=SAA", stdout.getvalue())

    def test_delete_test_items_two(self):
        """TC-N-07: Test 項目を2件削除する"""
        # Given: Test 項目が2件
        container = MagicMock()
        items = [
            {"id": "t1", "courseName": "AWS", "testName": "DVA"},
            {"id": "t2", "courseName": "AWS", "testName": "SAA"},
        ]

        # When: Test 項目を削除する
        with redirect_stdout(StringIO()):
            total = delete_test_items(container, items)

        # Then: 2件削除する
        self.assertEqual(total, 2)
        self.assertEqual(container.delete_item.call_count, 2)

    def test_delete_test_items_empty(self):
        """TC-B-08: 削除対象が 0 件なら何もしない"""
        # Given: 空のリスト
        container = MagicMock()

        # When: Test 項目を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_test_items(container, [])

        # Then: 削除せず 0 を返す
        self.assertEqual(total, 0)
        self.assertEqual(stdout.getvalue(), "")
        container.delete_item.assert_not_called()

    def test_delete_test_items_none(self):
        """TC-A-15: 削除対象が NULL なら TypeError"""
        # Given: 項目リストが None
        # When: Test 項目を削除する
        # Then: NoneType の TypeError になる
        with self.assertRaises(TypeError) as ctx:
            delete_test_items(MagicMock(), None)
        self.assertEqual(str(ctx.exception), "'NoneType' object is not iterable")

    def test_delete_test_items_missing_id(self):
        """TC-A-16: id が無い項目は KeyError"""
        # Given: id が無い項目
        container = MagicMock()

        # When: Test 項目を削除する
        # Then: id の KeyError になり削除は呼ばれない
        with self.assertRaises(KeyError) as ctx:
            delete_test_items(container, [{"courseName": "AWS"}])
        self.assertEqual(str(ctx.exception), "'id'")
        container.delete_item.assert_not_called()

    def test_delete_test_items_missing_course_name(self):
        """TC-A-17: courseName が無い項目は KeyError"""
        # Given: courseName が無い項目
        container = MagicMock()

        # When: Test 項目を削除する
        # Then: courseName の KeyError になり削除は呼ばれない
        with self.assertRaises(KeyError) as ctx:
            delete_test_items(container, [{"id": "t1"}])
        self.assertEqual(str(ctx.exception), "'courseName'")
        container.delete_item.assert_not_called()

    def test_delete_test_items_not_found_propagates(self):
        """TC-A-18: Test 削除時の CosmosResourceNotFoundError は伝播する"""
        # Given: 削除対象が存在しない
        container = MagicMock()
        container.delete_item.side_effect = CosmosResourceNotFoundError(
            message="Resource Not Found"
        )
        item = {"id": "t1", "courseName": "AWS", "testName": "SAA"}

        # When: Test 項目を削除する
        # Then: 例外の型とメッセージを伝播する
        with self.assertRaises(CosmosResourceNotFoundError) as ctx:
            delete_test_items(container, [item])
        self.assertIn("Resource Not Found", str(ctx.exception))

    def test_delete_test_items_empty_strings(self):
        """TC-B-09: 空の id と courseName もそのまま削除する"""
        # Given: id と courseName が空文字
        container = MagicMock()
        item = {"id": "", "courseName": "", "testName": ""}

        # When: Test 項目を削除する
        with redirect_stdout(StringIO()):
            total = delete_test_items(container, [item])

        # Then: 空文字のまま1件削除する
        self.assertEqual(total, 1)
        container.delete_item.assert_called_once_with(item="", partition_key="")


class TestDeleteByCourseName(unittest.TestCase):
    """delete_by_course_name 関数のテストケース"""

    @patch("delete.get_container")
    def test_delete_by_course_name_multiple(self, mock_get_container):
        """TC-N-08: コース内の複数テストと関連項目を削除する"""
        # Given: コース AWS にテストが2件あり、Answer に各1件ある
        containers = _prepare(mock_get_container)
        containers["Test"].query_items.return_value = [
            {"id": "t1", "courseName": "AWS", "testName": "DVA"},
            {"id": "t2", "courseName": "AWS", "testName": "SAA"},
        ]
        responses = {
            "t1": [{"id": "a1", "testId": "t1"}],
            "t2": [{"id": "a2", "testId": "t2"}],
        }

        def query_by_test_id(**kwargs):
            """testId に対応する Answer 項目を返す"""
            return responses[kwargs["parameters"][0]["value"]]

        containers["Answer"].query_items.side_effect = query_by_test_id
        order: list[str] = []

        def record_answer(**kwargs):
            """Answer の削除を記録する"""
            order.append(f"Answer:{kwargs['item']}")

        def record_test(**kwargs):
            """Test の削除を記録する"""
            order.append(f"Test:{kwargs['item']}")

        containers["Answer"].delete_item.side_effect = record_answer
        containers["Test"].delete_item.side_effect = record_test

        # When: コース名 AWS を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_by_course_name("AWS")

        # Then: 関連項目の後に Test を削除し、合計4件になる
        output = stdout.getvalue()
        self.assertEqual(total, 4)
        self.assertEqual(order, ["Answer:a1", "Answer:a2", "Test:t1", "Test:t2"])
        containers["Test"].query_items.assert_called_once_with(
            query=COURSE_QUERY,
            parameters=[{"name": "@courseName", "value": "AWS"}],
            partition_key="AWS",
        )
        containers["Community"].delete_item.assert_not_called()
        self.assertIn("Total deleted items by courseName: AWS : 4", output)
        self.assertEqual(
            mock_get_container.call_args_list,
            [call("Test"), *[call(name) for name in CONTAINER_NAMES_WITHOUT_TESTS]],
        )

    @patch("delete.get_container")
    def test_delete_by_course_name_single(self, mock_get_container):
        """TC-N-09: コース内のテストが1件で関連項目が0件でも Test を削除する"""
        # Given: テストが1件あり、関連項目は無い
        containers = _prepare(mock_get_container)
        containers["Test"].query_items.return_value = [
            {"id": "t1", "courseName": "AWS", "testName": "SAA"}
        ]

        # When: コース名 AWS を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_by_course_name("AWS")

        # Then: Test 項目1件だけ削除する
        self.assertEqual(total, 1)
        containers["Test"].delete_item.assert_called_once_with(item="t1", partition_key="AWS")
        containers["Answer"].delete_item.assert_not_called()
        self.assertIn("Total deleted items by courseName: AWS : 1", stdout.getvalue())

    @patch("delete.get_container")
    def test_delete_by_course_name_not_found(self, mock_get_container):
        """TC-B-10: コースにテストが 0 件なら削除しない"""
        # Given: 一致する Test が無い
        containers = _prepare(mock_get_container)

        # When: コース名 AWS を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_by_course_name("AWS")

        # Then: メッセージを出して 0 を返し、他コンテナーは開かない
        self.assertEqual(total, 0)
        self.assertEqual(stdout.getvalue(), "No Test items found for courseName: AWS\n")
        mock_get_container.assert_called_once_with("Test")
        containers["Test"].delete_item.assert_not_called()

    @patch("delete.get_container")
    def test_delete_by_course_name_empty(self, mock_get_container):
        """TC-B-11: 空のコース名でも空文字のまま検索する"""
        # Given: コース名が空文字
        containers = _prepare(mock_get_container)

        # When: 空のコース名を削除する
        with redirect_stdout(StringIO()):
            total = delete_by_course_name("")

        # Then: 空文字で検索して 0 を返す
        self.assertEqual(total, 0)
        containers["Test"].query_items.assert_called_once_with(
            query=COURSE_QUERY,
            parameters=[{"name": "@courseName", "value": ""}],
            partition_key="",
        )

    @patch("delete.get_container")
    def test_delete_by_course_name_none(self, mock_get_container):
        """TC-B-12: コース名 NULL はそのまま検索する"""
        # Given: コース名が None
        containers = _prepare(mock_get_container)

        # When: None を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_by_course_name(None)

        # Then: None で検索し、対象なしとして 0 を返す
        self.assertEqual(total, 0)
        self.assertIn("courseName: None", stdout.getvalue())
        containers["Test"].query_items.assert_called_once_with(
            query=COURSE_QUERY,
            parameters=[{"name": "@courseName", "value": None}],
            partition_key=None,
        )

    @patch("delete.get_container")
    def test_delete_by_course_name_query_failure(self, mock_get_container):
        """TC-A-19: コース検索の失敗を伝播する"""
        # Given: Test 検索が失敗する
        containers = _prepare(mock_get_container)
        containers["Test"].query_items.side_effect = RuntimeError("query failed")

        # When: コース名 AWS を削除する
        # Then: RuntimeError を伝播し、Test は削除しない
        with self.assertRaises(RuntimeError) as ctx:
            delete_by_course_name("AWS")
        self.assertEqual(str(ctx.exception), "query failed")
        containers["Test"].delete_item.assert_not_called()
        mock_get_container.assert_called_once_with("Test")

    @patch("delete.get_container")
    def test_delete_by_course_name_missing_id(self, mock_get_container):
        """TC-A-24: Test 項目に id が無い場合は KeyError"""
        # Given: id が無い Test 項目
        containers = _prepare(mock_get_container)
        containers["Test"].query_items.return_value = [{"courseName": "AWS", "testName": "SAA"}]

        # When: コース名 AWS を削除する
        # Then: id の KeyError になり削除しない
        with self.assertRaises(KeyError) as ctx:
            delete_by_course_name("AWS")
        self.assertEqual(str(ctx.exception), "'id'")
        containers["Test"].delete_item.assert_not_called()

    @patch("delete.get_container")
    def test_delete_by_course_name_zero(self, mock_get_container):
        """TC-B-19: コース名 0 を文字列のまま検索する"""
        # Given: コース名が文字列の 0
        containers = _prepare(mock_get_container)

        # When: コース名 0 を削除する
        with redirect_stdout(StringIO()):
            total = delete_by_course_name("0")

        # Then: 文字列 0 で検索する
        self.assertEqual(total, 0)
        containers["Test"].query_items.assert_called_once_with(
            query=COURSE_QUERY,
            parameters=[{"name": "@courseName", "value": "0"}],
            partition_key="0",
        )

    @patch("delete.get_container")
    def test_delete_by_course_name_untrimmed(self, mock_get_container):
        """TC-B-18: 空白を含むコース名はトリムしない"""
        # Given: 前後に空白があるコース名
        containers = _prepare(mock_get_container)

        # When: 空白付きコース名を削除する
        with redirect_stdout(StringIO()):
            delete_by_course_name(" AWS ")

        # Then: 空白を保持したまま検索する
        containers["Test"].query_items.assert_called_once_with(
            query=COURSE_QUERY,
            parameters=[{"name": "@courseName", "value": " AWS "}],
            partition_key=" AWS ",
        )


class TestDeleteByTestName(unittest.TestCase):
    """delete_by_test_name 関数のテストケース"""

    @patch("delete.get_container")
    def test_delete_by_test_name_single(self, mock_get_container):
        """TC-N-10: テスト名が1件一致した場合に削除する"""
        # Given: テスト名 SAA が1件あり、Answer に2件ある
        containers = _prepare(mock_get_container)
        containers["Test"].query_items.return_value = [
            {"id": "t1", "courseName": "AWS", "testName": "SAA"}
        ]
        containers["Answer"].query_items.return_value = [
            {"id": "a1", "testId": "t1"},
            {"id": "a2", "testId": "t1"},
        ]

        # When: テスト名 SAA を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_by_test_name("SAA")

        # Then: クロスパーティションで検索し、関連2件と Test 1件を削除する
        self.assertEqual(total, 3)
        containers["Test"].query_items.assert_called_once_with(
            query=TEST_QUERY,
            parameters=[{"name": "@testName", "value": "SAA"}],
        )
        self.assertNotIn("partition_key", containers["Test"].query_items.call_args.kwargs)
        containers["Test"].delete_item.assert_called_once_with(item="t1", partition_key="AWS")
        self.assertIn("Total deleted items by testName: SAA : 3", stdout.getvalue())

    @patch("delete.get_container")
    def test_delete_by_test_name_not_found(self, mock_get_container):
        """TC-B-13: テスト名が 0 件なら削除しない"""
        # Given: 一致する Test が無い
        containers = _prepare(mock_get_container)

        # When: テスト名 SAA を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_by_test_name("SAA")

        # Then: メッセージを出して 0 を返し、削除しない
        self.assertEqual(total, 0)
        self.assertEqual(stdout.getvalue(), "No Test items found for testName: SAA\n")
        mock_get_container.assert_called_once_with("Test")
        containers["Test"].delete_item.assert_not_called()

    @patch("delete.get_container")
    def test_delete_by_test_name_multiple(self, mock_get_container):
        """TC-A-20: テスト名が2件一致した場合は削除せず終了する"""
        # Given: 同名テストが2件（複数一致の最小件数）
        containers = _prepare(mock_get_container)
        containers["Test"].query_items.return_value = [
            {"id": "t1", "courseName": "AWS", "testName": "SAA"},
            {"id": "t2", "courseName": "Azure", "testName": "SAA"},
        ]

        # When: テスト名 SAA を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            with self.assertRaises(SystemExit) as ctx:
                delete_by_test_name("SAA")

        # Then: 終了コード 1 で、何も削除しない
        self.assertEqual(ctx.exception.code, 1)
        self.assertEqual(stdout.getvalue(), "Multiple Test items found for testName: SAA\n")
        containers["Test"].delete_item.assert_not_called()
        mock_get_container.assert_called_once_with("Test")

    @patch("delete.get_container")
    def test_delete_by_test_name_empty(self, mock_get_container):
        """TC-B-14: 空のテスト名でも空文字のまま検索する"""
        # Given: テスト名が空文字
        containers = _prepare(mock_get_container)

        # When: 空のテスト名を削除する
        with redirect_stdout(StringIO()):
            total = delete_by_test_name("")

        # Then: 空文字でクロスパーティション検索する
        self.assertEqual(total, 0)
        containers["Test"].query_items.assert_called_once_with(
            query=TEST_QUERY,
            parameters=[{"name": "@testName", "value": ""}],
        )

    @patch("delete.get_container")
    def test_delete_by_test_name_none(self, mock_get_container):
        """TC-B-15: テスト名 NULL はそのまま検索する"""
        # Given: テスト名が None
        containers = _prepare(mock_get_container)

        # When: None を削除する
        stdout = StringIO()
        with redirect_stdout(stdout):
            total = delete_by_test_name(None)

        # Then: None で検索し、対象なしとして 0 を返す
        self.assertEqual(total, 0)
        self.assertIn("testName: None", stdout.getvalue())
        containers["Test"].query_items.assert_called_once_with(
            query=TEST_QUERY,
            parameters=[{"name": "@testName", "value": None}],
        )

    @patch("delete.get_container")
    def test_delete_by_test_name_query_failure(self, mock_get_container):
        """TC-A-21: テスト名検索の失敗を伝播する"""
        # Given: Test 検索が失敗する
        containers = _prepare(mock_get_container)
        containers["Test"].query_items.side_effect = RuntimeError("query failed")

        # When: テスト名 SAA を削除する
        # Then: RuntimeError とメッセージを伝播する
        with self.assertRaises(RuntimeError) as ctx:
            delete_by_test_name("SAA")
        self.assertEqual(str(ctx.exception), "query failed")
        containers["Test"].delete_item.assert_not_called()

    @patch("delete.get_container")
    def test_delete_by_test_name_missing_id(self, mock_get_container):
        """TC-A-25: 一致項目に id が無い場合は KeyError"""
        # Given: id が無い Test 項目が1件
        containers = _prepare(mock_get_container)
        containers["Test"].query_items.return_value = [{"courseName": "AWS", "testName": "SAA"}]

        # When: テスト名 SAA を削除する
        # Then: id の KeyError になり削除しない
        with self.assertRaises(KeyError) as ctx:
            delete_by_test_name("SAA")
        self.assertEqual(str(ctx.exception), "'id'")
        containers["Test"].delete_item.assert_not_called()

    @patch("delete.get_container")
    def test_delete_by_test_name_zero(self, mock_get_container):
        """TC-B-21: テスト名 0 を文字列のまま検索する"""
        # Given: テスト名が文字列の 0
        containers = _prepare(mock_get_container)

        # When: テスト名 0 を削除する
        with redirect_stdout(StringIO()):
            total = delete_by_test_name("0")

        # Then: 文字列 0 で検索する
        self.assertEqual(total, 0)
        containers["Test"].query_items.assert_called_once_with(
            query=TEST_QUERY,
            parameters=[{"name": "@testName", "value": "0"}],
        )
