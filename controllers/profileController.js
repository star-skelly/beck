require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const {
    handleInputValidation,
    handleRequest,
    handleResponse,
    handleIdentify,
} = require('../handler');
const { body, param, validationResult } = require('express-validator');

const Profile = require('../models/Profile')
const Game = require('../models/Game')

const authenticate = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('username').exists().withMessage('body: username is required'),
        ], validationResult);

        const { username } = req.body;

        let doc = await Profile.findOne({ username });

        // If the user has never signed up before, create a new profile
        if (!doc) {
            doc = new Profile({
                username,
                activeGame: '',
                games: [],
            });
            await doc.save();
        }

        // Otherwise, return their information
        return handleResponse(res, { profile: doc });
    }
    return handleRequest(req, res, code);
}

const factoryReset = async (req, res) => {
    const code = async (req, res) => {
        await Profile.deleteMany({});
        return handleResponse(res, { success: true });
    }
    return handleRequest(req, res, code);
}

const read = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('profile_id').exists().withMessage('body: profile_id is required'),
        ], validationResult);

        const { profile_id } = req.body;

        const doc = await handleIdentify('Profile', profile_id);

        return handleResponse(res, { profile: doc });
    }
    return handleRequest(req, res, code);
}

const leaveGame = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('profile_id').exists().withMessage('body: profile_id is required'),
        ], validationResult);

        const { profile_id } = req.body;

        const doc = await handleIdentify('Profile', profile_id);

        const gameModel = await handleIdentify('Game', doc.activeGame);
        if (!gameModel) {
            return handleResponse(res, { success: true });
        }

        if (gameModel.profile1 === profile_id) {
            gameModel.profile1 = '';
        }
        else {
            gameModel.profile2 = '';
        }
        await gameModel.save();

        if (!gameModel.profile1 && !gameModel.profile2) {
            // Delete the game if both profiles have left
            await Game.deleteOne({ _id: gameModel._id });
        }

        doc.activeGame = '';
        await doc.save();

        return handleResponse(res, { success: true });
    }
    return handleRequest(req, res, code);
}

const joinGame = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('profile_id').exists().withMessage('body: profile_id is required'),
            body('name').exists().withMessage('body: name is required'),
        ], validationResult);

        const { profile_id, name } = req.body;

        const profileModel = await handleIdentify('Profile', profile_id);
        const gameModel = await Game.findOne({ name });

        if (!profileModel) {
            throw new Error('Profile not found');
        }
        if (!gameModel) {
            throw new Error('Game not found');
        }
        if (profileModel.activeGame) {
            throw new Error('Profile is already in a game');
        }
        if (gameModel.profile1 && gameModel.profile2) {
            throw new Error('Game is full');
        }
        if (gameModel.profile1 === profile_id || gameModel.profile2 === profile_id) {
            throw new Error('Profile is already in the game');
        }

        profileModel.games.push(gameModel._id);
        profileModel.activeGame = gameModel._id;
        await profileModel.save();

        if (!gameModel.profile1) {
            gameModel.profile1 = profile_id;
        }
        else {
            gameModel.profile2 = profile_id;
        }
        await gameModel.save();

        return handleResponse(res, { game: gameModel });
    }
    return handleRequest(req, res, code);
}

module.exports = {
    authenticate,
    factoryReset,
    read,
    leaveGame,
    joinGame,
}