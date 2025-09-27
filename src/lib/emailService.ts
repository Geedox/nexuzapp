import { EmailWithResend } from '../integrations/resend';


export class EmailService {
  private emailClient: EmailWithResend;

  constructor() {
    this.emailClient = new EmailWithResend();
  }

  async sendWelcomeEmail(userEmail: string, username: string) {
    try {
      return await this.emailClient.sendWelcomeEmail(userEmail, username);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  async sendFriendRequestEmail(recipientEmail: string, senderName: string) {
    try {
      return await this.emailClient.sendFriendRequestEmail(recipientEmail, senderName);
    } catch (error) {
      console.error('Failed to send friend request email:', error);
      throw error;
    }
  }

  async sendRoomStartEmail(roomId: string, recipientEmail: string, roomName: string, gameName: string) {
    try {
      return await this.emailClient.sendRoomStartEmail(recipientEmail, roomName, gameName, roomId);
    } catch (error) {
      console.error('Failed to send room start email:', error);
      throw error;
    }
  }

  async sendRoomReminderEmail(roomId: string, recipientEmail: string, roomName: string, startTime: string) {
    try {
      return await this.emailClient.sendRoomReminderEmail(recipientEmail, roomName, startTime, roomId);
    } catch (error) {
      console.error('Failed to send room reminder email:', error);
      throw error;
    }
  }

  // Additional email methods for the new notification types
  async sendGameWonEmail(recipientEmail: string, gameName: string, prizeAmount?: string) {
    try {
      return await this.emailClient.sendGameWonEmail(recipientEmail, gameName, prizeAmount);
    } catch (error) {
      console.error('Failed to send game won email:', error);
      throw error;
    }
  }

  async sendTournamentAdvanceEmail(recipientEmail: string, tournamentName: string, nextRound: string, roomId: string) {
    try {
      return await this.emailClient.sendTournamentAdvanceEmail(recipientEmail, tournamentName, nextRound, roomId);
    } catch (error) {
      console.error('Failed to send tournament advance email:', error);
      throw error;
    }
  }

  async sendTournamentEliminationEmail(roomId: string, recipientEmail: string, tournamentName: string, finalRank: number) {
    try {
      return await this.emailClient.sendTournamentEliminationEmail(recipientEmail, tournamentName, finalRank, roomId);
    } catch (error) {
      console.error('Failed to send tournament elimination email:', error);
      throw error;
    }
  }

  async sendHighscoreBeatenEmail(roomId: string, recipientEmail: string, gameName: string, playerName: string, newScore: number) {
    try {
      return await this.emailClient.sendHighscoreBeatenEmail(recipientEmail, gameName, playerName, newScore, roomId);
    } catch (error) {
      console.error('Failed to send highscore beaten email:', error);
      throw error;
    }
  }

  async sendPrizeDistributionEmail(recipientEmail: string, amount: string, tournamentName: string) {
    try {
      return await this.emailClient.sendPrizeDistributionEmail(recipientEmail, amount, tournamentName);
    } catch (error) {
      console.error('Failed to send prize distribution email:', error);
      throw error;
    }
  }

  async sendRoomCancelledEmail(recipientEmail: string, roomName: string, refundAmount?: string) {
    try {
      return await this.emailClient.sendRoomCancelledEmail(recipientEmail, roomName, refundAmount);
    } catch (error) {
      console.error('Failed to send room cancelled email:', error);
      throw error;
    }
  }

  async sendFriendRequestAcceptedEmail(recipientEmail: string, friendName: string) {
    try {
      return await this.emailClient.sendFriendRequestAcceptedEmail(recipientEmail, friendName);
    } catch (error) {
      console.error('Failed to send friend request accepted email:', error);
      throw error;
    }
  }
};
