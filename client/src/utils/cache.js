const CACHE_KEY = 'sentMessageCache'; // shared for both admin/user

 export function getSentCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; }
}
 export function setSentCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}
 export function rememberSentPlaintext(encryptedMessage, plaintext) {
  const cache = getSentCache();
  cache[encryptedMessage] = { t: Date.now(), plaintext };
  // optional: prune oldest if Object.keys(cache).length > 1000
  setSentCache(cache);
}
 export function recallSentPlaintext(encryptedMessage) {
  const cache = getSentCache();
  return cache[encryptedMessage]?.plaintext || null;
}


