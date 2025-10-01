import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  start: {
    type: Date,
    required: true,
    default: Date.now
  },
  end: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  }
});

const deviceSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  mac: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  hostname: {
    type: String,
    required: true,
    trim: true
  },
  vendor: {
    type: String,
    required: true,
    trim: true
  },
  lastRttMs: {
    type: Number,
    default: null
  },
  netbios: {
    type: String,
    trim: true
  },
  osGuess: {
    type: String,
    trim: true
  },
  firstSeen: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    required: true,
    default: Date.now
  },
  online: {
    type: Boolean,
    required: true,
    default: true,
    index: true
  },
  sessions: [sessionSchema],
  offre: {
    type: String,
    required: true,
    default: "1H",
    enum: ["1H", "3H","NIGHT","DAY","1S","2S","3S","1M"]
  }
}, {
  timestamps: true
});

// Index composé pour les requêtes fréquentes
deviceSchema.index({ online: 1, lastSeen: -1 });

// Méthode pour mettre à jour le statut de connexion
deviceSchema.methods.updateStatus = async function(isOnline) {
  const now = new Date();
  const wasOnline = this.online;
  this.online = isOnline;
  this.lastSeen = now;
  
  if (isOnline && !wasOnline) {
    // Si l'appareil revient en ligne, on démarre une nouvelle session
    this.sessions.push({ start: now });
  } else if (!isOnline && wasOnline && this.sessions.length > 0) {
    // Si l'appareil se déconnecte, on met à jour la dernière session
    const lastSession = this.sessions[this.sessions.length - 1];
    if (!lastSession.end) {
      lastSession.end = now;
      lastSession.durationMs = lastSession.end - lastSession.start;
      this.durationMs = this.sessions.reduce((total, s) => 
        total + (s.durationMs || 0), 0
      );
    }
  }
  
  return this.save();
};

// Middleware pour mettre à jour lastSeen avant chaque sauvegarde
deviceSchema.pre('save', function(next) {
  if (this.isModified('online') && this.online) {
    this.lastSeen = new Date();
  }
  next();
});

export default mongoose.model("Device", deviceSchema);