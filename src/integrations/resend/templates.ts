// Base email template with Nexuz Arena branding
const APP_URL = import.meta.env.VITE_APP_URL;
// const APP_URL = process.env.VITE_APP_URL;
const BaseEmailTemplate = ({
  title,
  content,
  ctaText,
  ctaUrl,
  footerText
}: {
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
}) => {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            font-family: 'Rajdhani', sans-serif;
            color: #e2e8f0;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            padding: 30px 20px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: shimmer 3s infinite;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .logo {
            font-family: 'Orbitron', monospace;
            font-size: 28px;
            font-weight: 900;
            color: #ffffff;
            text-shadow: 0 0 20px rgba(255,255,255,0.5);
            margin: 0;
            position: relative;
            z-index: 1;
          }
          .tagline {
            font-size: 14px;
            color: rgba(255,255,255,0.8);
            margin: 5px 0 0 0;
            font-weight: 500;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .title {
            font-family: 'Orbitron', monospace;
            font-size: 24px;
            font-weight: 700;
            color: #3b82f6;
            margin: 0 0 20px 0;
            text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
          }
          .message {
            font-size: 16px;
            color: #cbd5e1;
            margin: 0 0 30px 0;
            line-height: 1.8;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-family: 'Orbitron', monospace;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
            border: 1px solid rgba(59, 130, 246, 0.5);
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          }
          .footer {
            background: rgba(15, 23, 42, 0.8);
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid rgba(59, 130, 246, 0.2);
          }
          .footer-text {
            font-size: 12px;
            color: #64748b;
            margin: 0 0 10px 0;
          }
          .social-links {
            margin: 15px 0 0 0;
          }
          .social-links a {
            color: #64748b;
            text-decoration: none;
            margin: 0 10px;
            font-size: 12px;
          }
          .social-links a:hover {
            color: #3b82f6;
          }
          .cyber-border {
            height: 2px;
            background: linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, #3b82f6, transparent);
            margin: 20px 0;
          }
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 8px;
            }
            .content {
              padding: 30px 20px;
            }
            .title {
              font-size: 20px;
            }
            .message {
              font-size: 14px;
            }
            .cta-button {
              padding: 12px 24px;
              font-size: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">NEXUZ ARENA</h1>
            <p class="tagline">DECENTRALIZED GAMING MULTIVERSE</p>
          </div>
          
          <div class="content">
            <h2 class="title">${title}</h2>
            <div class="cyber-border"></div>
            <p class="message">${content}</p>
            ${ctaText && ctaUrl ? `
              <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
            ` : ''}
          </div>
          
          <div class="footer">
            <p class="footer-text">${footerText || 'Ready to dominate the arena? Join the ultimate gaming experience.'}</p>
            <div class="social-links">
              <a href="#">Discord</a> • 
              <a href="#">Twitter</a> • 
              <a href="#">Telegram</a>
            </div>
            <p class="footer-text" style="margin-top: 15px; font-size: 10px;">
              © ${new Date().getFullYear()} Nexuz Arena. Built on the blockchain, powered by the community.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
};

