define(function(require) {
    let lamejs = require("lame.all");
    let chunks;

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

                let mergedAudio = mergeArrays(chunks);
                resolve(mergedAudio);
            }, 4000)
        });
    }

    async function getResponse() {
        let recorder;
        chunks = [];

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

                    recorder.port.onmessage = (e) => {
                        const samples = new Array(...(e.data));
						chunks.push(samples); 
					}

                }) 
                .catch( (err) => {console.error(`getUserMedia error: ${err}`);} );
        } else {
            console.log("getUserMedia not supported on this browser");
        }

        recorder.connect(audioContext.destination);

        getAudioData(recorder).then( async function(audioChunks) {
            console.log(audioChunks);

            const url = 'https://shazam.p.rapidapi.com/songs/v2/detect?timezone=America%2FChicago&locale=en-US';
            const options = {
                method: 'POST',
                headers: {
                    'x-rapidapi-key': '0bfb0321bbmsh8e25be16e31863dp15994cjsnc481a9a41b94',
                    'x-rapidapi-host': 'shazam.p.rapidapi.com',
                    'Content-Type': 'text/plain'
                },
                body: audioChunks
            };

            try {
                const response = await fetch(url, options);
                const result = await response.text();
                console.log(result);
            } catch (error) {
                console.error(error);
            }



        });
    }

    return function buttonSensor() {
        // detector button
        const detector = document.getElementById("mic-button");
        detector.addEventListener("click", getResponse);
    }

});