import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const port = process.env.PORT;

const root = dirname(fileURLToPath(import.meta.url))

app.get("/", (_req, res) => {
    res.sendFile("main.html", {
        root: root,
    })
});

app.get("/main.js", (_req, res) => {
    res.appendHeader("Content-Type", "text/javascript");

    res.sendFile("main.js", {
        root: root,
    });
});

app.get("/client_id", (_req, res) => {
    res.appendHeader("Content-Type", "text/plain");
    res.send(process.env.SPOTIFY_CLIENT_ID);
})

app.listen(port, () => {
    console.log(`The server is running at http://localhost:${port}`);
});
