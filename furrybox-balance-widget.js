// FurryBox 余额小组件 — Egern generic 脚本（液态玻璃外观）
// 按 Egern 官方小组件文档 (https://egernapp.com/zh-CN/docs/configuration/widgets) 写的：
// export default async function(ctx)，返回 widget DSL；数据用 ctx.http.get 拉，尺寸用 ctx.widgetFamily 区分。
// 余额数据：每天凌晨签到任务更新后，写进公开仓库 kikyou1w-lab/egern-config 里的 furrybox-balance.json，
// 小组件从 jsDelivr 拉这个文件（公开文件，只有一个余额数字，没有账号密码）。
// 数据地址：https://cdn.jsdelivr.net/gh/kikyou1w-lab/egern-config@main/furrybox-balance.json
// 外观：液态玻璃——半透明渐变 + 左上高光 + 亮边，用内联 SVG 作背景图；底下再垫一层半透明渐变兜底，
// SVG 万一渲染失败也能显示出玻璃质感。真正的系统级背景模糊 iOS 小组件 DSL 没给接口，做不出来，
// 这里是拿半透明层 + 高光 + 亮边模拟出来的。
// 用法（不用搭服务器）：Egern → 工具 → 脚本 → + → 名称 furrybox-balance-widget，
// 类型选 generic，文件位置选本地，编辑文件把这份内容整段粘贴进去保存；再去 分析页左上角进小组件画廊，
// 点 + 新建小组件，名称随便起（例如 FurryBox 余额），脚本名称选 furrybox-balance-widget，保存后加到主屏幕即可。

