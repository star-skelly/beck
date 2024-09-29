require('dotenv').config()
const path = require('path')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const mongoose = require('mongoose')

const profileRoutes = require('../routes/profile');
const gameRoutes = require('../routes/game');
const spotifyRoutes = require('../routes/spotify');

// express app
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

// CORS
app.use(cors());

// middleware
app.use(express.json());

// Configure Multer
const upload = multer();

// Middleware to process files
app.use((req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Handle Multer errors
            return res.status(400).json({ error: 'File upload error: ' + err.message, data: null })
        } else if (err) {
            // Handle other errors
            return res.status(400).json({ error: 'File upload error: ' + err.message, data: null })
        }
        next()
    })
});

// Set up middleware to handle form data
app.use(express.urlencoded({ extended: true }));

// Log each request
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}, ${JSON.stringify(req.body)}`)
    next()
});

// routes
app.use('/api/profile', profileRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/spotify', spotifyRoutes);
app.get('/', (req, res) => {
    res.send('Hello from Node.js backend!');
  });

// send some HTML to say hello world
app.use((req, res) => {
    res.status(404).send('<h1>The API is running!</h1>');
});

// connect to db
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        // listen for requests
        app.listen(process.env.PORT, () => {
            console.log(`connected to MongoDB & listening on port ${process.env.PORT}`)
        })
    })
    .catch((error) => {
        console.log(error)
    });

module.exports = app;