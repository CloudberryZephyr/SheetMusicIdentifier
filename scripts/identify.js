define(function(require) {
    let lamejs = require("lame.all");

    function mergeArrays(channelArrs) {
        let channel = [];

        for (let i = 0; i < channelArrs.length; i++) {
            channel.push(...(channelArrs[i]));
        }

        return new Int16Array(channel);
    }

    function getAudioData(recorder, chunks) {
        return new Promise( function(resolve, reject) {
            setTimeout( function() {
                recorder.disconnect();

                let mergedAudio = mergeArrays(chunks);
                resolve(mergedAudio);
            }, 5000)
        });
    }

    async function getResponse() {
        let recorder;
        let chunks = [];

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
                        const samples = new Int16Array(e.data);
						chunks.push(samples); 
					}

                }) 
                .catch( (err) => {console.error(`getUserMedia error: ${err}`);} );
        } else {
            console.log("getUserMedia not supported on this browser");
        }

        recorder.connect(audioContext.destination);

        getAudioData(recorder, chunks).then( function(audioChunks) {
            


        });

    }

    return function buttonSensor() {
        // detector button
        const detector = document.getElementById("mic-button");
        detector.addEventListener("click", getResponse);
    }

});