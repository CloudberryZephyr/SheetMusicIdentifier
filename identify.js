let chunks;
let recorder;
let audioContext;
let searchLabel;

function mergeArrays(channelArrs) {
    let channel = [];

    for (let i = 0; i < channelArrs.length; i++) {
        channel.push(...(channelArrs[i]));
    }

    return btoa(channel.join(""));;
}

function getAudioData(recorder) {
    return new Promise( function(resolve, reject) {
        setTimeout( function() {
            recorder.disconnect();

            let base64 = mergeArrays(chunks)
            resolve(base64);
        }, 4000)
    });
}

async function getResponse() {
    chunks = [];

    if (recorder != null) {
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
                    await audioContext.audioWorklet.addModule("./scripts/linear_pcm_processor.js");
                    recorder = new AudioWorkletNode(audioContext, "linear_pcm_processor");

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
    }

    recorder.connect(audioContext.destination);

    getAudioData(recorder).then( async function(base64String) {
        console.log(base64String);

        const url = 'https://shazam.p.rapidapi.com/songs/v2/detect?timezone=America%2FChicago&locale=en-US';
        const options = {
            method: 'POST',
            headers: {
                'x-rapidapi-key': '0bfb0321bbmsh8e25be16e31863dp15994cjsnc481a9a41b94',
                'x-rapidapi-host': 'shazam.p.rapidapi.com',
                'Content-Type': 'text/plain'
            },
            body: base64String
        };

        try {
            const response = await fetch(url, options);
            const result = await response.text();
            console.log(result);

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

