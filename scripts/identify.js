define(function(require) {
    let lamejs = require("lame.all");
    lamejs();
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
                recorder.stop();

                let blob = new Blob(chunks, {type:'audio/wav; codecs=MS_PCM'})
                let url = URL.createObjectURL(blob);
                resolve(blob);
            }, 4000)
        });
    }

    // from https://franzeus.medium.com/record-audio-in-js-and-upload-as-wav-or-mp3-file-to-your-backend-1a2f35dea7e8

    function convertWavToMp3(wavBlob) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
      
          reader.onload = function () {
            const arrayBuffer = this.result;
      
            // Create a WAV decoder
            // @ts-expect-error - No idea
            const wavDecoder = lamejs.WavHeader.readHeader(new DataView(arrayBuffer));
      
            // Get the WAV audio data as an array of samples
            const wavSamples = new Int16Array(arrayBuffer, wavDecoder.dataOffset, wavDecoder.dataLen / 2);
      
            // Create an MP3 encoder
            const mp3Encoder = new lamejs.Mp3Encoder(wavDecoder.channels, wavDecoder.sampleRate, 128);
      
            // Encode the WAV samples to MP3
            const mp3Buffer = mp3Encoder.encodeBuffer(wavSamples);
      
            // Finalize the MP3 encoding
            const mp3Data = mp3Encoder.flush();
      
            // Combine the MP3 header and data into a new ArrayBuffer
            const mp3BufferWithHeader = new Uint8Array(mp3Buffer.length + mp3Data.length);
            mp3BufferWithHeader.set(mp3Buffer, 0);
            mp3BufferWithHeader.set(mp3Data, mp3Buffer.length);
      
            // Create a Blob from the ArrayBuffer
            const mp3Blob = new Blob([mp3BufferWithHeader], { type: 'audio/mp3' });
      
            resolve(mp3Blob);
          };
      
          reader.onerror = function (error) {
            reject(error);
          };
      
          // Read the input blob as an ArrayBuffer
          reader.readAsArrayBuffer(wavBlob);
        });
    }

    async function getResponse() {
        let recorder;
        chunks = [];

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {  
            await navigator.mediaDevices.getUserMedia({audio : true})
                .then( async (stream) => {

                    recorder = new MediaRecorder(stream);

                    recorder.ondataavailable = e => {
                        chunks.push(e.data);
                    }



                    // let audioStream = stream;

					// // creates the an instance of audioContext
					// const context = window.AudioContext || window.webkitAudioContext;
					// audioContext = new context({sampleRate: 44100});

					// // creates a gain node
					// const volume = audioContext.createGain();

					// // creates an audio node from the microphone incoming stream
					// const audioInput = audioContext.createMediaStreamSource(audioStream);

					// // connect the stream to the gain node
					// audioInput.connect(volume);

					// // get processor module
					// await audioContext.audioWorklet.addModule("./scripts/linear_pcm_processor.js");
					// recorder = new AudioWorkletNode(audioContext, "linear_pcm_processor");

					// // we connect the recorder
					// volume.connect(recorder);

                    // recorder.port.onmessage = (e) => {;
					// 	chunks.push(...e.data); 
					// }

                }) 
                .catch( (err) => {console.error(`getUserMedia error: ${err}`);} );
        } else {
            console.log("getUserMedia not supported on this browser");
        }

        recorder.start();

        getAudioData(recorder).then( async function(wavblob) {
            console.log(wavblob);

            convertWavToMp3(wavblob).then( async function(encodedMP3Blob) {
                

                // api call
                const url = 'https://music-identify.p.rapidapi.com/identify';
                const data = new FormData();
                data.append("clip", encodedMP3Blob);

                const options = {
                    method: 'POST',
                    headers: {
                        'x-rapidapi-key': '0bfb0321bbmsh8e25be16e31863dp15994cjsnc481a9a41b94',
                        'x-rapidapi-host': 'music-identify.p.rapidapi.com'
                    },
                    body: data
                };

                try {
                    const response = await fetch(url, options);
                    const result = await response.text();
                    console.log(result);
                } catch (error) {
                    console.error(error);
                }
            });
        });
    }

    return function buttonSensor() {
        // detector button
        const detector = document.getElementById("mic-button");
        detector.addEventListener("click", getResponse);
    }

});