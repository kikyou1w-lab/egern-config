// 汽水音乐抓 Cookie（Egern http-request 脚本）
// 匹配到汽水音乐 /luna/ 接口请求时，把请求里的 Cookie 和 UA 存到本机，
// 定时签到脚本每天从这里读 Cookie 去调签到接口。Cookie 不离开手机。
// 抓到后只通知一次，之后每次打开 App 都会静默更新 Cookie，不用再管。

const url = $request.url || "";
const headers = $request.headers || {};
const cookie = headers["Cookie"] || headers["cookie"] || "";

if (cookie) {
  const had = $persistentStore.read("qishui_cookie");
  $persistentStore.write(cookie, "qishui_cookie");
  const ua = headers["User-Agent"] || headers["user-agent"] || "";
  if (ua) $persistentStore.write(ua, "qishui_ua");

  // 记录抓到的接口路径（去重，最多留 10 条），方便之后写定时脚本
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  let list = [];
  try {
    list = JSON.parse($persistentStore.read("qishui_endpoints") || "[]");
  } catch (e) {
    list = [];
  }
  if (list.indexOf(path) === -1) {
    list.push(path);
    if (list.length > 10) list.shift();
    $persistentStore.write(JSON.stringify(list), "qishui_endpoints");
  }

  if (!had) {
    $notification.post("汽水音乐 Cookie 已抓到", path, "定时签到下一步就用它，Cookie 只存在手机本地");
  }
}

$done({});
