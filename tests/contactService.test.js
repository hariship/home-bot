// tests/contactService.test.js
const ContactService = require('../src/services/contactService');

describe('ContactService', () => {
  const testContacts = {
    "John Doe": "john@example.com, +1234567890",
    "Jane Doe": "jane@example.com, +0987654321",
    "Jim Smith": "jim@example.com, +1122334455"
  };

  let contactService;

  beforeEach(() => {
    contactService = new ContactService(testContacts);
  });

  test('should find matching contacts case-insensitive', () => {
    const results = contactService.findMatchingContacts('jo');
    expect(results).toHaveLength(1);
    expect(results[0]).toBe('John Doe: john@example.com, +1234567890');
  });

  test('should find multiple matching contacts', () => {
    const results = contactService.findMatchingContacts('j');
    expect(results).toHaveLength(2);
    expect(results).toContain('John Doe: john@example.com, +1234567890');
    expect(results).toContain('Jane Doe: jane@example.com, +0987654321');
  });

  test('should return empty array for no matches', () => {
    const results = contactService.findMatchingContacts('xyz');
    expect(results).toHaveLength(0);
  });
});
