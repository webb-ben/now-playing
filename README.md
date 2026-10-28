# Now Playing

Pull in anyone's public [Discogs](https://www.discogs.com) collection, explore it, and pick something to spin.

Type a Discogs username (or paste a `discogs.com/user/...` link) and the app loads the whole collection straight from the Discogs API. No server, no build step, and no sign-in for public collections.

## What it does

- **Loads any public collection** by username. Share a link to one with `?user=<username>`.
- **Explore**: bar charts of genres, styles, decades, artists, labels and formats for whatever is currently filtered. Tap a bar to drill in.
- **Filters**: artist, format, genre, style, label, decade, folder (when visible) and favorites.
- **Pick a record**: a random pick from the filtered set, optionally without repeats until you've been through them all.
- **Now playing / Preview**: cover art, the Discogs tracklist (each track links to a YouTube search), community rating and have/want counts, the album's Wikipedia intro, and links to Discogs, YouTube and Apple Music.
- **Original release years**: Discogs lists the year of each pressing. The original year comes from the master release, which is fetched when a record is shown, or for the whole collection with **Look up original years**.
- **Pairs well with**: other artists in the collection that share styles or genres, favoring nearby years.
- **Queue, spin counts, favorites, most played and pick history**, kept in your browser for each collection separately.
- **CSV import** of a Discogs collection export, for private collections or offline use.
- Works on phones, with light and dark themes.

## Run it

It's a static site using ES modules, so it needs to be served over HTTP (not opened as a `file://`):

```sh
npm start            # python3 -m http.server 8000
open http://localhost:8000/?user=<a-discogs-username>
```

Any static server works. Pushes to `main` run the tests and deploy to GitHub Pages through [.github/workflows/pages.yml](.github/workflows/pages.yml). To turn that on, set **Settings → Pages → Source** to **GitHub Actions**.

## Tests

```sh
npm test             # node --test, no dependencies
```

The tests cover record parsing (Discogs API items, CSV exports, plain lists) and the filter, sort, tally and pairing logic.

## How it's put together

| File | What it does |
| --- | --- |
| [index.html](index.html) | Page markup |
| [css/styles.css](css/styles.css) | Styles, theme tokens, phone layout |
| [js/discogs.js](js/discogs.js) | Discogs API client with rate limiting |
| [js/records.js](js/records.js) | Converts API items and CSV into one record shape |
| [js/explore.js](js/explore.js) | Pure filter/sort/tally/pairing helpers (tested in Node) |
| [js/store.js](js/store.js) | localStorage, namespaced per collection, plus capped caches |
| [js/wiki.js](js/wiki.js) | Wikipedia album intro lookup |
| [js/app.js](js/app.js) | UI |

### Discogs API notes

- Public collections, profiles, releases and masters don't need authentication. The API sends `Access-Control-Allow-Origin: *`, so the browser calls it directly.
- Without a token, Discogs allows 25 requests a minute (60 with one). Requests go out one at a time and wait when the minute's budget is used up. A collection loads 100 items per request, so even large collections load quickly. Looking up original years costs one request per master.
- An optional personal access token (from Discogs **Settings → Developers**) can be entered under the username field. It is stored only in your browser and sent only to `api.discogs.com`, as a query parameter so the browser doesn't need a CORS preflight. With your own token you can also see your private folders.
- The app uses `fetch` directly rather than a client library such as [disconnect](https://github.com/bartve/disconnect), because that library is written for Node and doesn't run in the browser without a bundler.

## Data and privacy

Collections, spins, favorites, the queue and cached lookups live in your browser's localStorage and nothing is sent anywhere except Discogs and Wikipedia. Data comes from Discogs. Album intros come from Wikipedia and are shown with attribution under CC BY-SA 4.0.
