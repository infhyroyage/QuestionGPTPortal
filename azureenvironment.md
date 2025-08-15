# Azure 環境構築手順・削除手順

## 構築手順

### 1. API サーバーの Azure 環境構築

[QuestionGPTTranslator の Azure 環境構築手順・削除手順の構築手順](https://github.com/infhyroyage/QuestionGPTTranslator/blob/main/azureenvironment.md#%E6%A7%8B%E7%AF%89%E6%89%8B%E9%A0%86)に従って、API サーバーの Azure 環境を構築する。

### 2. GitHub Actions 用シークレット・変数設定

当リポジトリの Setting > Secrets And variables > Actions より、以下の GitHub Actions 用シークレット・変数をすべて設定する。

#### シークレット

Secrets タブから「New repository secret」ボタンを押下して、下記の通りシークレットをすべて設定する。

| シークレット名                        | シークレット値                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| AZURE_AD_SP_CONTRIBUTOR_CLIENT_SECRET | QuestionGPTTranslator で発行した QGTranslator_Contributor のクライアントシークレット |

#### 変数

Variables タブから「New repository variable」ボタンを押下して、下記の通り変数をすべて設定する。

| 変数名                            | 変数値                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| API_URI                           | QuestionGPTTranslator で構築した API Management の Gateway URL                       |
| AZURE_AD_SP_CONTRIBUTOR_CLIENT_ID | QuestionGPTTranslator で発行した QGTranslator_Contributor のクライアント ID          |
| AZURE_AD_SP_MSAL_CLIENT_ID        | QuestionGPTTranslator で発行した QGTranslator_MSAL のクライアント ID                 |
| AZURE_SUBSCRIPTION_ID             | QuestionGPTTranslator で新規作成した Azure サブスクリプションのサブスクリプション ID |
| AZURE_TENANT_ID                   | Azure ディレクトリ ID                                                                |
| RESOURCE_GROUP_NAME               | QuestionGPTTranslator で構築したリソースグループ名                                   |
| SWA_NAME                          | Azure Static Web Apps 名                                                             |

### 3. Azure Static Web Apps への Web アプリケーションのデプロイ

Web アプリケーションをビルドし、QuestionGPTTranslator で構築した Azure Static Web Apps に対してデプロイする。

1. 当リポジトリの Actions > 左側の Deploy Azure Static Web Apps を押下する。
2. Deploy Azure Static Web Apps の workflow が無効化されている場合は、workflow を有効化する。
3. 右上の「Re-run jobs」から「Re-run all jobs」を押下し、確認ダイアログ内の「Re-run jobs」ボタンを押下する。

## 削除手順

1. 当リポジトリの各 workflow をすべて無効化する。
2. 当リポジトリの Setting > Secrets And variables > Actions より、Secrets・Variables タブから初期構築時に設定した各シークレット・変数に対し、ゴミ箱のボタンを押下する。
3. [QuestionGPTTranslator の Azure 環境構築手順・削除手順の削除手順](https://github.com/infhyroyage/QuestionGPTTranslator/blob/main/azureenvironment.md#%E5%89%8A%E9%99%A4%E6%89%8B%E9%A0%86)に従って、API サーバーの Azure 環境をすべて削除する。
