let leftChannel;
let recordingLength;

///* for data gathering

let rawdata;
let pcm16data = [];
let pcm8data = [];
// let asciiArr = [];
let asciiStr;
let base64Str;

//*/

function mergeBuffers(channel) {
    let buffer = [];

    for (i = 0; i < channel.length; i++) {
        buffer.push(...channel[i]);
    }

    return buffer;
}

function setUpAudio(stream) {
    let bufferSize = 2048;
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

    let recorder = audioContext.createScriptProcessor.call(audioContext, bufferSize, 1, 1);

    // we connect the recorder
    volume.connect(recorder);

    recorder.onaudioprocess = function(event){
        const samples = event.inputBuffer.getChannelData(0);

        const samplesCopy = new Float32Array(samples);

        // we clone the samples
        leftChannel.push(samplesCopy);

        recordingLength += samplesCopy.length;
    };

    return [recorder, audioContext];
}

function getAudioData(recorder) {
    return new Promise( function(resolve, reject) {
        setTimeout( function() {
            recorder.disconnect();
            let samples = mergeBuffers(leftChannel);

            rawdata = samples;

            let buffer = [];

            for (i = 0; i < samples.length; i++) {
                let val = Math.floor(32767 * samples[i]);
				val = Math.min(32767, val);
				val = Math.max(-32768, val);

                pcm16data.push(val);

                let low = val & 255;
				let high = (val & (255 << 8)) >> 8;

                pcm8data.push(low);
                pcm8data.push(high);

                buffer.push(String.fromCharCode(low));
                buffer.push(String.fromCharCode(high));

                // asciiArr.push(String.fromCharCode(low));
                // asciiArr.push(String.fromCharCode(high));
            }

            let string = buffer.join("");

            asciiStr = string;

            let base64 = btoa(string);

            base64Str = base64;

            resolve(base64);
        }, 5000)
    });
}

async function getResponse() {
    leftChannel = [];

    let recorder;
    let audioContext;

    // get audio setup
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {  
        await navigator.mediaDevices.getUserMedia({audio : true})
            .then((stream) => {
                let vals = setUpAudio(stream);
                recorder = vals[0];
                audioContext = vals[1]; 
            }) 
            .catch( (err) => {console.error(`getUserMedia error: ${err}`);} );
    } else {
        console.log("getUserMedia not supported on this browser");
    }

    recorder.connect(audioContext.destination);

    getAudioData(recorder).then(  async function(returnString) {
        ///* for gathering data

        console.log(rawdata);
        console.log(pcm16data);
        console.log(pcm8data);
        // console.log(asciiArr);
        console.log(asciiStr);
        console.log(base64Str);

        //*/

        // fetch song data from shazam api
        const url = 'https://shazam.p.rapidapi.com/songs/v2/detect?timezone=America%2FChicago&locale=en-US';
        const options = {
	        method: 'POST',
	        headers: {
		        'x-rapidapi-key': '0bfb0321bbmsh8e25be16e31863dp15994cjsnc481a9a41b94',
		        'x-rapidapi-host': 'shazam.p.rapidapi.com',
		        'Content-Type': 'text/plain'
	        },
	        body: returnString
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






document.addEventListener("DOMContentLoaded", () => { 
    // detector button
    const detector = document.getElementById("mic-button");
    detector.addEventListener("click", getResponse);
})