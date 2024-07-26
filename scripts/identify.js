import * as ffmpeg from "ffmpeg";

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
                resolve(blob);
            }, 4000)
        });
    }

    // https://stackoverflow.com/questions/57365486/converting-blob-webm-to-audio-file-wav-or-mp3

    async function convertWebmToMp3(webmBlob) {
        const ffmpeg = createFFmpeg({ log: false });
        await ffmpeg.load();
      
        const inputName = 'input.webm';
        const outputName = 'output.mp3';
      
        ffmpeg.FS('writeFile', inputName, await fetch(webmBlob).then((res) => res.arrayBuffer()));
      
        await ffmpeg.run('-i', inputName, outputName);
      
        const outputData = ffmpeg.FS('readFile', outputName);
        const outputBlob = new Blob([outputData.buffer], { type: 'audio/mp3' });
      
        return outputBlob;
    }

    async function getResponse() {
        let recorder;
        chunks = [];

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {  
            await navigator.mediaDevices.getUserMedia({audio : true})
                .then( async (stream) => {

                    recorder = new MediaRecorder(stream, {mimeType: "audio/wav; codecs=MS_PCM"});

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

        recorder.start(100);

        getAudioData(recorder).then( async function(wavblob) {
            console.log(wavblob);
            
            convertWebmToMp3(wavblob).then( function(mp3blob) {
                console.log(mp3blob);
            });
        });
    }

    return function buttonSensor() {
        // detector button
        const detector = document.getElementById("mic-button");
        detector.addEventListener("click", getResponse);
    }

});