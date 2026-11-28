// YouTube Gemini 中文字幕 (Egern / Surge)
// 拦截油管字幕请求，把各语种字幕用 Gemini AI 翻成中文，只显示中文
// API Key 已内置，装模块直接用；环境变量 ctx.env.API_KEY / 模块参数 / 已存 key 可覆盖内置 key；
// 没填 key 或翻译失败时原样放行，不影响字幕

// 内置 key：装模块直接用
var BUILTIN_API_KEY = "AQ.Ab8RN6LDkSzvPGOmg_W87GhyMX4_VrFMzl2C54MegYyGAC5c1A";
var API_KEY = (function () {
  try {
    if (typeof ctx !== "undefined" && ctx && ctx.env && ctx.env.API_KEY) {
      return String(ctx.env.API_KEY).trim();
    }
  } catch (e) {}
  try {
    var arg = (typeof $argument !== "undefined" && $argument) ? $argument : "";
    var m = arg.match(/API_KEY=([^&]+)/);
    if (m) {
      var v = decodeURIComponent(m[1]).trim();
      if (v && v.indexOf("请粘贴") !== 0) return v;
    }
  } catch (e) {}
  try {
    var stored = $persistentStore.read("yt-gemini-subs:API_KEY");
    if (stored) return String(stored).trim();
  } catch (e) {}
  return BUILTIN_API_KEY;
})();

// 按顺序试：lite 最稳、免费额度最宽；3.8-flash 最强，忙时自动降级
var MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash"];
var CHUNK_LINES = 80;
var MAX_CHUNKS = 3;

function doneOriginal() { $done({}); }

function main() {
  try {
    var url = $request.url || "";
    if (url.indexOf("fmt=json3") === -1) return doneOriginal();
    var langMatch = url.match(/[?&]lang=([^&]+)/);
    var lang = langMatch ? decodeURIComponent(langMatch[1]) : "";
    if (/^zh/i.test(lang)) return doneOriginal();
    if (!API_KEY || API_KEY.indexOf("请粘贴") === 0) return doneOriginal();

    var data = JSON.parse($response.body);
    var events = data.events || [];
    var items = [];
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (!ev.segs || !ev.segs.length) continue;
      var text = "";
      for (var j = 0; j < ev.segs.length; j++) text += ev.segs[j].utf8 || "";
      if (!text.trim()) continue;
      items.push({ ev: ev, text: text });
    }
    if (!items.length) return doneOriginal();

    // 同一视频二次打开直接用缓存，不用再调接口
    var vMatch = url.match(/[?&]v=([^&]+)/);
    var cacheKey = "yt-gemini-subs:" + (vMatch ? vMatch[1] : "noid") + ":" + lang;
    try {
      var cached = $persistentStore.read(cacheKey);
      if (cached) { $done({ body: cached }); return; }
    } catch (e) {}

    var lines = [];
    for (var k = 0; k < items.length; k++) lines.push(items[k].text);
    var chunks = [];
    for (var s = 0; s < lines.length && chunks.length < MAX_CHUNKS; s += CHUNK_LINES) {
      chunks.push(lines.slice(s, s + CHUNK_LINES));
    }
    var translated = [];
    var ci = 0;

    function translateNext() {
      if (ci >= chunks.length) { finish(); return; }
      tryModel(chunks[ci], 0);
    }

    function tryModel(chunk, mi) {
      if (mi >= MODELS.length) { $done({}); return; }
      var prompt = "Translate each YouTube subtitle line into Simplified Chinese, no matter the source language (English, Korean, Japanese, etc.). Keep the spoken tone natural. Return ONLY a JSON array of strings, same order and count, no explanations.\n" + JSON.stringify(chunk);
      var reqBody = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      });
      var apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + MODELS[mi] + ":generateContent?key=" + API_KEY;
      $httpClient.post({ url: apiUrl, headers: { "Content-Type": "application/json" }, body: reqBody, timeout: 10 }, function (error, response, body) {
        try {
          if (error || !body) throw new Error("api error");
          var res = JSON.parse(body);
          var text = res.candidates[0].content.parts[0].text;
          var arr = JSON.parse(text);
          if (!Array.isArray(arr) || arr.length !== chunk.length) throw new Error("bad result");
          for (var t = 0; t < arr.length; t++) translated.push(String(arr[t]));
          ci++;
          translateNext();
        } catch (e) {
          tryModel(chunk, mi + 1);
        }
      });
    }

    function finish() {
      try {
        for (var i = 0; i < items.length; i++) {
          var zh = translated[i];
          if (typeof zh === "undefined") continue;
          items[i].ev.segs = [{ utf8: zh }];
        }
        var out = JSON.stringify(data);
        try { $persistentStore.write(out, cacheKey); } catch (e) {}
        $done({ body: out });
      } catch (e) {
        $done({});
      }
    }

    translateNext();
  } catch (e) {
    doneOriginal();
  }
}

main();
