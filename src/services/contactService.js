class ContactService {
    constructor(contactsData) {
      this.contacts = contactsData;
    }
  
    findMatchingContacts(query) {
      const results = [];
      const normalizedQuery = query.toLowerCase();
  
      for (const [name, details] of Object.entries(this.contacts)) {
        if (name.toLowerCase().startsWith(normalizedQuery)) {
          results.push(`${name}: ${details}`);
        }
      }
  
      return results;
    }
  }

  module.exports = ContactService;