export default async function(ctx) {
  const API = 'https://cdn.jsdelivr.net/gh/kikyou1w-lab/egern-config@main/furrybox-balance.json';
  const refreshAfter = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  const WALLET_URL = 'https://my.furry.box/wallet';

  // 液态玻璃背景：SVG（渐变 + 高光 + 亮边），Egern 支持内联 SVG 作 backgroundImage
  const glassSvg = 'data:image/svg+xml,' + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200' preserveAspectRatio='none'>"
    + '<defs>'
    + "<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>"
    + "<stop offset='0' stop-color='#FFFFFF' stop-opacity='0.38'/>"
    + "<stop offset='0.45' stop-color='#FFFFFF' stop-opacity='0.10'/>"
    + "<stop offset='1' stop-color='#A8C4E8' stop-opacity='0.28'/>"
    + '</linearGradient>'
    + "<radialGradient id='s' cx='0.18' cy='0.08' r='0.6'>"
    + "<stop offset='0' stop-color='#FFFFFF' stop-opacity='0.5'/>"
    + "<stop offset='1' stop-color='#FFFFFF' stop-opacity='0'/>"
    + '</radialGradient>'
    + '</defs>'
    + "<rect x='0' y='0' width='400' height='200' rx='28' fill='url(#g)'/>"
    + "<rect x='0' y='0' width='400' height='200' rx='28' fill='url(#s)'/>"
    + "<rect x='1.5' y='1.5' width='397' height='197' rx='26' fill='none' stroke='#FFFFFF' stroke-opacity='0.45' stroke-width='2'/>"
    + "<rect x='30' y='8' width='150' height='5' rx='2.5' fill='#FFFFFF' fill-opacity='0.55'/>"
    + '</svg>'
  );
  // 兜底：半透明渐变（SVG 渲染失败时显示）
  const glassGrad = {
    type: 'linear',
    colors: ['#FFFFFF59', '#FFFFFF26', '#A8C4E840'],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
  const glassFallback = '#2E3350';

  const white = '#FFFFFF';
  const softWhite = '#FFFFFFB3';
  const faintWhite = '#FFFFFF80';
  const textShadow = {
    shadowColor: '#00000059',
    shadowRadius: 3,
    shadowOffset: { x: 0, y: 1 },
  };

  const fail = (msg) => ({
    type: 'widget',
    padding: 16,
    children: [{
      type: 'text',
      text: msg || '余额加载失败',
      font: { size: 'headline', weight: 'semibold' },
      textColor: '#FF3B30',
    }],
  });

  let d;
  try {
    const resp = await ctx.http.get(API);
    d = await resp.json();
  } catch (e) {
    return fail('余额加载失败');
  }
  if (!d || typeof d.balance !== 'number') return fail('余额加载失败');

  const balance = d.balance;
  const date = d.date || '';
  const domain = d.domain || 'xing.xwx.me';
  const expires = d.domain_expires || '';
  // date 是 YYYY-MM-DD，只显示月-日
  const shortDate = date.length >= 10 ? date.slice(5) : date;

  // 锁屏小尺寸：只显示余额数字
  if (ctx.widgetFamily === 'accessoryCircular') {
    return {
      type: 'widget',
      url: WALLET_URL,
      children: [{
        type: 'text',
        text: String(balance),
        font: { size: 'title2', weight: 'bold' },
        textColor: white,
      }],
    };
  }
  // 锁屏矩形：一行
  if (ctx.widgetFamily === 'accessoryRectangular') {
    return {
      type: 'widget',
      url: WALLET_URL,
      children: [{
        type: 'text',
        text: 'FurryBox ' + balance + ' boxes',
        font: { size: 'headline', weight: 'semibold' },
        textColor: white,
      }],
    };
  }
  // 锁屏内联：一行短字
  if (ctx.widgetFamily === 'accessoryInline') {
    return {
      type: 'widget',
      url: WALLET_URL,
      children: [{
        type: 'text',
        text: 'FurryBox ' + balance,
        font: { size: 'body', weight: 'medium' },
      }],
    };
  }
  // 主屏幕小尺寸
  if (ctx.widgetFamily === 'systemSmall') {
    return {
      type: 'widget',
      url: WALLET_URL,
      backgroundImage: glassSvg,
      backgroundGradient: glassGrad,
      backgroundColor: glassFallback,
      padding: 16,
      refreshAfter: refreshAfter,
      children: [
        {
          type: 'text',
          text: 'FurryBox',
          font: { size: 'subheadline', weight: 'semibold' },
          textColor: softWhite,
          ...textShadow,
        },
        {
          type: 'text',
          text: String(balance),
          font: { size: 'largeTitle', weight: 'bold' },
          textColor: white,
          ...textShadow,
        },
        {
          type: 'text',
          text: 'boxes',
          font: { size: 'subheadline' },
          textColor: white,
          ...textShadow,
        },
        { type: 'spacer' },
        {
          type: 'text',
          text: '更新于 ' + shortDate,
          font: { size: 'caption1' },
          textColor: softWhite,
        },
      ],
    };
  }
  // 主屏幕中 / 大尺寸（默认）
  return {
    type: 'widget',
    url: WALLET_URL,
    backgroundImage: glassSvg,
    backgroundGradient: glassGrad,
    backgroundColor: glassFallback,
    padding: 16,
    refreshAfter: refreshAfter,
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        gap: 8,
        children: [
          {
            type: 'image',
            src: 'sf-symbol:wallet.pass',
            color: '#FFFFFF',
            width: 20,
            height: 20,
          },
          {
            type: 'text',
            text: 'FurryBox 余额',
            font: { size: 'headline', weight: 'bold' },
            textColor: white,
            ...textShadow,
          },
          { type: 'spacer' },
          {
            type: 'text',
            text: balance + ' boxes',
            font: { size: 'title2', weight: 'bold' },
            textColor: white,
            ...textShadow,
          },
        ],
      },
      { type: 'spacer' },
      {
        type: 'stack',
        direction: 'column',
        gap: 4,
        children: [
          {
            type: 'text',
            text: '域名 ' + domain + '  到期 ' + expires,
            font: { size: 'subheadline' },
            textColor: white,
            ...textShadow,
          },
          {
            type: 'text',
            text: '每天签到 +5，更新于 ' + shortDate,
            font: { size: 'subheadline' },
            textColor: softWhite,
          },
        ],
      },
      {
        type: 'date',
        date: new Date().toISOString(),
        format: 'relative',
        font: { size: 'caption2' },
        textColor: faintWhite,
      },
    ],
  };
}
