/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabase } from '@/integrations/supabase/client';

interface EmailData {
  user_id: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  template_data: any;
  scheduled_for?: string;
}

export const emailService = {
  async queueEmail(emailData: EmailData) {
    const { data, error } = await supabase
      .from('email_queue')
      .insert(emailData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async sendWelcomeEmail(userId: string, userEmail: string, username: string) {
    return this.queueEmail({
      user_id: userId,
      email_type: 'welcome',
      recipient_email: userEmail,
      subject: '🎮 Welcome to z Arena!',
      template_data: {
        username,
        loginUrl: `${window.location.origin}/dashboard`
      }
    });
  },

  async sendFriendRequestEmail(userId: string, recipientEmail: string, senderName: string) {
    return this.queueEmail({
      user_id: userId,
      email_type: 'friend_request',
      recipient_email: recipientEmail,
      subject: `${senderName} sent you a friend request on Nexuz Arena`,
      template_data: {
        senderName,
        acceptUrl: `${window.location.origin}/dashboard?tab=community`
      }
    });
  },

  async sendRoomStartEmail(userId: string, recipientEmail: string, roomName: string, gameName: string) {
    return this.queueEmail({
      user_id: userId,
      email_type: 'room_start',
      recipient_email: recipientEmail,
      subject: `🚀 Game Starting: ${roomName}`,
      template_data: {
        roomName,
        gameName,
        joinUrl: `${window.location.origin}/dashboard?tab=rooms`
      }
    });
  },

  async sendPaymentEmail(userId: string, recipientEmail: string, amount: number, currency: string, type: 'win' | 'deposit' | 'withdrawal') {
    const subjects = {
      win: `🏆 You won ${amount} ${currency}!`,
      deposit: `💰 Deposit of ${amount} ${currency} confirmed`,
      withdrawal: `💸 Withdrawal of ${amount} ${currency} processed`
    };

    return this.queueEmail({
      user_id: userId,
      email_type: `payment_${type}`,
      recipient_email: recipientEmail,
      subject: subjects[type],
      template_data: {
        amount,
        currency,
        type,
        walletUrl: `${window.location.origin}/dashboard?tab=wallet`
      }
    });
  },

  async sendWalletConnectedEmail(userId: string, recipientEmail: string, currency: string, walletAddress: string) {
    return this.queueEmail({
      user_id: userId,
      email_type: 'wallet_connect',
      recipient_email: recipientEmail,
      subject: `🔗 ${currency} wallet connected successfully`,
      template_data: {
        currency,
        walletAddress,
        securityUrl: `${window.location.origin}/dashboard?tab=settings`
      }
    });
  },

  async scheduleRoomReminderEmail(userId: string, recipientEmail: string, roomName: string, startTime: string) {
    const reminderTime = new Date(startTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - 15); // 15 minutes before

    return this.queueEmail({
      user_id: userId,
      email_type: 'room_reminder',
      recipient_email: recipientEmail,
      subject: `⏰ Game starting soon: ${roomName}`,
      template_data: {
        roomName,
        startTime,
        joinUrl: `${window.location.origin}/dashboard?tab=rooms`
      },
      scheduled_for: reminderTime.toISOString()
    });
  }
};
