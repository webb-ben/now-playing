/* Vibe notes and mood clusters.
   VIBES: a few descriptive words for specific albums, written by hand from general knowledge (judgment calls, not audio analysis).
   MOODS: those words sorted into five clusters; a record matches a mood when any of its words is in that cluster.
   Records without a hand-written note get moods from their Discogs styles (STYLE_MOODS), so any collection can use the filter. */

export const VIBES = String.raw`Big Thief|Dragon New Warm Mountain I Believe In You|Indie folk · folk rock — sprawling, intimate
Cocteau Twins|Heaven Or Las Vegas|Dream pop · ethereal — shimmering, luminous
Deerhunter|Halcyon Digest|Indie rock · dream pop — hazy, nostalgic
Steely Dan|Aja|Jazz rock · soft rock — polished, sophisticated
MJ Lenderman|Manning Fireworks|Indie rock · alt-country — loose, wry
Aphex Twin|Selected Ambient Works 85-92|Ambient techno · IDM — dreamy, hypnotic
Taylor Dayne|Tell It To My Heart|Dance-pop · freestyle — big, glossy
Broken Social Scene|Broken Social Scene|Indie rock — dense, sprawling
The Avalanches|Since I Left You|Plunderphonics · sampledelia — joyful, kaleidoscopic
Joni Mitchell|Court And Spark|Folk pop · jazz-pop — warm, reflective
Otis Redding|Pain In My Heart|Southern soul · R&B — raw, heartfelt
Roberta Flack|Feel Like Makin' Love|Soul · quiet storm — smooth, sensual
Crosby, Stills, Nash & Young|So Far|Folk rock · harmony pop — warm, laid-back
Clarence Carter|Patches|Southern soul · blues — gritty, soulful
Phil Collins|Hello, I Must Be Going!|Pop rock · blue-eyed soul — moody, dramatic
Arthur Russell|Love Is Overtaking Me (Redux)|Folk · country · art pop — tender, off-kilter
Dave Matthews Band|Crash|Jam band · pop rock — loose, groove-driven
Beach Fossils|Somersault|Indie rock · jangle pop — breezy, melodic
Beach Fossils|The Other Side Of Life: Piano Ballads|Chamber pop · piano ballads — hushed, wistful
Tom Misch|Full Circle|Neo-soul · jazz-funk — smooth, groovy
Herbie Hancock|Empyrean Isles|Hard bop · post-bop jazz — cool, adventurous
DIIV|Oshin|Indie rock · dream pop — shimmering, driving
Wild Nothing|Gemini|Dream pop · indie pop — hazy, jangly
Cher|Take Me Home|Disco · dance-pop — glittery, campy
Donna Summer|On The Radio - Greatest Hits Volumes I & II|Disco · dance-pop — sleek, euphoric
Chuck Berry|The London Chuck Berry Sessions|Rock and roll · blues rock — rowdy, live-wire
Herbie Hancock|Head Hunters|Jazz-funk · fusion — groovy, deep
James Taylor|JT|Soft rock · singer-songwriter — warm, mellow
LCD Soundsystem|Electric Lady Sessions|Dance-punk · electronic rock — live, driving
LCD Soundsystem|This Is Happening|Dance-punk · electronic — sardonic, propulsive
This Is Lorelei|Box for Buddy, Box for Star|Indie pop · lo-fi — tender, quirky
Silver Jews|American Water|Indie rock · alt-country — wry, lo-fi
Peter Brown|A Fantasy Love Affair|Disco · dance — sultry, danceable
Marina & The Diamonds|Electra Heart|Electropop · synth-pop — campy, glossy
Patrice Rushen|Pizzazz|Funk · soul · jazz-funk — slick, bubbly
Grover Washington, Jr.|Winelight|Smooth jazz · jazz-funk — mellow, silky
Carly Simon|No Secrets|Soft rock · singer-songwriter — confessional, polished
Grover Washington, Jr.|The Best Is Yet To Come|Smooth jazz · soul — mellow, silky
Naked Eyes|Naked Eyes|New wave · synth-pop — sleek, melodic
Pet Shop Boys|West End Girls|Synth-pop · Hi-NRG — cool, deadpan
Teena Marie / Kelly Marie|Lovergirl / Feels Like I'm In Love|Funk-pop · disco — bouncy, dancefloor
The Clash|London Calling|Punk rock · post-punk · reggae — urgent, eclectic
Michael Jackson|Thriller|Pop · funk · post-disco — slick, iconic
Sade|Diamond Life|Sophisti-pop · smooth jazz — smoky, cool
New Order|Substance|Synth-pop · dance-rock — pulsing, bittersweet
Joy Division|Unknown Pleasures|Post-punk · gothic rock — stark, brooding
Loleatta Holloway|Hit And Run|Disco · soul — soaring, dancefloor
Loleatta Holloway|Love Sensation|Disco · soul — soaring, dancefloor
R.E.M.|Fables Of The Reconstruction|Jangle pop · alternative rock — murky, Southern gothic
R.E.M.|Murmur|Jangle pop · alternative rock — hazy, mysterious
John Coltrane|Sun Ship|Free jazz · avant-garde jazz — fierce, spiritual
Dollar Brand|Ode To Duke Ellington|Jazz · South African jazz — lyrical, graceful
Ellie Goulding|Halcyon|Electropop · synth-pop — soaring, dramatic
Daphni|Cherry|House · electronic dance — playful, club-ready
Britney Spears|Oops!...I Did It Again|Teen pop · dance-pop — bubblegum, glossy
Grover Washington, Jr.|Inner City Blues|Soul jazz · jazz-funk — smooth, bluesy
Grover Washington, Jr.|Feels So Good|Jazz-funk · soul jazz — mellow, groovy
Luther Vandross|Never Too Much|R&B · quiet storm — silky, romantic
Sylvan Esso|WITH|Electropop · synth-pop — pulsing, warm
Sylvan Esso|Free Love|Electropop · synth-pop — intimate, danceable
Sylvan Esso|No Rules Sandy|Electropop · indie pop — quirky, playful
William Onyeabor|Who Is William Onyeabor?|Afro-funk · synth funk — hypnotic, psychedelic
Interpol|Turn On The Bright Lights|Post-punk revival · indie rock — brooding, nocturnal
Car Seat Headrest|Teens Of Denial|Indie rock · lo-fi — anxious, anthemic
This Is Lorelei|The Singer In My Band|Indie pop · lo-fi — tender, quirky
Yo La Tengo|Fade|Indie rock · dream pop — warm, hushed
Madonna|Nothing Fails|Dance-pop · house — euphoric, club-ready
Madonna|Erotica|Dance-pop · house — sultry, provocative
Madonna|Bedtime Stories|R&B · pop — smooth, sensual
Madonna|Ray Of Light|Electronica · dance-pop — shimmering, spiritual
Madonna|Music|Electropop · dance-pop — sleek, club-ready
Madonna|American Life|Electropop · folktronica — moody, acoustic-meets-electronic
Madonna|Confessions II|Dance-pop · electropop — glossy, dancefloor
Bronski Beat|Truthdare Doubledare|Synth-pop · Hi-NRG — soaring, danceable
Sylvester|M-1015|Hi-NRG · dance — sleek, falsetto-led
Patrick Cowley Featuring Sylvester|Do Ya Wanna Funk|Hi-NRG · disco — pulsing, electronic
Caribou|Swim|Electronic · psychedelic dance — fluid, hypnotic
Caribou|Our Love|Electronic · house — warm, emotional
Caribou|Suddenly|Electronic · dance · R&B — playful, eclectic
Caribou|Honey|Electronic · dance — hypnotic, groovy
Hugh Masekela|Hugh Masekela's Next Album|Jazz · Afro-jazz — bright, melodic
Rockwell|Somebody's Watching Me|Synth-pop · dance-pop — paranoid, catchy
Neil Frances|Took A While / Stay Strong Play Long|Indie pop · electronic — breezy, melodic
Black Country, New Road|For The First Time|Post-rock · art rock — frantic, jagged
Carole King|Tapestry|Soft rock · singer-songwriter — warm, timeless
Chet Baker|Chet Baker Sings|Cool jazz · vocal jazz — hushed, dreamy
Kylie Minogue|Fever|Dance-pop · electropop — sleek, glittering
Geese|Getting Killed|Indie rock · art rock — frantic, unpredictable
Cameron Winter|Heavy Metal|Art rock · indie folk — theatrical, raw
Nina Simone|High Priestess Of Soul|Soul · jazz · blues — commanding, intense
Nina Simone|I Put A Spell On You|Soul · jazz · blues — commanding, intense
Atlanta Rhythm Section|Champagne Jam|Southern rock · soft rock — smooth, laid-back
Atlanta Rhythm Section|A Rock And Roll Alternative|Southern rock · soft rock — smooth, laid-back
Alvvays|Antisocialites|Indie pop · jangle pop — dreamy, wistful
Heart|Little Queen|Hard rock · arena rock — powerful, soaring
Sharon Redd|Redd Hott|Disco · dance — glossy, dancefloor
Sylvan Esso|Sylvan Esso|Electropop · indie pop — minimalist, catchy
Sylvan Esso|Ow ∞|Electropop · indie pop — quirky, playful
Rhye|Woman|Sophisti-pop · downtempo R&B — silky, sensual
Alt-J|An Awesome Wave|Art rock · indie rock — quirky, angular
Madonna|Veronica Electronica|House · dance remixes — club-ready
Chaka Khan|Epiphany: The Best Of Chaka Khan|Funk · R&B · soul — fiery, powerful
Pinegrove|Marigold|Indie rock · emo · alt-country — earnest, warm
Lauryn Hill|The Miseducation Of Lauryn Hill|Neo-soul · hip hop — soulful, confessional
Pinegrove|Cardinal|Indie rock · alt-country · emo — earnest, warm
Turnover|Peripheral Vision|Dream pop · indie rock · emo — hazy, lush
Big Thief|Capacity|Indie folk — hushed, intimate
The War On Drugs|Lost In The Dream|Heartland rock · indie rock — hazy, expansive
Madonna|Like A Prayer|Pop · dance-pop · funk — bold, spiritual
Madonna|Madonna|Dance-pop · post-disco — bright, danceable
The Pretenders|Pretenders|New wave · punk rock · power pop — tough, catchy
Madonna|Who's That Girl|Dance-pop — bouncy, bright
Madonna|True Blue|Dance-pop · synth-pop — bright, bubbly
Madonna|Like A Virgin|Dance-pop · new wave — playful, glossy
Yazoo|Upstairs At Eric's|Synth-pop · new wave — icy, soulful
The Pretenders|Get Close|New wave · pop rock — polished, punchy
The Pretenders|Learning To Crawl|New wave · rock — gritty, emotional
Madonna|Rescue Me|Dance-pop · house — club-ready
Madonna|Keep It Together|Funk-pop · dance — groovy
The Fifth Dimension|The Age Of Aquarius|Sunshine pop · soul — lush, groovy
Beach House|Once Twice Melody|Dream pop · baroque pop — lush, cinematic
Beach House|Teen Dream|Dream pop · indie — lush, yearning
Beach House|Bloom|Dream pop — lush, dreamy
Beach House|Depression Cherry|Dream pop — hazy, slow-burning
The Isley Brothers|Go For Your Guns|Funk · soul · R&B — smooth, groovy
Marvin Gaye|What's Going On|Soul · psychedelic soul — lush, socially conscious
Marvin Gaye|Here, My Dear|Soul · funk · R&B — raw, confessional
Dee Clark|The Best Of Dee Clark|R&B · early soul · doo-wop — smooth, retro
The Human League|Dare|Synth-pop · new wave — sleek, dramatic
Fleetwood Mac|Fleetwood Mac Live|Soft rock · pop rock — warm, polished
James Taylor|Mud Slide Slim And The Blue Horizon|Folk rock · singer-songwriter — warm, mellow
The Doobie Brothers|The Captain And Me|Rock · country rock — driving, harmony-rich
James Taylor|Gorilla|Soft rock · singer-songwriter — warm, mellow
The Doobie Brothers|Minute By Minute|Yacht rock · blue-eyed soul — smooth, jazzy
Fleetwood Mac|The Alternate Tango In The Night|Soft rock · pop rock — shimmering, polished
Chaka Khan|Chaka|Funk · R&B · disco — fiery, powerful
Fleetwood Mac|Tango In The Night|Soft rock · synth-pop — shimmering, polished
James Taylor|Sweet Baby James|Folk · singer-songwriter — warm, mellow
New Order|Power, Corruption & Lies|Synth-pop · post-punk — pulsing, melancholic
Fleetwood Mac|Rumours|Soft rock · pop rock — warm, confessional
Tevin Campbell|I'm Ready|New jack swing · R&B — smooth, youthful
Madonna|Confessions On A Dance Floor|Dance-pop · electronic — euphoric, nonstop
Stereolab|Dots And Loops (Expanded Edition)|Krautrock-pop · lounge · post-rock — groovy, retro-futurist
Radiohead|In Rainbows|Art rock · alternative rock — intimate, textured
Kaytranada|99.9%|Electronic · R&B · hip hop — groovy, smooth`;

