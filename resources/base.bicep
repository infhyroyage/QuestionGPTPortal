param swaName string

// Static Web Apps
resource swa 'Microsoft.Web/staticSites@2022-09-01' = {
  name: swaName
  location: 'eastasia'
  properties: {
    branch: 'feature/migration_azure_swa' // TODO: mainブランチに変更
    enterpriseGradeCdnStatus: 'disabled'
  }
  sku: {
    name: 'Free'
    tier: 'Free'
  }
}
