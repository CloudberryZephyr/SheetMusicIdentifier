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

            // adapted from lamejs api example:

            let mp3encoder = new lamejs.Mp3Encoder(1, 44100, 128);

            let samples = audioChunks; //one second of silence (get your data from the source you have)
            let sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier

            let mp3Data = [];
            for (var i = 0; i < samples.length; i += sampleBlockSize) {
                let sampleChunk = samples.subarray(i, i + sampleBlockSize);
                let mp3buf = mp3encoder.encodeBuffer(sampleChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }

            let mp3buf = mp3encoder.flush();   //finish writing mp3

            if (mp3buf.length > 0) {
                mp3Data.push(new Int8Array(mp3buf));
            }

            let blob = new Blob(mp3Data, {type: 'audio/mp3'});
            let url = window.URL.createObjectURL(blob);
            console.log('MP3 URl: ', url);
            


        });

    }

    return function buttonSensor() {
        // detector button
        const detector = document.getElementById("mic-button");
        detector.addEventListener("click", getResponse);
    }

});