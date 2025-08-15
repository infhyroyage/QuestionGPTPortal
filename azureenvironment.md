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
| SWA_NAME                          | Azure Static Web Apps 名                                                             |

### 3. Azure リソースの構築

QuestionGPTTranslator で新規作成した Azure サブスクリプションに対し、Azure Static Web Apps を構築する。

1. 当リポジトリの Actions > 左側の Create Azure Resources を押下する。
2. Create Azure Resources の workflow が無効化されている場合は、workflow を有効化する。
3. 右上の「Re-run jobs」から「Re-run all jobs」を押下し、確認ダイアログ内の「Re-run jobs」ボタンを押下する。

### 4. Azure AD 認証認可用サービスプリンシパルのリダイレクト URI の追加

QuestionGPTTranslator で発行した QGTranslator_MSAL のリダイレクト URI に Azure Static Web Apps の URL を設定する。

1. [Azure Portal](https://portal.azure.com/)にログインし、CloudShell を起動する。
2. 以下のコマンドを実行して得た、Azure Static Web Apps の URL を手元に控える。
   ```bash
   echo "https://`az staticwebapp show -n (当リポジトリの変数SWA_NAMEの値) -g qgportal-je --query 'defaultHostname' -o tsv`"
   ```
3. CloudShell を閉じ、Azure AD > App Registrations に遷移する。
4. QGTranslator_MSAL のリンク先にある Overview にある「Redirect URI:」のリンク「Add a Redirect URI」を押下し、Authentication (Preview) に遷移する。
5. 「Add a Redirect URI」タブにある「+ Add Redirect URI」ボタンを押下し、「Select a platform to add redirect URI」で「Single-page application」ボタンを押下する。
6. 「Redirect URI」のテキストボックスに、2 で手元に控えた Azure Static Web Apps の URL を入力し、「Configure」ボタンを押下する。

## 削除手順

1. 当リポジトリの各 workflow をすべて無効化する。
2. ターミナルを起動して以下のコマンドを実行し、リソースグループ`qgportal-je`を削除する。
   ```bash
   az group delete -n qgportal-je -y
   ```
3. 当リポジトリの Setting > Secrets And variables > Actions より、Secrets・Variables タブから初期構築時に設定した各シークレット・変数に対し、ゴミ箱のボタンを押下する。
4. [QuestionGPTTranslator の Azure 環境構築手順・削除手順の削除手順](https://github.com/infhyroyage/QuestionGPTTranslator/blob/main/azureenvironment.md#%E5%89%8A%E9%99%A4%E6%89%8B%E9%A0%86)に従って、API サーバーの Azure 環境をすべて削除する。
