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

const getTrack = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('index').exists().withMessage('body: index is required'),
        ], validationResult);

        const { index } = req.body;

        const indexInt = parseInt(index);
        if (index < 0 || index > 10000) {
            throw new Error('Index must be between 0 and 999');
        }   

        const response = await axios.post('https://flask-mhacks-2024f8b916e5.herokuapp.com/index_to_row', {
            index: indexInt,
        })
        
        let {
            album,
            genres,
            artist,
            name,
            image,
            preview,
            albumReleaseDate,
            danceability,
            energy,
            loudness,
            speechiness,
            acousticness,
            instrumentalness,
            liveness,
            valence,
            tempo,
        } = response.data;

        const track = {
            index: indexInt,
            genres,
            album,
            artist,
            name,
            preview,
            image,
            danceability: parseInt(danceability),
            energy: parseInt(energy),
            loudness: parseInt(loudness),
            speechiness: parseInt(speechiness),
            acousticness: parseInt(acousticness),
            instrumentalness: parseInt(instrumentalness),
            liveness: parseInt(liveness),
            valence: parseInt(valence),
            tempo: parseInt(tempo),
            albumReleaseDate,
        };

        await handleResponse(res, { track });
    }

    await handleRequest(req, res, code);
}

const getProgress = async (req, res) => {
    const code = async (req, res) => {
        await handleInputValidation(req, [
            body('game_id').exists().withMessage('body: game_id is required'),
            body('profile_id').exists().withMessage('body: profile_id is required'),
        ], validationResult);

        const { game_id, profile_id } = req.body;

        const gameModel = await handleIdentify('Game', game_id);

        const profile1 = gameModel.profile1;
        const you = profile1 === profile_id ? 'profile1' : 'profile2';
        
        let progress = 0;
        if (gameModel[you + 'Path'].length > 0) {
            progress = gameModel[you + 'Path'].length - 1;
        }

        const response = await axios.post(`${process.env.FLASK_URI}/shortest_steps`, {
            start: gameModel.startTrack,
            end: gameModel.endTrack,
        })

        const {
            shortest_steps,
        } = response.data;

        const shortest_steps_int = parseInt(shortest_steps);

        const percentage = (progress / (shortest_steps_int + progress)) * 100;
        
        await handleResponse(res, { progress: percentage });
    }
    await handleRequest(req, res, code);
}

module.exports = {
    getTrack,
    getProgress,
}