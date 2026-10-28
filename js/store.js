/* localStorage with JSON and try/catch. Per-collection data (spins, favorites, queue...) is kept under
   "np:<collection>:<name>" so exploring someone else's collection doesn't mix with your own. */
export function read(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
export function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
export function remove(k) { try { localStorage.removeItem(k); } catch (e) {} }

let ns = "";
export function setCollection(name) { ns = (name || "").toLowerCase(); }
export function readC(name) { return ns ? read("np:" + ns + ":" + name) : null; }
export function storeC(name, v) { if (ns) store("np:" + ns + ":" + name, v); }

/* Small shared caches (release details, Wikipedia intros) that drop their oldest entries past a cap */
export function cache(name, cap) {
  const k = "np:" + name;
  let m = read(k) || {};
  return {
    get: id => m[id],
    set(id, v) {
      m[id] = Object.assign({ t: Date.now() }, v);
      const ids = Object.keys(m);
      if (ids.length > cap) ids.sort((a, b) => (m[a].t || 0) - (m[b].t || 0)).slice(0, ids.length - cap).forEach(x => delete m[x]);
      if (!store(k, m)) { m = {}; m[id] = v; store(k, m); }
    }
  };
}
