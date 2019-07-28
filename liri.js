//* Declare Requirements
require('dotenv').config();
const colors = require('colors');
const axios = require('axios');
const keys = require('./keys');
const Spotify = require('node-spotify-api');
const spotify = new Spotify({
    id: keys.spotify.id,
    secret: keys.spotify.secret,
});
const inquire = require('inquirer');
const moment = require('moment');
const fs = require('fs');

// Welcome banner
console.log('*******************************\n\tWelcome to Liri\n*******************************'.cyan);

//* Select functionality
inquire
    .prompt([
        {
            message: 'Please select from the following options:',
            choices: ['Concerts near me', 'Search for a song', 'Search for a movie', 'Auto-suggestion'],
            name: 'functionChoice',
            type: 'list',
        },
    ])
    .then((res) => {
        let choice = res.functionChoice;

        choice === 'Auto-suggestion' ? doWhatItSays() : parseChoice(choice);
    });

//* Primary Functions
function parseChoice(choice) {
    switch (choice) {
        case 'Concerts near me':
            inquire
                .prompt([
                    {
                        message: 'What band would you like to see?',
                        name: 'band',
                        type: 'input',
                    },
                ])
                .then((res) => {
                    concertThis(res.band);
                });
            break;

        case 'Search for a song':
            inquire
                .prompt([
                    {
                        message: 'What song would you like to know about?',
                        name: 'song',
                        type: 'input',
                    },
                ])
                .then((res) => {
                    spotifyThisSong(res.song);
                });
            break;

        case 'Search for a movie':
            inquire
                .prompt([
                    {
                        message: 'What movie would you like to know about?',
                        name: 'movie',
                        type: 'input',
                    },
                ])
                .then((res) => {
                    movieSearch(res.movie);
                });
            break;
    }
}

// Concert This
function concertThis(band) {
    const apiCall = `https://rest.bandsintown.com/artists/${band}/events?app_id=codingbootcamp`;

    // Get data
    axios.get(apiCall).then((res) => {
        // Reference data
        const data = res.data;

        // Display number of shows
        console.log(`We found ${data.length} ${titleCase(band)} shows coming up!`);

        // Display each show
        data.forEach((show) => {
            // Format Data
            const showData = {};

            showData['Show Time'] = moment(show.datetime).format('MM/DD/YYYY, h:mm a');
            showData['Venue'] = show.venue.name;
            showData['Location'] = `${show.venue.city}, ${show.venue.region}`;
            showData['Lineup'] = show.lineup.join(', ');

            // Display data
            console.table(showData);
        });
    });

    fs.appendFile('log.txt', `concert-this: ${band}\n`, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

// Spotify This Song
function spotifyThisSong(song) {
    const thisSong = song === '' ? 'The Sign' : song;

    spotify.search(
        {
            type: 'track',
            query: thisSong,
            limit: 1,
        },
        (err, data) => {
            if (err) {
                return console.error(err);
            }
            const results = data.tracks.items;

            results.forEach((searchRef) => {
                // Reference each value
                const songName = searchRef.name;
                const artists = [];
                const album = searchRef.album.name;
                const songPreview = searchRef.external_urls.spotify;

                // List all artists by name
                searchRef.artists.forEach((artist) => artists.push(artist.name));

                // Format data
                const songInfo = {};
                songInfo['Song'] = songName;
                songInfo['Artist(s)'] = artists.join(', ');
                songInfo['Album'] = album;
                songInfo['Listen Here'] = songPreview;

                // Display data
                console.table(songInfo);
            });
        }
    );

    fs.appendFile('log.txt', `spotify-this-song: ${song}\n`, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

// Search for a movie
function movieSearch(movie) {
    const thisMovie = movie === '' ? 'Mr. Nobody' : movie;
    const apiCall = `http://www.omdbapi.com/?apikey=trilogy&t=${thisMovie}`;

    axios.get(apiCall).then((res) => {
        const data = res.data;

        const title = data.Title;
        const year = data.Year;
        let rating;
        const country = data.Country;
        const lang = data.Language;
        const plot = data.Plot;
        const actors = data.Actors;

        data.Ratings.forEach((source) => {
            if (source.Source === 'Rotten Tomatoes') {
                rating = source.Value;
            }
        });

        // Creates fallback if Rotten Tomatoes rating is not listed
        if (rating === '') {
            data.Ratings.forEach((source) => {
                if (source.Source === 'Internet Movie Database') {
                    rating = source.Value;
                }
            });
        }

        const movieInfo = {};
        movieInfo['Title'] = title;
        movieInfo['Release'] = year;
        movieInfo['Rating'] = rating;
        movieInfo['Actors'] = actors;
        movieInfo['Language'] = lang;
        movieInfo['Country'] = country;

        console.table(movieInfo);
        console.log(`Plot: ${plot}`); // Moved to own line for formatting
    });

    fs.appendFile('log.txt', `movie-this: ${movie}\n`, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

// Let the computer control your life
function doWhatItSays() {
    const r = Math.floor(Math.random() * 3);
    const choices = [];

    fs.readFile('random.txt', 'utf8', (err, data) => {
        if (err) {
            return console.error(err);
        }

        const lines = data.split('\n');

        lines.forEach((line) => {
            const splitLine = line.split(',');
            const val = splitLine.pop();

            choices.push(val);
        });

        const randomChoice = choices[r];

        fs.appendFile('log.txt', 'LIRI: ', (err) => {
            if (err) {
                console.error(err);
            }
        });

        switch (r) {
            case 0:
                console.log('LIRI has selected to show you a random song on Spotify!');
                spotifyThisSong(randomChoice);
                break;

            case 1:
                console.log('LIRI has selected to show you information about a random movie!');
                movieSearch(randomChoice);
                break;

            case 2:
                console.log('LIRI has selected to show you concerts for a random artist!');
                concertThis(randomChoice);
                break;
        }
    });
}

//* Helper Functions
function titleCase(str) {
    const splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }

    return splitStr.join(' ');
}
