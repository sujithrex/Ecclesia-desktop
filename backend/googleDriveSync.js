const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// OAuth2 credentials
const OAUTH_CREDENTIALS = {
  client_id: '242468545408-fd5oci81fpjggeg45ctbmb0clvd0tk9h.apps.googleusercontent.com',
  client_secret: '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',
  redirect_uris: ['http://localhost:3000/oauth/callback']
};

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

class GoogleDriveSync {
  constructor() {
    this.oauth2Client = null;
    this.drive = null;
  }

  // Get authorization URL
  getAuthUrl() {
    const oauth2Client = new google.auth.OAuth2(
      OAUTH_CREDENTIALS.client_id,
      OAUTH_CREDENTIALS.client_secret,
      OAUTH_CREDENTIALS.redirect_uris[0]
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    return authUrl;
  }

  // Start local server to capture OAuth callback
  startOAuthServer() {
    return new Promise((resolve, reject) => {
      const http = require('http');
      
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost:3000');
        
        if (url.pathname === '/oauth/callback') {
          const code = url.searchParams.get('code');
          
          if (code) {
            // Send success page
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>Authentication Successful</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #B5316A 0%, #8F2654 100%);
                  }
                  .container {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    max-width: 400px;
                  }
                  h1 {
                    color: #2c3e50;
                    margin-bottom: 16px;
                  }
                  p {
                    color: #5a6c7d;
                    line-height: 1.6;
                  }
                  .success-icon {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 20px;
                    background: #34A853;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .checkmark {
                    width: 32px;
                    height: 32px;
                    border: 3px solid white;
                    border-top: none;
                    border-right: none;
                    transform: rotate(-45deg);
                    margin-top: -8px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="success-icon">
                    <div class="checkmark"></div>
                  </div>
                  <h1>Authentication Successful!</h1>
                  <p>You have successfully connected to Google Drive. You can close this window and return to Ecclesia Desktop.</p>
                </div>
              </body>
              </html>
            `);
            
            // Close server and resolve with code
            server.close();
            resolve(code);
          } else {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Error: No authorization code received');
            server.close();
            reject(new Error('No authorization code received'));
          }
        }
      });

      server.listen(3000, () => {
        console.log('OAuth callback server listening on port 3000');
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('OAuth timeout'));
      }, 5 * 60 * 1000);
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    const oauth2Client = new google.auth.OAuth2(
      OAUTH_CREDENTIALS.client_id,
      OAUTH_CREDENTIALS.client_secret,
      OAUTH_CREDENTIALS.redirect_uris[0]
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  // Set credentials
  setCredentials(tokens) {
    this.oauth2Client = new google.auth.OAuth2(
      OAUTH_CREDENTIALS.client_id,
      OAUTH_CREDENTIALS.client_secret,
      OAUTH_CREDENTIALS.redirect_uris[0]
    );

    this.oauth2Client.setCredentials(tokens);
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  // Upload database to Google Drive with versioned filename
  async uploadDatabase(versionString) {
    if (!this.drive) {
      throw new Error('Not authenticated with Google Drive');
    }

    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'auth.json');

    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      throw new Error('Database file not found');
    }

    const fileName = versionString || `ecclesia-backup-${Date.now()}.json`;
    const fileMetadata = {
      name: fileName,
      mimeType: 'application/json'
    };

    const media = {
      mimeType: 'application/json',
      body: fs.createReadStream(dbPath)
    };

    try {
      // Check if Ecclesia folder exists
      const folderName = 'Ecclesia Backups';
      let folderId = await this.findOrCreateFolder(folderName);

      // Upload file to the folder
      fileMetadata.parents = [folderId];

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, createdTime'
      });

      return {
        success: true,
        fileId: response.data.id,
        fileName: response.data.name,
        createdTime: response.data.createdTime
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw error;
    }
  }

  // Find or create Ecclesia Backups folder
  async findOrCreateFolder(folderName) {
    try {
      // Search for existing folder
      const response = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create folder if it doesn't exist
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      console.error('Error finding/creating folder:', error);
      throw error;
    }
  }

  // List backups from Google Drive
  async listBackups() {
    if (!this.drive) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const folderName = 'Ecclesia Backups';
      const folderId = await this.findOrCreateFolder(folderName);

      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc',
        pageSize: 10
      });

      return response.data.files;
    } catch (error) {
      console.error('Error listing backups:', error);
      throw error;
    }
  }

  // Download database from Google Drive (returns data without saving)
  async downloadDatabase(fileId) {
    if (!this.drive) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await this.drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      return new Promise((resolve, reject) => {
        let data = '';
        response.data
          .on('data', (chunk) => {
            data += chunk;
          })
          .on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({ success: true, data: jsonData });
            } catch (err) {
              reject(new Error('Invalid JSON data'));
            }
          })
          .on('error', (err) => {
            reject(err);
          });
      });
    } catch (error) {
      console.error('Error downloading from Google Drive:', error);
      throw error;
    }
  }

  // Get latest version file from Drive
  async getLatestVersion() {
    if (!this.drive) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const folderName = 'Ecclesia Backups';
      const folderId = await this.findOrCreateFolder(folderName);

      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false and name contains 'ecclesia_win_V'`,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc',
        pageSize: 1
      });

      if (response.data.files.length > 0) {
        return response.data.files[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting latest version:', error);
      throw error;
    }
  }

  // Get file by name
  async getFileByName(fileName) {
    if (!this.drive) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const folderName = 'Ecclesia Backups';
      const folderId = await this.findOrCreateFolder(folderName);

      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false and name='${fileName}'`,
        fields: 'files(id, name, createdTime, size)',
        pageSize: 1
      });

      if (response.data.files.length > 0) {
        return response.data.files[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting file by name:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveSync();
