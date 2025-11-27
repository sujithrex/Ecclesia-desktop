const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// OAuth2 credentials
const OAUTH_CREDENTIALS = {
  client_id: '242468545408-63fvv2li44lq8cfjofbrlklmkkvgrln5.apps.googleusercontent.com',
  client_secret: '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',
  redirect_uris: ['http://localhost']
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

  // Upload database to Google Drive
  async uploadDatabase() {
    if (!this.drive) {
      throw new Error('Not authenticated with Google Drive');
    }

    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'auth.json');

    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      throw new Error('Database file not found');
    }

    const fileName = `ecclesia-backup-${Date.now()}.json`;
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

  // Download database from Google Drive
  async downloadDatabase(fileId) {
    if (!this.drive) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await this.drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'auth.json');
      const tempPath = path.join(userDataPath, 'auth.json.temp');

      const dest = fs.createWriteStream(tempPath);

      return new Promise((resolve, reject) => {
        response.data
          .on('end', () => {
            // Replace old database with new one
            fs.renameSync(tempPath, dbPath);
            resolve({ success: true });
          })
          .on('error', (err) => {
            reject(err);
          })
          .pipe(dest);
      });
    } catch (error) {
      console.error('Error downloading from Google Drive:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveSync();
