# mounâ sissokò

One Saturday in Abuja, from 9am to 8pm, staged as a play in her building. The sky follows the scroll, the radio plays her four songs, and every room is one of the things she loves.

## Scenes

| Time | Scene | What's in it |
|---|---|---|
| 9:00am | The building | Six rooms with the front wall taken off. Tap one to jump to its scene. |
| 9:30am | The company | The cast list: Michael, Tanjiro, Asta, Yuji, Jotaro, Kaneki, James (& Fuhad), Gumball, Mordecai & Rigby, her authors, Abuja. |
| 10:00am | The kitchen | Alfredo pasta, sticky honey barbecue chicken with mash and gravy, chicken burritos. Tick off ingredients; the timer buttons start an oven timer under the clock. |
| 11:30am | The desk | A sketchbook page anyone can draw on, with prompts. "Keep it" saves the drawing. |
| 1:00pm | The Michael hour | The Billie Jean floor, the sequined glove, four albums. |
| 2:30pm | Anime marathon | Demon Slayer first, then Black Clover, Jujutsu Kaisen, JoJo and Tokyo Ghoul. Hover each one. |
| 4:00pm | The matinée | A working lighting desk and a few theatre words. |
| 5:00pm | Headphones in | ShxtsnGigs, Team James, and a one-minute snippet of the latest episode. |
| 5:45pm | Cartoon break | Gumball and Regular Show. Do not press the button. |
| 6:15pm | Double feature | A telly with two channels: old Nollywood and Sollywood. |
| 6:45pm | Golden hour | Tap the people, windows and cars on the street for their stories. |
| 7:45pm | The lamp | Her books, her writing, sonder, and To Be Continued. |

Hidden things: press ON AIR six times fast; leave the page alone for 14 seconds; scroll to the very bottom.

## The radio

The four songs are Remember the Time, You Rock My World, Twisted and Ignition (Remix). The site looks each one up on Apple's search API in the visitor's browser and plays the official 30-second preview, with links to the full song on Apple Music, Spotify and YouTube. Full songs can't be hosted on a personal site. To change the songs, edit `TRACKS` at the top of `assets/radio.js`.

## Pictures

Album covers, anime posters, cartoon art, book covers and photos are fetched in the visitor's browser (Apple, Jikan/MyAnimeList, TVmaze, Open Library, Google Books, Wikipedia) and cached for two weeks. Each one has a drawn version underneath, so the page still looks finished if a service is down.

## Her Substack

Open `assets/site.js` and paste her Substack address into `SUBSTACK_URL` at the top. The "Read her Substack" button appears at the end of the day once it's set.

## Running it

It's a plain static site with no build step.

```
python3 -m http.server 8000
```

then open http://localhost:8000.

## Deploying on Vercel

Import this repository in Vercel, leave the framework preset as **Other**, and leave the build command and output directory empty. Every push to `main` redeploys.
