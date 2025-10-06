const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

const access_token = params.access_token;
const expire_time = params.expire_time;

let user_text_elem = null;

addEventListener("DOMContentLoaded", _ => {
    const time = Math.floor(new Date().getTime() / 1000);
    const remaining = expire_time - time;

    const main_interact_elem = document.getElementById("main_interact");
    user_text_elem = document.getElementById("user_text");

    if (access_token == null) {
        console.log("no token yet");

        main_interact_elem.innerHTML = "<form action='http://127.0.0.1:4242/login' method='get'><button type='submit'>Login</button></form>";

    } else if (remaining <= 0) {
        console.log("token expired");
        // redirect back to main page
        window.location.href = "//127.0.0.1:4242/";
    } else {
        console.log(`token!! (${remaining} remaining)`);

        main_interact_elem.innerHTML =
            "<label for='time_input'>Show Start Time:</label>" +
            "<input type='time' id='time_input'>" +
            "<label for='use_name_checkbox'>Auto-search by date:</label>" +
            "<input type='checkbox' id='use_name_checkbox'>" +
            "<label for='name_textbox'>Playlist name:</label>" +
            "<input type='text' id='name_textbox'>" +
            "<button type='submit' id='search_button'>Search</button>";

        const use_name_checkbox = document.getElementById("use_name_checkbox");
        const name_textbox = document.getElementById("name_textbox");
        const search_button = document.getElementById("search_button");

        use_name_checkbox.onchange = (evt) => {
            name_textbox.disabled = evt.target.checked;
        };

        search_button.onclick = _ => {
            if (use_name_checkbox.checked) {
                search_playlist();
            } else {
                if (!name_textbox.value) {
                    user_text_elem.innerHTML = "Please specify a playlist name!";
                } else {
                    search_playlist(name_textbox.value);
                }
            }
        };
    }
});

async function search_playlist(name = "") {
    const playlists = await (
        await fetch("https://api.spotify.com/v1/me/playlists", {
            headers: {
                Authorization: "Bearer " + access_token,
            }
        })
    ).json();

    // const today = new Date(2025, 9, 29);
    const today = new Date();

    let playlist = null;
    if (name) {
        const filtered = playlists.items.filter((p) => {
            const p_name = p.name.trim().toLowerCase();
            const s_name = name.trim().toLowerCase();
            const index = p_name.indexOf(s_name);
            return index >= 0;
        });

        if (filtered.length < 1) {
            user_text_elem.innerHTML = "No playlist found!";
        } else {
            playlist = filtered[0];
        }
    } else {
        const filtered = playlists.items.filter((p) => {
            const p_name = p.name.trim().toLowerCase();
            const dates = p_name.match(/\d+\/\d+\/\d+/);
            if (dates) {
                for (const d of dates) {
                    const split = d.split("/");
                    if (split[0] == today.getMonth()
                        && split[1] == today.getDate()) {
                        return true;
                    }
                }

            }
            return false;
        });

        if (filtered.length < 1) {
            user_text_elem.innerHTML = "No playlist found!";
        } else {
            playlist = filtered[0];
        }
    }

    if (!playlist) {
        user_text_elem.innerHTML = "No playlist found!";
        return;
    }
    user_text_elem.innerHTML = `Found playlist ${playlist.name}!`;


    const tracks = await (
        await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.id}/tracks/?` +
            "fields=items(track(artists(name),name,duration_ms))",
            {
                headers: {
                    Authorization: "Bearer " + access_token,
                }
            })
    ).json();

    let formatted = [];

    let milis_elapsed = 0;

    for (const t of tracks.items) {
        const track = t.track;
        const name = track.name;
        const artist = track.artists[0].name;

        const length = track.duration_ms;
        const start_milis = milis_elapsed;
        milis_elapsed += length;
        let start_time = new Date(today);

        const time_input = document.getElementById("time_input");
        if (time_input.value) {
            const split = time_input.value.split(":");
            start_time.setHours(split[0]);
            start_time.setMinutes(split[1]);
        }

        start_time = new Date(start_time.getTime() + start_milis);
        const time_str = start_time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        formatted.push(`<p class='song_text'>${artist} - ${name} - ${time_str}</p>`);
    }

    user_text_elem.innerHTML += "<div" +
        " class='out_text'" +
        ">" +
        (formatted.join("")) +
        "</div>";
}
