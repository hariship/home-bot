// src/services/googleContactsService.js
const { google } = require('googleapis');
const fs = require('fs').promises;
const path =  require('path');

class GoogleContactsService {
  constructor(databaseService) {
    this.databaseService = databaseService;
    this.oAuth2Client = null;
    this.syncStatus = {
      lastSync: null,
      inProgress: false,
      totalProcessed: 0,
      errors: []
    };
    // Initialize directly in constructor
    this._initializeOAuth2Client();
  }

  _initializeOAuth2Client() {
    try {
      // First try environment variables
      if (process.env.GOOGLE_CLIENT_ID && 
          process.env.GOOGLE_CLIENT_SECRET && 
          process.env.GOOGLE_REDIRECT_URI) {
        
        this.oAuth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        return;
      }

      // Fall back to credentials file
      const credentialsPath = path.join(__dirname, '../../credentials.json');
      const credentials = JSON.parse(fs.readFileSync(credentialsPath));
      const { client_secret, client_id, redirect_uris } = credentials.installed;
      
      this.oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[1]
      );
    } catch (error) {
      console.error('Failed to initialize OAuth2 client:', error);
      throw new Error('OAuth2 client initialization failed. Please check your credentials.');
    }
  }

  async checkAuthStatus() {
    try {
      if (!this.oAuth2Client) {
        return true; // needs auth since client isn't initialized
      }

      const tokenPath = path.join(__dirname, '../../token.json');
      const token = await fs.readFile(tokenPath, 'utf-8');
      this.oAuth2Client.setCredentials(JSON.parse(token));
      return false; // no auth needed
    } catch (err) {
      return true; // needs auth
    }
  }

  getAuthUrl() {
    if (!this.oAuth2Client) {
      throw new Error('OAuth2 client not initialized');
    }
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/contacts.readonly']
    });
  }

  async handleAuthCallback(code) {
    if (!this.oAuth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      const { tokens } = await this.oAuth2Client.getToken(code);
      this.oAuth2Client.setCredentials(tokens);
      const tokenPath = path.join(__dirname, '../../token.json');
      await fs.writeFile(tokenPath, JSON.stringify(tokens));
      return true;
    } catch (error) {
      console.error('Error handling auth callback:', error);
      throw error;
    }
  }

  async syncContacts() {
    if (!this.oAuth2Client) {
      throw new Error('OAuth2 client not initialized');
    }
  
    if (this.syncStatus.inProgress) {
      throw new Error('Sync already in progress');
    }
  
    this.syncStatus = {
      lastSync: new Date(),
      inProgress: true,
      totalProcessed: 0,
      errors: []
    };
  
    try {
      const service = google.people({ version: 'v1', auth: this.oAuth2Client });
      const res = await service.people.connections.list({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers',
        pageSize: 1000
      });
  
      const connections = res.data.connections || [];
  
      for (const person of connections) {
        try {
          const name = person.names ? person.names[0].displayName : 'Unknown';
          const email = person.emailAddresses ? person.emailAddresses[0].value : null;
          const phone = person.phoneNumbers ? person.phoneNumbers[0].value : null;
  
          // **Check if contact already exists before inserting**
          const existingContacts = await this.databaseService.findContacts(name);
          const alreadyExists = existingContacts.some(
            contact => contact.email === email && contact.phone === phone
          );
  
          if (!alreadyExists) {
            await this.databaseService.saveContact(name, email, phone, 'Gmail');
            this.syncStatus.totalProcessed++;
          }
        } catch (error) {
          this.syncStatus.errors.push({
            contact: person.names ? person.names[0].displayName : 'Unknown',
            error: error.message
          });
        }
      }
  
      this.syncStatus.inProgress = false;
      return this.syncStatus;
    } catch (error) {
      this.syncStatus.inProgress = false;
      this.syncStatus.errors.push({
        error: 'Sync failed: ' + error.message
      });
      throw error;
    }
  }

  getSyncStatus() {
    return this.syncStatus;
  }
}

module.exports = GoogleContactsService;