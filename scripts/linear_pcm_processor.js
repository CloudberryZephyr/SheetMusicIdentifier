
class LinearPCMProcessor extends AudioWorkletProcessor {
    
        constructor() {
            super();
        }
    
        /**
         * Converts input data from Float32Array to an array of ASCII characters, and
         * sends it in a message to the main thread.
         */
        process(inputList, _outputList, _parameters) {

            let buffer = [];

            const input = inputList[0][0]; // first channel of first input

            
            for (let i = 0; i < input.length; i++) {
                // convert from pcm 32 to pcm 16
                let val = Math.floor(32767 * input[i]);
                val = Math.min(32767, val);
                val = Math.max(-32768, val);
            }
    
            this.port.postMessage(buffer);
            return true;
        }
    }
    
    registerProcessor("linear_pcm_processor", LinearPCMProcessor);