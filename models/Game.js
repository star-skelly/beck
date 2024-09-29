const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema({
    _id: {
        type: String,
        default: () => `Game-${new mongoose.Types.ObjectId()}`,
    },

    name: String,
    profile1: String,
    profile2: String,
    winner: String,
    startTime: String,
    profile1EndTime: String,
    profile2EndTime: String,
    profile1Path: [Number],
    profile2Path: [Number],
    startTrack: Number,
    endTrack: Number,
    
}, { timestamps: true, collection: 'game'})

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;