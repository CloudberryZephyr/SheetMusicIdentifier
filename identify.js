/**
 * (C) Copyright 2024 Clara Shoemaker
 * 
 * This file is part of SheetMusicIdenitifier.
 *
 * SheetMusicIdentifier is free software: you can redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software Foundation, either version 3 of the 
 * License, or (at your option) any later version.
 *
 * SheetMusicIdentifier is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without 
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with SheetMusicIdentifier. If not, see <https://www.gnu.org/licenses/>.
*/

let chunks;
let recorder;
let audioContext;
let searchLabel;


/**
 * Merges arrays in param channelArrs into a single array of characters.
 * Then joins the contents of the array into a continuous string and converts
 * that string into a Base64 string, which is then returned.
 * @param {Array<Array<char>} channelArrs contains arrays of chars
 * @returns Base64 string corresponding to channelArrs
 */
function mergeArrays(channelArrs) {
    let channel = [];

    for (let i = 0; i < channelArrs.length; i++) {
        channel.push(...(channelArrs[i]));
    }

    return btoa(channel.join(""));;
}


/**
 * After 4 seconds of passive data collection, the recorder is disconnected,
 * data is converted, and a Promise cesolving with the resulting Base64 string is returned.
 * @param {AudioWorkletNode} recorder AudioWorkletNode corresponding to the audio processor
 * @returns Promise which resolves into the final data to be posted to the API.
 */
function getAudioData(recorder) {
    return new Promise( function(resolve, reject) {
        setTimeout( function() {
            recorder.disconnect();

            let base64 = mergeArrays(chunks)
            resolve(base64);
        }, 4000)
    });
}

/**
 * Main function.  First sets up audio input, then uses Api Dojo's Shazam API
 * to find artist and title of recognizable work in ambient audio data.
 * 
 * Link to API: https://rapidapi.com/apidojo/api/shazam 
 * 
 */
async function getResponse() {
    chunks = [];

    // Set up audio input
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {  
        await navigator.mediaDevices.getUserMedia({audio : true})
            .then( async (stream) => {

                let audioStream = stream;

                // creates the an instance of audioContext
                const context = window.AudioContext || window.webkitAudioContext;
                audioContext = new context({sampleRate: 44100});

                // creates a gain node
                const volume = audioContext.createGain();

                // creates an audio node from the microphone incoming stream
                const audioInput = audioContext.createMediaStreamSource(audioStream);

                // connect the stream to the gain node
                audioInput.connect(volume);

                // get processor module
                await audioContext.audioWorklet.addModule("./pcm_char_processor.js");
                recorder = new AudioWorkletNode(audioContext, "pcm_char_processor");

                // we connect the recorder
                volume.connect(recorder);

                recorder.port.onmessage = (e) => {;
                    chunks.push(...e.data); 
                }

            }) 
            .catch( (err) => {console.error(`getUserMedia error: ${err}`);} );
    } else {
        console.log("getUserMedia not supported on this browser");
    }

    recorder.connect(audioContext.destination);

    //Send data to Shazam API
    getAudioData(recorder).then( async function(base64String) {
        console.log(base64String);

        const url = 'https://shazam.p.rapidapi.com/songs/v2/detect?timezone=America%2FChicago&locale=en-US';
        const options = {
            method: 'POST',
            headers: {
                'x-rapidapi-key': '0bfb0321bbmsh8e25be16e31863dp15994cjsnc481a9a41b94',  // TODO: Change api key for personal use
                'x-rapidapi-host': 'shazam.p.rapidapi.com',
                'Content-Type': 'text/plain'
            },
            body: base64String
        };

        try {
            const response = await fetch(url, options);
            const result = await response.text();
            console.log(result);

            //Format artist and title for search results
            if (result.includes("\"matches\":[]")) {
                searchLabel.textContent = "Audio not recognized.  Please retry."
                searchTerm = "";
            } else {
                const artist = result.split("trackartist}\":")[1].split("\"")[1];
                const title = result.split("\"title\":")[1].split("\"")[1];
                
                searchTerm = title + " " + artist;
                searchLabel.textContent = "Search by " + title + " by " + artist;
            }
        } catch (error) {
            console.error(error);
        }
    });
}

/**
 * Redirects the webpage to a search result page at musescore.com
 */
function redirect() {
    // https://musescore.com/sheetmusic?text=caribbean%20blue%20enya
    // default https://musescore.com/

    if (searchTerm == "") {
        window.location.href = "https://musescore.com/";
    } else {
        const formattedSearchTerm = "https://musescore.com/sheetmusic?text=" + searchTerm.replace(new RegExp(" ", "g"), "%20");
        console.log(formattedSearchTerm);
        window.location.href = formattedSearchTerm;
    }
}



document.addEventListener("DOMContentLoaded", function() {
    // detector button
    const detector = document.getElementById("mic-button");
    detector.addEventListener("click", getResponse);

    // set up musecore search button
    const searchbtn = document.getElementById("search-button");
    searchbtn.addEventListener("click", redirect)

    searchLabel = document.getElementById("p1");
});