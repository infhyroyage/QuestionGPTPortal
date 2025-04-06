# ローカル環境構築手順・削除手順

Azure 環境を構築せず、5173 番のポートで Web サーバーを起動すると、ローカル開発を行うことができる。

## 構築手順

1. [QuestionGPTTranslator のローカル環境構築手順・削除手順の構築手順](https://github.com/infhyroyage/QuestionGPTTranslator/blob/main/localenvironment.md#%E6%A7%8B%E7%AF%89%E6%89%8B%E9%A0%86)に従って、API サーバーをすべて起動する。
2. 環境変数`VITE_API_URI`に API サーバーのオリジンを記載したファイル`.env`を、QuestionGPTPortal リポジトリ直下に保存する。
   例えば、API サーバーを localhost の 9229 番のポート上で起動し、`http://localhost:9229/api`をエンドポイントに持つ場合、以下の通りに指定する。
   ```
   VITE_API_URI="http://localhost:9229"
   ```
3. ターミナルを起動して以下のコマンドを実行し、npm パッケージをインストールする。
   ```bash
   npm i
   ```
4. 3 のターミナルで以下のコマンドを実行し、Web サーバーを起動する。実行したターミナルはそのまま放置する。
   ```bash
   npm run dev
   ```

## 削除手順

1. 構築手順の 4 で起動した Web サーバーのターミナルに対して Ctrl+C キーを入力し、起動した Web サーバーを停止する。
2. [QuestionGPTTranslator のローカル環境構築手順・削除手順の削除手順](https://github.com/infhyroyage/QuestionGPTTranslator/blob/main/localenvironment.md#%E5%89%8A%E9%99%A4%E6%89%8B%E9%A0%86)に従って、API サーバーをすべて停止する。
