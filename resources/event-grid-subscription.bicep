param functionsName string
param eventGridName string

// Event Grid System Topic
resource eventGridSystemTopic 'Microsoft.EventGrid/systemTopics@2023-12-15-preview' existing = {
  name: eventGridName
}

// Functions
resource functions 'Microsoft.Web/sites@2023-12-01' existing = {
  name: functionsName
}

// Event Grid Subscription
resource eventGridSubscription 'Microsoft.EventGrid/systemTopics/eventSubscriptions@2023-12-15-preview' = {
  parent: eventGridSystemTopic
  name: eventGridName
  properties: {
    destination: {
      endpointType: 'WebHook'
      properties: {
        endpointUrl: 'https://${functions.properties.defaultHostName}/runtime/webhooks/blobs?functionName=Host.Functions.blob_triggered_import&code=${uriComponent(listKeys(resourceId('Microsoft.Web/sites/host', functionsName, 'default'), '2023-12-01').functionKeys.default)}'
      }
    }
    filter: {
      subjectBeginsWith: '/blobServices/default/containers/import-items/blobs/'
      includedEventTypes: [
        'Microsoft.Storage.BlobCreated'
      ]
    }
  }
}
