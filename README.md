# `playlist_scraper`: An open-source tool for Spotify playlist formatting

## Author: Myra Roberts

### Instructions:

Currently, this is a very simply python project with only the one script,
`main.py`. Running this script with `-h` or `--help` will show the help menu.
The two optional arguments are:

- `-p`, `--playlist-name`: The name of a specific playlist to search for. If
not specified, it will attempt to infer based on any playlist where the name
contains "krrc" and the current date

- `-t`, `--time`: The starting hour of your KRRC show, given in 24-hour time
(i.e. 4pm would be `16`). Defaults to noon (`12`)

The program expects the following environment variables to be set:

- `SPOTIFY_CLIENT_ID`: The client ID of the Spotify developer application. See
the [Spotify developer
documentation](https://developer.spotify.com/documentation/web-api) for more
info

- `SPOTIFY_CLIENT_SECRET`: The client secret, same context as the client ID
above

The program will output all songs on the found playlist in the form of a KRRC
set list:

```
Artist - Title - Song start time
...
```