export const MOODS = [
  ["sultry", "sensual", "smooth", "silky", "romantic", "smoky", "provocative"],
  ["club-ready", "dancefloor", "danceable", "euphoric", "bubbly", "bright", "glossy", "sleek", "groovy", "bouncy", "nonstop"],
  ["dreamy", "hazy", "lush", "shimmering", "luminous", "ethereal", "hushed", "warm"],
  ["moody", "brooding", "melancholic", "stark", "nocturnal", "wistful", "bittersweet", "murky"],
  ["spiritual", "reflective", "intense", "commanding"]
];

/* Discogs styles that suggest each cluster, in the same order as MOODS */
export const STYLE_MOODS = [
  ["Soul", "Neo Soul", "Rhythm & Blues", "Contemporary R&B", "Smooth Jazz", "Quiet Storm", "Bossa Nova", "Lounge", "Downtempo", "Trip Hop", "Soul-Jazz", "Sophisti-Pop", "Vocal"],
  ["Disco", "House", "Deep House", "Techno", "Hi NRG", "Italo-Disco", "Euro House", "Electro", "Funk", "Boogie", "Nu-Disco", "Garage House", "Freestyle", "New Jack Swing", "Dance-pop", "Electro House", "Breakbeat", "Drum n Bass", "Jersey Club"],
  ["Dream Pop", "Shoegaze", "Ambient", "Ethereal", "Psychedelic Rock", "Space Rock", "Chillwave", "Baroque Pop", "Lo-Fi", "Psychedelic"],
  ["Post-Punk", "Goth Rock", "Darkwave", "Coldwave", "Industrial", "Doom Metal", "Slowcore", "Sadcore", "Dark Ambient", "Minimal Wave", "Post Rock"],
  ["Gospel", "Free Jazz", "Spiritual Jazz", "Modal", "Free Improvisation", "Avant-garde Jazz", "Contemporary Jazz", "Modern Classical", "Neo-Classical", "Singer/Songwriter"]
];
