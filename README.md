This repository uses browser js to record ambient audio data and then redirect the user to a search page containing sheet music corresponding to the ambient audio.  This process converts mic audio from browser default input to a Base64 string.  This string is posted to Api Dojo's Shazam Api, found at https://rapidapi.com/apidojo/api/shazam.  The api's response is then scraped for artist and title information, which is pasted into a search url at https://musescore.com.



© Copyright 2024 Clara Shoemaker

SheetMusicIdentifier is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

SheetMusicIdentifier is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

A copy of the GNU General Public License should be found among the files of this repository. If not, see <https://www.gnu.org/licenses/>.
