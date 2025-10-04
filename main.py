#!/usr/bin/env python

import sys
import os
import re
import datetime
from dotenv import load_dotenv

import spotipy
import argparse


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="playlist_scraper",
        description="Scrape a Spotify playlist and format it for a KRRC set list",
    )

    parser.add_argument(
        "-p",
        "--playlist-name",
        dest="playlist_name",
        required=False,
        type=str,
        default="",
        help="Name of playlist to search for",
    )

    parser.add_argument(
        "-t",
        "--time",
        dest="start_hour",
        required=False,
        type=int,
        default="12",
        help="Starting hour of the show (in 24 hour time)",
    )

    return parser.parse_args()


def main():
    load_dotenv()

    args = parse_args()

    sp = spotipy.Spotify(
        auth_manager=spotipy.SpotifyOAuth(
            client_id=os.getenv("SPOTIFY_CLIENT_ID"),
            client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
            redirect_uri="http://127.0.0.1:4242/callback",
            scope=["playlist-read-private", "playlist-read-collaborative"],
        )
    )

    res = sp.current_user_playlists()

    today = datetime.date.today()
    # today = datetime.date(month=9, day=22, year=2025)

    playlists = list(res["items"])  # type: ignore

    playlist = None
    if args.playlist_name:
        filtered = list(
            filter(
                lambda p: args.playlist_name.strip().lower()
                in p["name"].strip().lower(),
                playlists,
            )
        )
        if len(filtered) < 1:
            print(f"Could not find playlist {args.playlist_name}", file=sys.stderr)
            sys.exit(1)
        else:
            playlist = filtered[0]
    else:
        filtered = list(filter(lambda p: "rrc" in p["name"].lower(), playlists))
        for p in filtered:
            found = False

            dates = re.findall(r"\d+/\d+/\d+", p["name"])
            for d in dates:
                nums = d.split("/")
                date = datetime.date(
                    month=int(nums[0]), day=int(nums[1]), year=today.year
                )

                if date == today:
                    found = True
                    playlist = p
                    break

            if found:
                break

        if not playlist:
            print(f"Could not find any playlists matching {today}", file=sys.stderr)
            sys.exit(2)

    print(f"Found playlist {playlist['name']}\n")

    songs = list(
        sp.playlist_items(
            playlist["id"], fields="items(track(artists(name),name,duration_ms))"
        )["items"]  # type: ignore
    )

    time_elapsed = datetime.timedelta(0)

    def format_song_details(s) -> str:
        track = s["track"]
        name = track["name"]
        # artists = ", ".join(map(lambda a: a["name"], track["artists"]))
        artists = track["artists"][0]["name"]

        length = datetime.timedelta(milliseconds=track["duration_ms"])
        nonlocal time_elapsed
        e = time_elapsed
        time_elapsed += length
        start_time = (
            datetime.datetime.fromisoformat(today.isoformat())
            + datetime.timedelta(hours=args.start_hour)
            + e
        )
        time_played = start_time.strftime("%I:%M %p")

        return f"{artists} - {name} - {time_played}"

    formatted = "\n".join(map(format_song_details, songs))

    print(formatted)


if __name__ == "__main__":
    main()
