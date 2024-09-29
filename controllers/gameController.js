require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const axios = require('axios');
const {
    handleInputValidation,
    handleRequest,
    handleResponse,
    handleIdentify,
} = require('../handler');
const { body, param, validationResult } = require('express-validator');

const Profile = require('../models/Profile');
const Game = require('../models/Game');

const create = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('name').exists().withMessage('body: name is required'),
            body('profile').exists().withMessage('body: profile1 is required'),
        ], validationResult);

        const { name, profile } = req.body;

        const profileModel = await handleIdentify('Profile', profile);

        // Get a random start track
        const response = await axios.post(`${process.env.FLASK_URI}/ml_random`);
        const { index } = response.data;
        const startTrack = index;

        // Get a random end track
        let endTrack = undefined;
        while (!endTrack || endTrack === startTrack) {
            const response = await axios.post(`${process.env.FLASK_URI}/ml_random`);
            const { index } = response.data;
            endTrack = index;
        }

        let gameModel = await Game.findOne({ name: name });

        // Create a new game
        if (!gameModel) {
            gameModel = new Game({
                name,
                profile1: profileModel._id,
                profile2: '',
                winner: '',
                startTime: new Date().toISOString(),
                profile1EndTime: '',
                profile2EndTime: '',
                profile1Path: [startTrack],
                profile2Path: [startTrack],
                startTrack,
                endTrack,
            });
            await gameModel.save();
        }

        // Add the game to the profiles
        profileModel.games.pull(gameModel._id);
        profileModel.games.push(gameModel._id);
        profileModel.activeGame = gameModel._id;
        await profileModel.save();

        return handleResponse(res, { game: gameModel });
    }
    return handleRequest(req, res, code);
}

const read = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('game_id').exists().withMessage('body: game_id is required'),
        ], validationResult);

        const { game_id } = req.body;

        const gameModel = await handleIdentify('Game', game_id);

        if (!gameModel) {
            throw new Error('Game not found');
        }

        return handleResponse(res, { game: gameModel });
    }
    return handleRequest(req, res, code);
}

const remove = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('game').exists().withMessage('body: game is required'),
        ], validationResult);

        const { game } = req.body;

        const gameModel = await handleIdentify('Game', game);

        if (!gameModel) {
            throw new Error('Game not found');
        }

        await deleteOne({ _id: gameModel._id });

        return handleResponse(res, { success: true });
    }
    return handleRequest(req, res, code);
}

const move = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('game_id').exists().withMessage('body: game_id is required'),
            body('profile_id').exists().withMessage('body: profile_id is required'),
            body('moveName').exists().withMessage('body: moveName is required'),
            body('moveValue').exists().withMessage('body: moveValue is required'),
        ], validationResult);

        const { game_id, profile_id, moveName, moveValue } = req.body;

        // Make sure it is a valid game
        const gameModel = await handleIdentify('Game', game_id);
        if (!gameModel) {
            throw new Error('Game not found');
        }

        // Make sure it is a valid profile
        const profileModel = await handleIdentify('Profile', profile_id);
        if (!profileModel) {
            throw new Error('Profile not found');
        }

        // Make sure the profile is in the game
        if (gameModel.profile1 !== profile_id && gameModel.profile2 !== profile_id) {
            throw new Error('Profile not in the game');
        }

        // Get which player is making the move
        const profileNumber = gameModel.profile1 === profile_id ? 1 : 2;

        // Make sure the player has not already finished
        if (profileNumber === 1 && gameModel.profile1EndTime) {
            throw new Error('Profile 1 has already finished');
        }
        if (profileNumber === 2 && gameModel.profile2EndTime) {
            throw new Error('Profile 2 has already finished');
        }

        // Get the last track
        const tracks = gameModel[`profile${profileNumber}Path`];
        const lastTrack = tracks[tracks.length - 1];

        // Run the machine learning algorithm
        const response = await axios.post(`${process.env.FLASK_URI}/api/run_ml`, {
            index: lastTrack,
            variable: moveName,
            direction: moveValue,
        });

        const { result } = response.data;

        console.log(lastTrack, moveName, moveValue);
        console.log(result);

        // If the track is the end track, the profile wins
        let nextTrack = result;
        if (nextTrack === gameModel.endTrack) {
            if (!gameModel.winner) {
                gameModel.winner = profile_id;
            }

            if (profileNumber === 1) {
                gameModel.profile1EndTime = new Date().toISOString();
            } else {
                gameModel.profile2EndTime = new Date().toISOString();
            }
        }

        // Update the path
        gameModel[`profile${profileNumber}Path`].push(nextTrack);
        await gameModel.save();

        return handleResponse(res, { track: nextTrack });
    }
    return handleRequest(req, res, code);
}

const factoryReset = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('profile').exists().withMessage('body: profile is required'),
        ], validationResult);

        const { profile } = req.body;

        const profileModel = await handleIdentify(Profile, profile);

        if (!profileModel) {
            throw new Error('Profile not found');
        }

        // Remove all games
        await Game.deleteMany({ _id: { $in: profileModel.games } });

        // Reset the profile
        profileModel.games = [];
        await profileModel.save();

        return handleResponse(res, { success: true });
    }
    return handleRequest(req, res, code);
}

module.exports = {
    create,
    read,
    remove,
    move,
    factoryReset,
}