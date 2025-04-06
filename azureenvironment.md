# Azure 環境構築手順・削除手順

## 構築手順

### 1. API サーバーの Azure 環境構築

[QuestionGPTTranslator の Azure 環境構築手順・削除手順の構築手順](https://github.com/infhyroyage/QuestionGPTTranslator/blob/main/azureenvironment.md#%E6%A7%8B%E7%AF%89%E6%89%8B%E9%A0%86)に従って、API サーバーの Azure 環境を構築する。

### 2. GitHub Actions 用変数設定

当リポジトリの Setting > Secrets And variables > Actions の Variables タブから「New repository variable」ボタンを押下して、下記の通り変数をすべて設定する。

| 変数名                     | 変数値                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- |
| API_URI                    | QuestionGPTTranslator の API Management`qgtranslator-je-apim` の Gateway URL |
| AZURE_AD_SP_MSAL_CLIENT_ID | QuestionGPTTranslator で発行した QGTranslator_MSAL のクライアント ID         |
| AZURE_TENANT_ID            | Azure ディレクトリ ID                                                        |

## 削除手順

1. 当リポジトリの各 workflow をすべて無効化する。
2. 当リポジトリの Setting > Secrets And variables > Actions より、Variables タブから初期構築時に設定した各変数に対し、ゴミ箱のボタンを押下する。
3. [QuestionGPTTranslator の Azure 環境構築手順・削除手順の削除手順](https://github.com/infhyroyage/QuestionGPTTranslator/blob/main/azureenvironment.md#%E5%89%8A%E9%99%A4%E6%89%8B%E9%A0%86)に従って、API サーバーの Azure 環境をすべて削除する。
