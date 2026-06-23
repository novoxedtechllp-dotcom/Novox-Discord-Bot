const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    tech_channels: { type: Map, of: String, default: {} },
    ticket_channels: { type: Map, of: String, default: {} },
    mentor_roles: { type: Map, of: String, default: {} },
    student_roles: { type: Map, of: String, default: {} },
    liveLeaderboardMessageId: { type: String, index: true },
    lastPostedUrls: { type: Map, of: String, default: {} }
});

const DataSchema = new mongoose.Schema({
    id: { type: String, default: 'main', unique: true },
    lastPostedUrls: { type: Map, of: String, default: {} }
});

const ReputationSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    points: { type: Number, default: 0 },
    lastThankedBy: { type: Map, of: Date, default: {} }
});
ReputationSchema.index({ guildId: 1, userId: 1 }, { unique: true });

const ResourceSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    topic: { type: String, required: true },
    link: { type: String, required: true },
    description: { type: String, required: true },
    addedBy: { type: String, required: true }
});

const Models = {
    Config: mongoose.model('Config', ConfigSchema),
    Data: mongoose.model('Data', DataSchema),
    Reputation: mongoose.model('Reputation', ReputationSchema),
    Resource: mongoose.model('Resource', ResourceSchema)
};

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
    }
}

module.exports = { connectDB, Models };
