
const SettingsPage = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 rounded-2xl p-6">
        <h1 className="font-cyber text-3xl font-bold text-gray-400 mb-2 glow-text">
          ⚙️ Settings
        </h1>
        <p className="text-muted-foreground">Customize your gaming experience and account preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-6">
        <h2 className="font-cyber text-xl font-bold text-primary mb-6">👤 Profile Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-cyber text-muted-foreground mb-2">Username</label>
            <input 
              type="text" 
              defaultValue="CryptoGamer" 
              className="w-full bg-secondary/20 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-cyber text-muted-foreground mb-2">Email</label>
            <input 
              type="email" 
              defaultValue="gamer@example.com" 
              className="w-full bg-secondary/20 border border-primary/30 rounded-lg px-4 py-2 font-cyber text-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Game Preferences */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-6">
        <h2 className="font-cyber text-xl font-bold text-primary mb-6">🎮 Game Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-cyber text-foreground">Auto-Join Rooms</div>
              <div className="text-sm text-muted-foreground font-cyber">Automatically join available game rooms</div>
            </div>
            <button className="bg-primary/20 border-2 border-primary/40 rounded-full w-12 h-6 relative transition-all duration-300">
              <div className="bg-primary w-4 h-4 rounded-full absolute top-0.5 left-0.5 transition-all duration-300"></div>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-cyber text-foreground">Sound Effects</div>
              <div className="text-sm text-muted-foreground font-cyber">Enable game sound effects</div>
            </div>
            <button className="bg-primary border-2 border-primary rounded-full w-12 h-6 relative transition-all duration-300">
              <div className="bg-background w-4 h-4 rounded-full absolute top-0.5 right-0.5 transition-all duration-300"></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-cyber text-foreground">Push Notifications</div>
              <div className="text-sm text-muted-foreground font-cyber">Get notified about game events</div>
            </div>
            <button className="bg-primary border-2 border-primary rounded-full w-12 h-6 relative transition-all duration-300">
              <div className="bg-background w-4 h-4 rounded-full absolute top-0.5 right-0.5 transition-all duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-black/40 backdrop-blur-lg border border-primary/30 rounded-2xl p-6">
        <h2 className="font-cyber text-xl font-bold text-primary mb-6">🔒 Security</h2>
        <div className="space-y-4">
          <button className="w-full bg-gradient-to-r from-primary to-accent text-background font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300">
            🔑 Change Password
          </button>
          <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-background font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300">
            🛡️ Enable 2FA
          </button>
          <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-background font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300">
            💼 Backup Wallet
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
        <h2 className="font-cyber text-xl font-bold text-red-400 mb-6">⚠️ Danger Zone</h2>
        <div className="space-y-4">
          <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-cyber font-bold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300">
            🗑️ Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
