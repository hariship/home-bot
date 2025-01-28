class ContactService {
  constructor(databaseService) {
      this.databaseService = databaseService;
  }

  async findMatchingContacts(query) {
      try {
          const contacts = await this.databaseService.findContacts(query);

          if (contacts.length === 0) {
              return [];
          }

          return contacts.map(contact => 
              `${contact.name}: ${contact.phone || 'No Phone'}`
          );
      } catch (error) {
          console.error('Error finding matching contacts:', error);
          return [];
      }
  }
}

module.exports = ContactService;