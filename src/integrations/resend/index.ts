import { Resend } from "resend";
import { TEMPLATES } from "./templates";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailWithResend {
  private resend: Resend;
  private senderEmail: string;

  constructor() {
    // const resendApiKey = process.env.VITE_RESEND_API_KEY;
    const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
    this.resend = new Resend(resendApiKey);
    this.senderEmail = import.meta.env.VITE_SENDER_ADDRESS;
    // this.senderEmail = process.env.VITE_SENDER_ADDRESS;
  }

  private async sendEmail(options: EmailOptions) {
    try {
      const result = await this.resend.emails.send({
        from: options.from || this.senderEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log("Email sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  // Welcome Email
  async sendWelcomeEmail(recipientEmail: string, username: string) {
    const template = TEMPLATES.welcome(username);
    return this.sendEmail({
      to: recipientEmail,
      subject: "🎮 Welcome to Nexuz Arena - Your Gaming Journey Begins!",
      html: template,
    });
  }

  // Friend Request Email
  async sendFriendRequestEmail(recipientEmail: string, senderName: string) {
    const template = TEMPLATES.friendRequest(senderName);
    return this.sendEmail({
      to: recipientEmail,
      subject: `👥 ${senderName} wants to connect with you on Nexuz Arena`,
      html: template,
    });
  }

  // Room Start Email
  async sendRoomStartEmail(recipientEmail: string, roomName: string, gameName: string, roomId: string) {
    const template = TEMPLATES.roomStart(roomName, gameName, roomId);
    return this.sendEmail({
      to: recipientEmail,
      subject: `🎯 Game Room Started: ${roomName} - Join the Battle!`,
      html: template,
    });
  }

  // Room Reminder Email
  async sendRoomReminderEmail(recipientEmail: string, roomName: string, startTime: string, roomId: string) {
    const template = TEMPLATES.roomReminder(roomName, startTime, roomId);
    return this.sendEmail({
      to: recipientEmail,
      subject: `⏰ Reminder: ${roomName} starts soon - Get Ready!`,
      html: template,
    });
  }

  // Game Won Email
  async sendGameWonEmail(recipientEmail: string, gameName: string, prizeAmount?: string) {
    const template = TEMPLATES.gameWon(gameName, prizeAmount);
    return this.sendEmail({
      to: recipientEmail,
      subject: `🏆 Victory! You won ${gameName} on Nexuz Arena`,
      html: template,
    });
  }

  // Tournament Advance Email
  async sendTournamentAdvanceEmail(recipientEmail: string, tournamentName: string, nextRound: string, roomId: string) {
    const template = TEMPLATES.tournamentAdvance(tournamentName, nextRound, roomId);
    return this.sendEmail({
      to: recipientEmail,
      subject: `🚀 Tournament Advance: ${tournamentName} - Next Round: ${nextRound}`,
      html: template,
    });
  }

  // Tournament Elimination Email
  async sendTournamentEliminationEmail(recipientEmail: string, tournamentName: string, finalRank: number, roomId: string) {
    const template = TEMPLATES.tournamentElimination(tournamentName, finalRank, roomId);
    return this.sendEmail({
      to: recipientEmail,
      subject: `💪 Tournament Update: ${tournamentName} - Rank #${finalRank}`,
      html: template,
    });
  }

  // Highscore Beaten Email
  async sendHighscoreBeatenEmail(recipientEmail: string, gameName: string, playerName: string, newScore: number, roomId: string) {
    const template = TEMPLATES.highscoreBeaten(gameName, playerName, newScore, roomId);
    return this.sendEmail({
      to: recipientEmail,
      subject: `📈 Highscore Challenge: ${playerName} beat your score in ${gameName}`,
      html: template,
    });
  }

  // Prize Distribution Email
  async sendPrizeDistributionEmail(recipientEmail: string, amount: string, tournamentName: string) {
    const template = TEMPLATES.prizeDistribution(amount, tournamentName);
    return this.sendEmail({
      to: recipientEmail,
      subject: `💰 Prize Distributed: ${amount} from ${tournamentName}`,
      html: template,
    });
  }

  // Room Cancelled Email
  async sendRoomCancelledEmail(recipientEmail: string, roomName: string, refundAmount?: string) {
    const template = TEMPLATES.roomCancelled(roomName, refundAmount);
    return this.sendEmail({
      to: recipientEmail,
      subject: `⚠️ Room Cancelled: ${roomName} - Refund Processed`,
      html: template,
    });
  }

  // Friend Request Accepted Email
  async sendFriendRequestAcceptedEmail(recipientEmail: string, friendName: string) {
    const template = TEMPLATES.friendRequestAccepted(friendName);
    return this.sendEmail({
      to: recipientEmail,
      subject: `✅ Friend Request Accepted: ${friendName} is now your friend!`,
      html: template,
    });
  }
}