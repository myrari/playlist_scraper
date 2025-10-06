import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { randomBytes } from "crypto";
import { stringify } from "querystring";

const app = express();
const port = process.env.PORT;

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

const redirect_uri = "http://127.0.0.1:4242/callback";

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

app.get("/styles.css", (_req, res) => {
    res.appendHeader("Content-Type", "text/css");

    res.sendFile("styles.css", {
        root: root,
    });
});

app.get("/client_id", (_req, res) => {
    res.appendHeader("Content-Type", "text/plain");
    res.send();
})

app.get('/login', (_req, res) => {

    const state = randomBytes(8).toString("hex");
    const scope = "playlist-read-private playlist-read-collaborative";

    res.redirect('https://accounts.spotify.com/authorize?' +
        stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get("/callback", (req, res) => {
    const code = req.query.code;
    const state = req.query.state;

    if (state == undefined) {
        res.redirect("/#" +
            stringify({
                error: "state_mismatch"
            }));
    } else {
        fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            body: stringify({
                code: code?.toString(),
                redirect_uri: redirect_uri,
                grant_type: "authorization_code",
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " +
                    (Buffer.from(
                        client_id + ":" + client_secret).toString("base64")
                    )
            },
        }).then((resp) => resp.json().then((body) => {
            const access_token = body.access_token;
            const expires_in = body.expires_in;

            res.redirect("http://127.0.0.1:4242/?" +
                stringify({
                    access_token: access_token,
                    expire_time:
                        Math.floor(new Date().getTime() / 1000 + expires_in),
                })
            );
        }));
    }
});

app.listen(port, () => {
    console.log(`The server is running at http://localhost:${port}`);
});
