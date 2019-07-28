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

        switch (choice) {
            case 'Concerts near me':
                concertThis();
                break;

            case 'Search for a song':
                spotifyThisSong();
                break;

            case 'Search for a movie':
                movieSearch();
                break;

            case 'Auto-suggestion':
                //TODO: do-what-it-says
                break;
        }
    });

//* Primary Functions

// Concert This
function concertThis() {
    inquire
        .prompt([
            {
                message: 'What band would you like to see?',
                name: 'band',
                type: 'input',
            },
        ])
        .then((res) => {
            // References
            const band = res.band;
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
        });
}

// Spotify This Song
function spotifyThisSong() {
    inquire
        .prompt([
            {
                message: 'What song would you like to know about?',
                name: 'song',
                type: 'input',
            },
        ])
        .then((res) => {
            const song = res.song === '' ? 'The Sign' : res.song;

            spotify.search(
                {
                    type: 'track',
                    query: song,
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
        });
}

function movieSearch() {
    inquire
        .prompt([
            {
                message: 'What movie would you like to know about?',
                name: 'movie',
                type: 'input',
            },
        ])
        .then((res) => {
            const movie = res.movie === '' ? 'Mr. Nobody' : res.movie;
            const apiCall = `http://www.omdbapi.com/?apikey=trilogy&t=${movie}`;

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
