# Webby DJ

A project that let you play the music list and remotely controlled by your mobile.

## Requirement

- Node JS 16+.
- The playing device should connect to same Wifi as the controller devices.
- Put some songs in the format of `/src/tracks/{your-playlist-name}/`, there's a sample `ai.mp3` file in `samples/` folder.

## Start / Development

Run following commands:

```
npm install
npm run start -- -y # this is going to npx the concurrently

# or
# npm run dev-server # for socket io server
# npm run dev # for frontend and player server
```

Then open `http://localhost:8888/?server` on the server.

There should be a little QR Code icon floating on the top right corner, click it and it will show the current IP adrress and URL to connect with.

Play the music on the device first, this step is required because browser is not supposed to play music before any user interaction.

The controllers can now navigate to the URL, and control the music playback remotely.
