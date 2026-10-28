import { test } from "node:test";
import assert from "node:assert/strict";
import { clean, artistString, fromDiscogs, fromDiscogsList, parseCSV, fromText, key } from "../js/records.js";

/* Shaped like one item from GET /users/{username}/collection/folders/0/releases */
const item = (id, over = {}) => ({
  id, instance_id: id * 10, date_added: "2024-05-01T10:00:00-07:00", rating: 4,
  basic_information: Object.assign({
    id, master_id: 900 + id, title: "Album " + id, year: 2016,
    thumb: "https://i.discogs.com/t" + id + ".jpg", cover_image: "https://i.discogs.com/c" + id + ".jpg",
    formats: [{ name: "Vinyl", qty: "2", descriptions: ["LP", "Album", "Reissue"] }],
    labels: [{ name: "Sire", catno: "1-23867" }, { name: "Sire", catno: "9 23867-1" }],
    artists: [{ name: "Madonna", join: "" }],
    genres: ["Electronic", "Pop"], styles: ["Synth-pop"]
  }, over)
});

test("clean strips Discogs disambiguation and name-variation marks", () => {
  assert.equal(clean("James Taylor (2)"), "James Taylor");
  assert.equal(clean("Prince*"), "Prince");
  assert.equal(clean("  Sade "), "Sade");
});

test("artistString joins multiple artists the way Discogs credits them", () => {
  assert.equal(artistString([{ name: "Patrick Cowley", join: "Featuring" }, { name: "Sylvester" }]), "Patrick Cowley Featuring Sylvester");
  assert.equal(artistString([{ name: "A", join: "," }, { name: "B (3)", join: "&" }, { name: "C" }]), "A, B & C");
  assert.equal(artistString([]), "");
});

test("fromDiscogs maps an API item to a record", () => {
  const r = fromDiscogs(item(7));
  assert.equal(r.id, "7");
  assert.equal(r.artist, "Madonna");
  assert.equal(r.label, "Sire");
  assert.equal(r.catno, "1-23867");
  assert.equal(r.formatName, "Vinyl");
  assert.equal(r.qty, 2);
  assert.deepEqual(r.descs, ["LP", "Album", "Reissue"]);
  assert.equal(r.year, 2016);
  assert.equal(r.masterId, 907);
  assert.deepEqual(r.styles, ["Synth-pop"]);
  assert.equal(r.thumb, "https://i.discogs.com/t7.jpg");
  assert.equal(r.folder, "");
});

test("fromDiscogs drops placeholder images and tolerates missing fields", () => {
  const r = fromDiscogs({ id: 1, basic_information: { id: 1, title: "X", cover_image: "https://s.discogs.com/images/spacer.gif" } });
  assert.equal(r.cover, "");
  assert.equal(r.artist, "");
  assert.deepEqual(r.genres, []);
});

test("fromDiscogsList counts the same release once", () => {
  const list = fromDiscogsList([item(1), item(2), item(1)]);
  assert.deepEqual(list.map(r => r.id), ["1", "2"]);
});

test("parseCSV handles quotes, escaped quotes and CRLF", () => {
  assert.deepEqual(parseCSV('a,b\r\n"x, y","say ""hi"""\n'), [["a", "b"], ["x, y", 'say "hi"']]);
});

test("fromText reads a Discogs CSV export", () => {
  const csv = 'Catalog#,Artist,Title,Label,Format,Rating,Released,release_id,CollectionFolder,Date Added\n'
    + 'SP 1470,Beach House,Once Twice Melody,Sub Pop,"2xLP, Album, Sil",,2022,22195571,Uncategorized,2023-01-02 10:00:00\n'
    + 'CD1,James Taylor (2),JT,Columbia,"CD, Album",,1977,123,Uncategorized,2023-01-03 10:00:00\n';
  const [a, b] = fromText(csv);
  assert.equal(a.id, "22195571");
  assert.equal(a.formatName, "Vinyl");
  assert.equal(a.qty, 2);
  assert.equal(a.year, 2022);
  assert.equal(b.artist, "James Taylor");
  assert.equal(b.formatName, "CD");
});

test("fromText reads Artist - Title | Genre lines", () => {
  const [a, b] = fromText("Sade - Diamond Life | Soul, Jazz\nJust A Title");
  assert.equal(a.artist, "Sade");
  assert.equal(a.title, "Diamond Life");
  assert.deepEqual(a.genres, ["Soul", "Jazz"]);
  assert.equal(b.artist, "");
  assert.equal(key(b), "|Just A Title");
});
