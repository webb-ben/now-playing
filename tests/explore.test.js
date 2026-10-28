import { test } from "node:test";
import assert from "node:assert/strict";
import { yearOf, decade, fmtMain, matches, tally, sortRecords, search, pairs, baseTitle, nw, vibeOf, moodsOf, moodName } from "../js/explore.js";

const rec = o => Object.assign({ id: "", artist: "", title: "", label: "", format: "", formatName: "Vinyl", qty: 1, descs: ["LP"],
  year: 0, origYear: 0, genres: [], styles: [], added: "", folder: "" }, o);

const A = rec({ id: "1", artist: "Beach House", title: "Bloom", label: "Sub Pop", year: 2012, genres: ["Rock"], styles: ["Dream Pop", "Indie Rock"], added: "2024-01-01" });
const B = rec({ id: "2", artist: "Cocteau Twins", title: "Heaven Or Las Vegas", label: "4AD", year: 2020, origYear: 1990, genres: ["Rock"], styles: ["Dream Pop"], added: "2024-03-01" });
const C = rec({ id: "3", artist: "Wild Nothing", title: "Gemini", label: "Captured Tracks", year: 2010, genres: ["Rock"], styles: ["Dream Pop", "Indie Pop"], added: "2023-06-01" });
const D = rec({ id: "4", artist: "Herbie Hancock", title: "Head Hunters", label: "Columbia", year: 1973, genres: ["Jazz", "Funk / Soul"], styles: ["Jazz-Funk"], formatName: "CD", descs: ["Album"] });
const E = rec({ id: "5", artist: "Beach House", title: "Teen Dream", label: "Sub Pop", year: 2010, genres: ["Rock"], styles: ["Dream Pop"] });
const ALL = [A, B, C, D, E];

test("yearOf prefers the original release year", () => {
  assert.equal(yearOf(B), 1990);
  assert.equal(yearOf(A), 2012);
  assert.equal(decade(1990), "1990s");
  assert.equal(decade(0), "");
});

test("fmtMain summarizes formats", () => {
  assert.equal(fmtMain(A), "Vinyl LP");
  assert.equal(fmtMain(rec({ qty: 2, descs: ["LP", "Album"] })), "2× Vinyl LP");
  assert.equal(fmtMain(rec({ descs: ['12"', "Single"] })), 'Vinyl 12"');
  assert.equal(fmtMain(D), "CD");
});

test("matches applies every filter that is set", () => {
  assert.ok(matches(A, {}, {}));
  assert.ok(matches(A, { style: "Dream Pop", decade: "2010s", label: "Sub Pop" }, {}));
  assert.ok(!matches(B, { decade: "2020s" }, {}));
  assert.ok(!matches(A, { favOnly: true }, {}));
  assert.ok(matches(A, { favOnly: true }, { "1": 1 }));
});

test("tally counts values, most common first", () => {
  assert.deepEqual(tally(ALL, r => r.styles).slice(0, 2), [["Dream Pop", 4], ["Indie Pop", 1]]);
  assert.deepEqual(tally(ALL, r => r.artist)[0], ["Beach House", 2]);
});

test("sortRecords sorts by artist ignoring 'The', by year and by date added", () => {
  const the = rec({ artist: "The Clash", title: "London Calling" });
  assert.deepEqual(sortRecords([D, the, A], "artist").map(r => r.artist), ["Beach House", "The Clash", "Herbie Hancock"]);
  assert.deepEqual(sortRecords(ALL, "year").map(r => r.id), ["4", "2", "5", "3", "1"]);
  assert.equal(sortRecords(ALL, "added")[0].id, "2");
});

test("search looks at artist, title and label", () => {
  assert.deepEqual(search(ALL, "sub pop").map(r => r.id), ["1", "5"]);
  assert.equal(search(ALL, "  ").length, 5);
});

test("pairs favors shared styles and nearby years, and skips the same artist", () => {
  const p = pairs(ALL, A);
  assert.deepEqual(p.map(x => x.r.id), ["3", "2"]);
  assert.deepEqual(p[0].sh, ["Dream Pop"]);
  assert.equal(p[0].d, 2);
  assert.deepEqual(pairs(ALL, rec({ id: "9", title: "Nothing" })), []);
});

test("baseTitle and nw normalize titles for matching", () => {
  assert.equal(baseTitle("Dots And Loops (Expanded Edition)"), "Dots And Loops");
  assert.equal(nw("Power, Corruption & Lies"), "power corruption and lies");
  assert.equal(nw("Beyoncé"), "beyonce");
});

test("moods come from hand-written vibe words first, then Discogs styles", () => {
  const fever = rec({ artist: "Kylie Minogue", title: "Fever", styles: ["Ambient"] });
  assert.match(vibeOf(fever), /sleek, glittering/);
  assert.deepEqual(moodsOf(fever), ["1"]);
  assert.equal(moodName("1"), "club-ready / dancefloor / danceable");
  assert.deepEqual(moodsOf(rec({ artist: "Someone", title: "Else", styles: ["Dream Pop", "Disco"] })), ["1", "2"]);
  assert.deepEqual(moodsOf(rec({ artist: "Someone", title: "Else", styles: ["Polka"] })), []);
  assert.ok(matches(A, { mood: "2" }, {}));
  assert.ok(!matches(D, { mood: "2" }, {}));
});

test("pairs can include wantlist records, capped so owned ones stay in front", () => {
  const wants = [1, 2, 3, 4].map(i => rec({ id: "w" + i, artist: "Want " + i, title: "W" + i, year: 2012, genres: ["Rock"], styles: ["Dream Pop", "Indie Rock"], want: true }));
  const p = pairs(ALL.concat(wants), A);
  assert.equal(p.filter(x => x.r.want).length, 3);
  assert.ok(p.some(x => !x.r.want));
  assert.equal(pairs(ALL.concat(wants), A, 8, 0).filter(x => x.r.want).length, 0);
});
