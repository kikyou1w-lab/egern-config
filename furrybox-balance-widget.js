// FurryBox 余额小组件 — Egern generic 脚本
// 按 Egern 官方小组件文档 (https://egernapp.com/zh-CN/docs/configuration/widgets) 写的：
// export default async function(ctx)，返回 widget DSL；数据用 ctx.http.get 拉，尺寸用 ctx.widgetFamily 区分。
// 余额数据：每天凌晨签到任务更新后，写进公开仓库 kikyou1w-lab/egern-config 里的 furrybox-balance.json，
// 小组件从 jsDelivr 拉这个文件（公开文件，只有一个余额数字，没有账号密码）。
// 数据地址：https://cdn.jsdelivr.net/gh/kikyou1w-lab/egern-config@main/furrybox-balance.json
// 用法（不用搭服务器）：Egern → 工具 → 脚本 → + → 名称 furrybox-balance-widget，
// 类型选 generic，文件位置选本地，编辑文件把这份内容整段粘贴进去保存；再去 分析页左上角进小组件画廊，
// 点 + 新建小组件，名称随便起（例如 FurryBox 余额），脚本名称选 furrybox-balance-widget，保存后加到主屏幕即可。

export default async function(ctx) {
  const API = 'https://cdn.jsdelivr.net/gh/kikyou1w-lab/egern-config@main/furrybox-balance.json';
  const refreshAfter = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  const WALLET_URL = 'https://my.furry.box/wallet';

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

  const bg = {
    type: 'linear',
    colors: ['#1A1A2E', '#16213E'],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
  const white = '#FFFFFF';
  const grey = '#AAAAAA';

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
      backgroundGradient: bg,
      padding: 16,
      refreshAfter: refreshAfter,
      children: [
        {
          type: 'text',
          text: 'FurryBox',
          font: { size: 'subheadline', weight: 'semibold' },
          textColor: grey,
        },
        {
          type: 'text',
          text: String(balance),
          font: { size: 'largeTitle', weight: 'bold' },
          textColor: white,
        },
        {
          type: 'text',
          text: 'boxes',
          font: { size: 'subheadline' },
          textColor: white,
        },
        { type: 'spacer' },
        {
          type: 'text',
          text: '更新于 ' + shortDate,
          font: { size: 'caption1' },
          textColor: grey,
        },
      ],
    };
  }
  // 主屏幕中 / 大尺寸（默认）
  return {
    type: 'widget',
    url: WALLET_URL,
    backgroundGradient: bg,
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
          },
          { type: 'spacer' },
          {
            type: 'text',
            text: balance + ' boxes',
            font: { size: 'title2', weight: 'bold' },
            textColor: white,
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
          },
          {
            type: 'text',
            text: '每天签到 +5，更新于 ' + shortDate,
            font: { size: 'subheadline' },
            textColor: grey,
          },
        ],
      },
      {
        type: 'date',
        date: new Date().toISOString(),
        format: 'relative',
        font: { size: 'caption2' },
        textColor: '#888888',
      },
    ],
  };
}
