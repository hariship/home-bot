const TwilioService = require('../src/services/twilioService');

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn()
    }
  }));
});

describe('TwilioService', () => {
  let twilioService;

  beforeEach(() => {
    twilioService = new TwilioService();
  });

  test('should send message successfully', async () => {
    twilioService.client.messages.create.mockResolvedValueOnce({});
    
    const result = await twilioService.sendMessage(
      'whatsapp:+1234567890',
      'Test message'
    );
    
    expect(result).toBe(true);
    expect(twilioService.client.messages.create).toHaveBeenCalledWith({
      body: 'Test message',
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+1234567890'
    });
  });

  test('should handle send message failure', async () => {
    twilioService.client.messages.create.mockRejectedValueOnce(new Error('Failed'));
    
    const result = await twilioService.sendMessage(
      'whatsapp:+1234567890',
      'Test message'
    );
    
    expect(result).toBe(false);
  });
});