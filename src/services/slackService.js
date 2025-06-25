const { WebClient } = require('@slack/web-api');

export class SlackService {
  constructor() {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  async sendMessage(channel, text) {
    try {
      const result = await this.client.chat.postMessage({
        channel,
        text,
      });
      return result;
    } catch (error) {
      console.error('Error sending message to Slack:', error);
      throw error;
    }
  }

async updateUserStatus(userId, status, emoji) {
  try {
    const result = await this.client.users.profile.set({
      user: userId,
      profile: {
        status_text: status,
        status_emoji: emoji,
      },
    });
    return result;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

async getChannelList() {
  try {
    const result = await this.client.conversations.list();
    return result.channels;
  } catch (error) {
    console.error('Error getting channel list:', error);
    throw error;
  }
 }
}