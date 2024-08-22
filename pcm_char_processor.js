/**
 * (C) Copyright 2024 Clara Shoemaker
 * 
 * This file is part of SheetMusicIdenitifier.
 *
 * SheetMusicIdentifier is free software: you can redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software Foundation, either version 3 of the 
 * License, or (at your option) any later version.
 *
 * SheetMusicIdentifier is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without 
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with SheetMusicIdentifier. If not, see <https://www.gnu.org/licenses/>.
 */


class PCMCharProcessor extends AudioWorkletProcessor {
    
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

            // splits each val (a 2B value) into two 1B values
            let low = val & 255;
            let high = (val & (255 << 8)) >> 8;

            // add the char corresponding to the 1B value to the buffer
            buffer.push(String.fromCharCode(low));
            buffer.push(String.fromCharCode(high));
        }

        // return the current buffer
        this.port.postMessage(buffer);
        return true;
    }
}
    
registerProcessor("pcm_char_processor", PCMCharProcessor);