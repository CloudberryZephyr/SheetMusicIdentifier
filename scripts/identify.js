let chunks;
//let recorder;

define(function(require) {
    let lamejs = require("lame.all");

    function getAudioData(recorder) {
        return new Promise( function(resolve, reject) {
            setTimeout( function() {
                recorder.stop();

                resolve(chunks);
            }, 5000)
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
					await audioContext.audioWorklet.addModule("./linear_pcm_processor.js");
					recorder = new AudioWorkletNode(audioContext, "linear_pcm_processor");

					// we connect the recorder
					volume.connect(recorder);

                    recorder.port.onmessage = (e) => {
						console.log(e.data);
                        
                        //const samples = new Float32Array(e.data);
						// chunks.push(samples); 
						// recordingLength += samples.length;
					}

                }) 
                .catch( (err) => {console.error(`getUserMedia error: ${err}`);} );
        } else {
            console.log("getUserMedia not supported on this browser");
        }

        recorder.start();

        getAudioData(recorder).then( function(audioChunks) {
            console.log('done');


        });

    }

    return function buttonSensor() {
        // detector button
        const detector = document.getElementById("mic-button");
        detector.addEventListener("click", getResponse);
    }

});