export const TEMPLATES = {
  // Welcome Email Template
  welcome: (username: string) => BaseEmailTemplate({
    title: "🎮 WELCOME TO THE ARENA!",
    content: `
      Welcome to <strong>Nexuz Arena</strong>, ${username}! 🚀<br><br>
      
      You've just entered the most advanced decentralized gaming multiverse ever created. 
      Here, creators build competitive games, players battle for crypto prizes, and everyone 
      earns from the ecosystem.<br><br>
      
      <strong>What's next?</strong><br>
      • Create your gaming profile and customize your avatar<br>
      • Explore our library of competitive games<br>
      • Join tournaments and compete for crypto rewards<br>
      • Connect with friends and build your gaming network<br><br>
      
      The arena awaits your arrival. Let's make history together!
    `,
    ctaText: "ENTER THE ARENA",
    ctaUrl: `${APP_URL}/dashboard`,
    footerText: "Ready to start your gaming journey? Your adventure begins now!"
  }),

  // Friend Request Email Template
  friendRequest: (senderName: string) => BaseEmailTemplate({
    title: "👥 FRIEND REQUEST RECEIVED",
    content: `
      <strong>${senderName}</strong> wants to connect with you on Nexuz Arena! 🤝<br><br>
      
      Building your gaming network is crucial for success in the arena. 
      Connect with friends to:<br><br>
      
      • Challenge each other in competitive matches<br>
      • Form teams for tournament play<br>
      • Share achievements and celebrate victories<br>
      • Get notified when friends are online<br><br>
      
      Don't miss out on the opportunity to expand your gaming circle!
    `,
    ctaText: "VIEW REQUEST",
    ctaUrl: `${APP_URL}/friends`,
    footerText: "Connect with fellow gamers and dominate the arena together!"
  }),

  // Room Start Email Template
  roomStart: (roomName: string, gameName: string, roomId: string) => BaseEmailTemplate({
    title: "🎯 GAME ROOM STARTED!",
    content: `
      The <strong>${roomName}</strong> room has officially started! 🚀<br><br>
      
      <strong>Game:</strong> ${gameName}<br>
      <strong>Status:</strong> Battle in Progress<br><br>
      
      Your fellow competitors are already in the arena. Don't miss your chance to 
      claim victory and earn crypto rewards!<br><br>
      
      <strong>What's at stake?</strong><br>
      • Crypto prize pool<br>
      • Tournament points<br>
      • Leaderboard ranking<br>
      • Bragging rights<br><br>
      
      The battle has begun. Will you emerge victorious?
    `,
    ctaText: "JOIN THE BATTLE",
    ctaUrl: `${APP_URL}/dashboard/rooms/${roomId}`,
    footerText: "Every second counts in the arena. Don't let victory slip away!"
  }),

  // Room Reminder Email Template
  roomReminder: (roomName: string, startTime: string, roomId: string) => BaseEmailTemplate({
    title: "⏰ GAME ROOM REMINDER",
    content: `
      Don't forget! Your game room <strong>${roomName}</strong> starts soon! ⏰<br><br>
      
      <strong>Start Time:</strong> ${startTime}<br>
      <strong>Status:</strong> Starting Soon<br><br>
      
      Make sure you're ready to compete:<br><br>
      
      • Check your internet connection<br>
      • Prepare your gaming setup<br>
      • Review the game rules<br>
      • Warm up with a practice round<br><br>
      
      Victory favors the prepared. Are you ready to dominate?
    `,
    ctaText: "PREPARE FOR BATTLE",
    ctaUrl: `${APP_URL}/dashboard/rooms/${roomId}`,
    footerText: "Preparation is the key to victory in the arena!"
  }),

  // Game Won Email Template
  gameWon: (gameName: string, roomId: string, prizeAmount?: string) => BaseEmailTemplate({
    title: "🏆 VICTORY ACHIEVED!",
    content: `
      <strong>CONGRATULATIONS!</strong> You've emerged victorious in ${gameName}! 🎉<br><br>
      
      Your skills, strategy, and determination have paid off. You've proven yourself 
      as a true champion of the arena!<br><br>
      
      ${prizeAmount ? `<strong>Prize Won:</strong> ${prizeAmount}<br><br>` : ''}
      
      <strong>What this victory means:</strong><br>
      • Increased tournament ranking<br>
      • Enhanced reputation in the community<br>
      • Access to exclusive tournaments<br>
      • Recognition as a top competitor<br><br>
      
      The arena celebrates your triumph. Keep the momentum going!
    `,
    ctaText: "VIEW REWARDS",
    ctaUrl: `${APP_URL}/dashboard/rooms/${roomId}`,
    footerText: "Champions are made in moments like these. Keep dominating!"
  }),

  // Tournament Advance Email Template
  tournamentAdvance: (tournamentName: string, nextRound: string, roomId: string) => BaseEmailTemplate({
    title: "🚀 TOURNAMENT ADVANCE!",
    content: `
      <strong>INCREDIBLE!</strong> You've advanced to the next round! 🎯<br><br>
      
      <strong>Tournament:</strong> ${tournamentName}<br>
      <strong>Next Round:</strong> ${nextRound}<br><br>
      
      Your performance has been outstanding. You're one step closer to the ultimate 
      prize and eternal glory in the arena!<br><br>
      
      <strong>What's next?</strong><br>
      • Prepare for the next challenge<br>
      • Study your potential opponents<br>
      • Refine your strategy<br>
      • Stay focused and determined<br><br>
      
      The championship is within reach. Don't stop now!
    `,
    ctaText: "VIEW TOURNAMENT",
    ctaUrl: `${APP_URL}/dashboard/rooms/${roomId}`,
    footerText: "Every round brings you closer to championship glory!"
  }),

  // Tournament Elimination Email Template
  tournamentElimination: (tournamentName: string, finalRank: number, roomId: string) => BaseEmailTemplate({
    title: "💪 TOURNAMENT ELIMINATION",
    content: `
      You've been eliminated from <strong>${tournamentName}</strong>, but your journey 
      doesn't end here! 💪<br><br>
      
      <strong>Final Rank:</strong> #${finalRank}<br>
      <strong>Status:</strong> Eliminated<br><br>
      
      Every battle is a learning experience. You've gained valuable skills, 
      experience, and respect from the community.<br><br>
      
      <strong>What you've achieved:</strong><br>
      • Proven your competitive spirit<br>
      • Gained tournament experience<br>
      • Built connections with other players<br>
      • Improved your gaming skills<br><br>
      
      The arena awaits your return. Come back stronger!
    `,
    ctaText: "FIND NEW TOURNAMENTS",
    ctaUrl: `${APP_URL}/dashboard/rooms/${roomId}`,
    footerText: "Every champion was once a beginner. Keep pushing forward!"
  }),

  // Highscore Beaten Email Template
  highscoreBeaten: (gameName: string, playerName: string, newScore: number, roomId: string) => BaseEmailTemplate({
    title: "📈 HIGHSCORE CHALLENGE!",
    content: `
      <strong>${playerName}</strong> has beaten your highscore in ${gameName}! 📈<br><br>
      
      <strong>New Highscore:</strong> ${newScore.toLocaleString()}<br>
      <strong>Game:</strong> ${gameName}<br><br>
      
      This is your chance to reclaim your throne! The leaderboard is calling, 
      and only the most skilled players will rise to the top.<br><br>
      
      <strong>Ready to fight back?</strong><br>
      • Challenge them to a rematch<br>
      • Practice and improve your skills<br>
      • Set a new unbeatable record<br>
      • Prove your dominance once again<br><br>
      
      The arena respects only the strongest. Will you answer the call?
    `,
    ctaText: "RECLAIM YOUR THRONE",
    ctaUrl: `${APP_URL}/dashboard/rooms/${roomId}`,
    footerText: "True champions never back down from a challenge!"
  }),

  // Prize Distribution Email Template
  prizeDistribution: (amount: string, roomName: string) => BaseEmailTemplate({
    title: "💰 PRIZE DISTRIBUTED!",
    content: `
      <strong>Congratulations!</strong> Your prize has been distributed! 💰<br><br>
      
      <strong>Amount:</strong> ${amount}<br>
      <strong>Game Room:</strong> ${roomName}<br>
      <strong>Status:</strong> Successfully Transferred<br><br>
      
      Your winnings have been added to your Nexuz Arena wallet. You can now:<br><br>
      
      • Withdraw to your external wallet<br>
      • Use for future room entries<br>
      • Invest in game development<br>
      • Share with the community<br><br>
      
      Your success in the arena has been rewarded. Keep the momentum going!
    `,
    ctaText: "VIEW WALLET",
    ctaUrl: "https://nexuz.xyz/wallet",
    footerText: "Success in the arena comes with real rewards. Keep competing!"
  }),

  // Room Cancelled Email Template
  roomCancelled: (roomName: string, refundAmount?: string) => BaseEmailTemplate({
    title: "⚠️ ROOM CANCELLED",
    content: `
      The game room <strong>${roomName}</strong> has been cancelled. ⚠️<br><br>
      
      <strong>Status:</strong> Cancelled<br>
      <strong>Reason:</strong> Insufficient participants or technical issues<br><br>
      
      ${refundAmount ? `<strong>Refund Amount:</strong> ${refundAmount}<br><br>` : ''}
      
      Don't worry! Your entry fee has been fully refunded to your wallet. 
      You can use it to join other exciting tournaments and game rooms.<br><br>
      
      <strong>What's next?</strong><br>
      • Explore other available game rooms<br>
      • Join tournaments with guaranteed participation<br>
      • Create your own game room<br>
      • Connect with other players<br><br>
      
      The arena is full of opportunities. Don't let this setback stop you!
    `,
    ctaText: "FIND NEW GAMES",
    ctaUrl: `${APP_URL}/dashboard/rooms`,
    footerText: "Every cancelled room is a new opportunity waiting to be discovered!"
  }),

  // Friend Request Accepted Email Template
  friendRequestAccepted: (friendName: string) => BaseEmailTemplate({
    title: "✅ FRIEND REQUEST ACCEPTED!",
    content: `
      <strong>Great news!</strong> ${friendName} has accepted your friend request! ✅<br><br>
      
      You're now connected in the Nexuz Arena community! This opens up 
      exciting opportunities for collaboration and competition.<br><br>
      
      <strong>What you can do now:</strong><br>
      • Challenge them to friendly matches<br>
      • Form teams for tournament play<br>
      • Share achievements and celebrate victories<br>
      • Get notified when they're online<br>
      • Build a stronger gaming network<br><br>
      
      Strong connections lead to greater success in the arena. 
      Welcome to your expanded gaming family!
    `,
    ctaText: "VIEW FRIENDS",
    ctaUrl: `${APP_URL}/friends`,
    footerText: "Friendship in the arena is the foundation of legendary teams!"
  })
  ,

  // Room Created Email Template
  roomCreated: (roomName: string, creatorName: string, roomId: string) => BaseEmailTemplate({
    title: "🎮 NEW ROOM CREATED",
    content: `
      <strong>${creatorName}</strong> just created a new room: <strong>${roomName}</strong>! 🚀<br><br>
      Jump in early to secure your spot and get an edge on the competition.
    `,
    ctaText: "VIEW ROOM",
    ctaUrl: `${APP_URL}/dashboard/rooms/${roomId}`,
    footerText: "Be first, be fast, be victorious. See you in the arena!"
  }),

  // Room Completed Email Template
  roomCompleted: (roomName: string, roomId: string) => BaseEmailTemplate({
    title: "🏁 ROOM COMPLETED",
    content: `
      The room <strong>${roomName}</strong> has finished. Results are in—check the leaderboard and recap the action.
    `,
    ctaText: "VIEW RESULTS",
    ctaUrl: `${APP_URL}/dashboard/rooms/${roomId}`,
    footerText: "Analyze, improve, and return stronger for the next battle."
  }),

  // Game Invite Email Template
  gameInvite: (senderName: string, gameName: string) => BaseEmailTemplate({
    title: "🎮 GAME INVITATION",
    content: `
      <strong>${senderName}</strong> invited you to play <strong>${gameName}</strong>! Are you in?
    `,
    ctaText: "VIEW INVITES",
    ctaUrl: `${APP_URL}/dashboard`,
    footerText: "Accept the challenge and make your mark in the arena."
  }),

  // Payment Email Template
  payment: (amount: string, currency?: string) => BaseEmailTemplate({
    title: "💳 PAYMENT UPDATE",
    content: `
      Your payment of <strong>${amount}${currency ? ' ' + currency : ''}</strong> has been processed successfully.
    `,
    ctaText: "VIEW TRANSACTIONS",
    ctaUrl: `${APP_URL}/wallet`,
    footerText: "Your finances are secured. Keep competing and winning!"
  }),

  // Wallet Connect Email Template
  walletConnect: () => BaseEmailTemplate({
    title: "🔗 WALLET CONNECTED",
    content: `
      Your wallet has been successfully connected to Nexuz Arena. You're ready to transact seamlessly.
    `,
    ctaText: "VIEW WALLET",
    ctaUrl: `${APP_URL}/wallet`,
    footerText: "Power up your gaming economy with secure wallet connectivity."
  }),

  // Achievement Email Template
  achievement: (achievementName: string) => BaseEmailTemplate({
    title: "🎖️ ACHIEVEMENT UNLOCKED",
    content: `
      You unlocked a new achievement: <strong>${achievementName}</strong>! Keep pushing your limits.
    `,
    ctaText: "VIEW ACHIEVEMENTS",
    ctaUrl: `${APP_URL}/dashboard`,
    footerText: "Achievements are milestones on the road to mastery."
  })
};