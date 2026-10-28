import { test } from "node:test";
import assert from "node:assert/strict";
import { mbYears } from "../js/musicbrainz.js";

const rg = (title, date) => ({ release_group: { title, "first-release-date": date } });
const link = (id, ...rels) => ({ resource: "https://www.discogs.com/master/" + id, relations: rels });

test("mbYears batches masters and picks the release group whose title matches", async () => {
  const calls = [];
  globalThis.fetch = async u => {
    calls.push(String(u));
    return { ok: true, status: 200, json: async () => ({ urls: [
      link(1, rg("Tell It to My Heart", "1987-10-01")),
      link(2, rg("Only a Single", "1983-01-01"), rg("The Album", "1984-06-01")),
      link(3, rg("No Title Given A", "1990"), rg("No Title Given B", "1988-02")),
      link(4, rg("Undated", ""))
    ] }) };
  };
  const y = await mbYears([1, 2, 3, 4, 5, 2], { titles: { 1: "Tell It To My Heart", 2: "The Album" } });
  assert.deepEqual(y, { 1: 1987, 2: 1984, 3: 1988 });
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0]).searchParams.getAll("resource").length, 5);
});

test("mbYears handles a single-link response and a batch with no links", async () => {
  let n = 0;
  globalThis.fetch = async () => (++n === 1
    ? { ok: true, status: 200, json: async () => link(7, rg("Seven", "1977")) }
    : { ok: false, status: 404, json: async () => ({}) });
  assert.deepEqual(await mbYears([7]), { 7: 1977 });
  assert.deepEqual(await mbYears([8]), {});
});

test("mbYears backs off and retries when MusicBrainz answers 503", async () => {
  let n = 0;
  globalThis.fetch = async () => (++n < 3
    ? { ok: false, status: 503, json: async () => ({}) }
    : { ok: true, status: 200, json: async () => link(9, rg("Nine", "1999-09-09")) });
  assert.deepEqual(await mbYears([9], { retryMs: 1 }), { 9: 1999 });
  assert.equal(n, 3);
});
