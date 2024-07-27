define(function(require) {
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

                let base64 = mergeArrays(chunks)
                resolve(base64);
            }, 4000)
        });
    }

    async function getResponse() {
        let recorder;
        let audioContext;
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

                    recorder.port.onmessage = (e) => {;
						chunks.push(...e.data); 
					}

                }) 
                .catch( (err) => {console.error(`getUserMedia error: ${err}`);} );
        } else {
            console.log("getUserMedia not supported on this browser");
        }

        recorder.connect(audioContext.destination);

        getAudioData(recorder).then( async function(base64String) {
            console.log(base64String);
            
        });
    }

    return function buttonSensor() {
        // detector button
        const detector = document.getElementById("mic-button");
        detector.addEventListener("click", getResponse);
    }

});