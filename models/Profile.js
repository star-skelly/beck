const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = new Schema({
    _id: {
        type: String,
        default: () => `Profile-${new mongoose.Types.ObjectId()}`,
    },

    username: String,
    activeGame: String,
    games: [String],
}, { timestamps: true, collection: 'profile'})

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;