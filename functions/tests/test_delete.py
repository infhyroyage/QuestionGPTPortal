"""delete.py の引数解析とエントリーポイントのテスト"""

import os
import runpy
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from unittest.mock import MagicMock, patch

from delete import get_container, main, parse_args

COURSE_QUERY = "SELECT * FROM c WHERE c.courseName = @courseName"


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
        self._assert_parse_error(
            ["--course-name", "AWS", "AWS-SAA"],
            "unrecognized arguments",
        )

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
        mock_client_cls.assert_called_once_with(
            url="https://example", credential="secret"
        )
        mock_client_cls.return_value.get_database_client.assert_called_once_with(
            "Users"
        )
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
        mock_client_cls.assert_called_once_with(
            url="https://example", credential="secret"
        )


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
        script = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "delete.py")
        )
        env = {"COSMOSDB_URI": "https://example", "COSMOSDB_KEY": "secret"}
        stdout = StringIO()

        # When: スクリプトを --course-name で実行する
        with patch.dict(os.environ, env):
            with patch.object(sys, "argv", ["delete.py", "--course-name", "AWS-SAA"]):
                with redirect_stdout(stdout):
                    runpy.run_path(script, run_name="__main__")

        # Then: コース名の未検出メッセージを出す
        self.assertIn(
            "No Test items found for courseName: AWS-SAA", stdout.getvalue()
        )
        mock_container.query_items.assert_called_once_with(
            query=COURSE_QUERY,
            parameters=[{"name": "@courseName", "value": "AWS-SAA"}],
            partition_key="AWS-SAA",
        )
