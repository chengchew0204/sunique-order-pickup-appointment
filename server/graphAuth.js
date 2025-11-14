const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const config = require('./config');

let graphClient = null;

function getAuthenticatedClient() {
  if (graphClient) {
    return graphClient;
  }

  const credential = new ClientSecretCredential(
    config.msalConfig.auth.tenantId,
    config.msalConfig.auth.clientId,
    config.msalConfig.auth.clientSecret,
    {
      // Add retry options for Railway network issues
      retryOptions: {
        maxRetries: 5,
        maxRetryDelayInMs: 10000,
        retryDelayInMs: 2000
      }
    }
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default']
  });

  graphClient = Client.initWithMiddleware({
    authProvider: authProvider,
    // Add middleware options for better error handling
    fetchOptions: {
      timeout: 30000 // 30 second timeout
    }
  });

  return graphClient;
}

async function getFileContent(siteUrl, filePath) {
  try {
    const client = getAuthenticatedClient();
    
    let siteId;
    
    // Use direct site ID if provided (faster, more reliable)
    if (config.sharepoint.siteId) {
      siteId = config.sharepoint.siteId;
      console.log('Using direct site ID:', siteId);
    } else {
      // Fallback: Extract hostname and site path from full URL
      const urlMatch = siteUrl.match(/https?:\/\/([^\/]+)\/sites\/([^\/]+)/);
      if (!urlMatch) {
        throw new Error('Invalid SharePoint site URL format');
      }
      const hostname = urlMatch[1];
      const sitePath = urlMatch[2];
      
      // Look up the site to get its ID
      console.log('Looking up site ID for:', hostname, sitePath);
      const site = await client
        .api(`/sites/${hostname}:/sites/${sitePath}`)
        .get();
      siteId = site.id;
    }
    
    // Get file content using site ID and file path
    const response = await client
      .api(`/sites/${siteId}/drive/root:${filePath}:/content`)
      .get();
    
    return response;
  } catch (error) {
    console.error('Error fetching file from SharePoint:', error);
    throw new Error(`Failed to fetch file: ${error.message}`);
  }
}

async function uploadFileContent(siteUrl, filePath, content) {
  const maxRetries = 5;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = getAuthenticatedClient();
      
      let siteId;
      
      // Use direct site ID if provided (faster, more reliable)
      if (config.sharepoint.siteId) {
        siteId = config.sharepoint.siteId;
      } else {
        // Fallback: Extract hostname and site path from full URL
        const urlMatch = siteUrl.match(/https?:\/\/([^\/]+)\/sites\/([^\/]+)/);
        if (!urlMatch) {
          throw new Error('Invalid SharePoint site URL format');
        }
        const hostname = urlMatch[1];
        const sitePath = urlMatch[2];
        
        // Look up the site to get its ID
        const site = await client
          .api(`/sites/${hostname}:/sites/${sitePath}`)
          .get();
        siteId = site.id;
      }
      
      // Upload file content using site ID and file path
      await client
        .api(`/sites/${siteId}/drive/root:${filePath}:/content`)
        .put(content);
      
      if (attempt > 1) {
        console.log(`Upload succeeded on attempt ${attempt}`);
      }
      
      return true;
    } catch (error) {
      lastError = error;
      
      // Check if file is locked (status 423 or resourceLocked error)
      const isLocked = error.statusCode === 423 || 
                       error.code === 'resourceLocked' ||
                       error.code === 'notAllowed' ||
                       error.message.includes('locked');
      
      if (isLocked && attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        console.log(`File locked, retrying in ${waitTime/1000}s... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If not a lock error or max retries reached, throw
      console.error('Error uploading file to SharePoint:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  
  // If we get here, all retries failed
  throw new Error(`Failed to upload file after ${maxRetries} attempts: ${lastError.message}`);
}

module.exports = {
  getAuthenticatedClient,
  getFileContent,
  uploadFileContent
};

