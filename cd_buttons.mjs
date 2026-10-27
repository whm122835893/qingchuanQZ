/**
 * collectionDetails 按钮矩阵全分支验证（源站 bundle render 判据逐条对应）。
 * 用临时改数（改后恢复）覆盖：转赠 / 合成 / 取消寄售（真实接口）/ 赠送中 /
 * 锁定中 / 尚未开启寄售 / 上链中。
 * 基线快照先落盘，任何一步失败都先恢复再退出。
 */
import { chromium } from 'playwright';
const FE = 'http://localhost:5173';
const BE = 'http://localhost:3100';
const db = (await import('./server/src/db/index.js')).default;

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome',
  args: ['--no-sandbox']
});

async function openPage(id) {
  // addInitScript 首载即注入 token：避免「先 goto 无 token 401 回落 mock、
  // 再 reload 纠正」的双载竞态（mock 与真实数据按钮恰好相同时会假 PASS）
  const login = await fetch(BE + '/user/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: '17587881293', password: 'whm981004' })
  }).then(r => r.json());
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(t => {
    try { localStorage.setItem('token', t) } catch (e) { /* about:blank 下无存储 */ }
  }, login.data.userinfo.token);
  const p = await ctx.newPage();
  await p.goto(`${FE}/#/pages/myCollection/collectionDetails?id=${id}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(2500);
  return { ctx, p, token: login.data.userinfo.token };
}

async function btnText(p) {
  return p.evaluate(() => {
    const b = document.querySelector('.act-btn');
    return b ? b.innerText.trim() : '(no-btn)';
  });
}

// ── 基线快照 ──
const BASE = {
  uc: db.query("SELECT id, user_hash, status, is_lock FROM user_collections WHERE id IN (6003,6005,6006,6007,77001)"),
  p226: db.query("SELECT id, can_compose, is_lock FROM products WHERE id=226")[0],
};
console.log('基线:', JSON.stringify(BASE.uc), 'p226:', JSON.stringify(BASE.p226));

function restore() {
  for (const r of BASE.uc) {
    db.run("UPDATE user_collections SET user_hash=?, status=?, is_lock=? WHERE id=?", [r.user_hash, r.status, r.is_lock, r.id]);
  }
  db.run('UPDATE products SET can_compose=?, is_lock=? WHERE id=226', [BASE.p226.can_compose, BASE.p226.is_lock]);
  db.run('DELETE FROM market_listings WHERE id=999001');
}

const results = [];
try {
  // ① 转赠：6007(user_hash 置非空, status=1, product213 regift=0)
  db.run("UPDATE user_collections SET user_hash='0xtest_regift' WHERE id=6007");
  {
    const { ctx, p } = await openPage(6007);
    results.push(['转赠分支(6007)', await btnText(p), '转赠']);
    await ctx.close();
  }
  // ② 合成：77001(user_hash 非空, status=1, product226 can_compose=1)
  {
    const { ctx, p } = await openPage(77001);
    results.push(['合成分支(77001)', await btnText(p), '合成']);
    await ctx.close();
  }
  // ③ 赠送中：6005 status=10 + hash 非空
  db.run("UPDATE user_collections SET user_hash='0xtest_gift', status=10 WHERE id=6005");
  {
    const { ctx, p } = await openPage(6005);
    results.push(['赠送中分支(6005)', await btnText(p), '赠送中']);
    await ctx.close();
  }
  // ④ 锁定中：status==2 && product.is_lock==1（源站判据双条件）。
  // 6006 的 product_id=null，源站在 product 为空时同样不显示「锁定中」，
  // 故夹具用 77001(status=2) + p226 is_lock=1，验完由 restore 统一恢复。
  db.run('UPDATE products SET is_lock=1 WHERE id=226');
  db.run('UPDATE user_collections SET status=2 WHERE id=77001');
  {
    const { ctx, p } = await openPage(77001);
    results.push(['锁定中分支(77001 status=2 + p226 is_lock=1)', await btnText(p), '锁定中']);
    await ctx.close();
  }
  db.run('UPDATE products SET is_lock=? WHERE id=226', [BASE.p226.is_lock]);
  db.run('UPDATE user_collections SET status=? WHERE id=77001', [BASE.uc.find(r => r.id === 77001).status]);
  // ⑤ 尚未开启寄售：77001 + product226 can_compose=0（regift=1 resale=1 status=1 is_lock=0）
  db.run('UPDATE products SET can_compose=0 WHERE id=226');
  {
    const { ctx, p } = await openPage(77001);
    results.push(['尚未开启寄售分支(77001)', await btnText(p), '尚未开启寄售']);
    await ctx.close();
  }
  db.run('UPDATE products SET can_compose=? WHERE id=226', [BASE.p226.can_compose]);
  // ⑥ 上链中：6001 user_hash 空
  {
    const { ctx, p } = await openPage(6001);
    results.push(['上链中分支(6001)', await btnText(p), '上链中']);
    await ctx.close();
  }
  // ⑦ 取消寄售（真实接口）：6003 status=2 + hash 非空 + 插在售挂单
  db.run("UPDATE user_collections SET user_hash='0xtest_cancel' WHERE id=6003");
  db.run("INSERT INTO market_listings (id, product_id, collection_id, sale_user_id, name, price, status, goods_type, listing_time, update_time, is_deleted, pay_text, buy_version) VALUES (999001, NULL, 6003, 22291, '测试挂单', 88.0000, 1, 2, 1791903600, 1791903600, 0, 0, 0)");
  {
    const { ctx, p, token } = await openPage(6003);
    const before = await btnText(p);
    // 点击「取消寄售」→ 确认弹层 → 确认
    await p.click('.act-btn');
    await p.waitForTimeout(400);
    const toastVisible = await p.evaluate(() => !!document.querySelector('.toast-box'));
    await p.evaluate(() => { const ok = [...document.querySelectorAll('.toast-btn')].find(e => e.innerText.trim() === '确认'); if (ok) ok.click(); });
    await p.waitForTimeout(1800);
    const after = await btnText(p);
    const mg = db.query('SELECT id, status FROM market_listings WHERE id=999001')[0];
    const uc = db.query('SELECT id, status FROM user_collections WHERE id=6003')[0];
    results.push(['取消寄售按钮(6003)', before, '取消寄售']);
    results.push(['取消寄售-确认弹层出现', String(toastVisible), 'true']);
    results.push(['取消寄售-接口后挂单status', String(mg.status), '3']);
    results.push(['取消寄售-接口后实例status', String(uc.status), '1']);
    // 取消寄售不改 user_hash（链上哈希不动），6003 product 为空 →
    // status=1 + 所有 product 级 flags 均 undefined → 无按钮（源站 render 同构）
    results.push(['取消寄售-刷新后按钮(同构)', after, '(no-btn)']);
    await ctx.close();
  }
} finally {
  restore();
  console.log('已恢复基线:', JSON.stringify(db.query("SELECT id, user_hash, status, is_lock FROM user_collections WHERE id IN (6003,6005,6006,6007,77001)")), 'p226:', JSON.stringify(db.query('SELECT id, can_compose FROM products WHERE id=226')[0]), 'listing999001:', db.query('SELECT id FROM market_listings WHERE id=999001').length);
}

await b.close();
let pass = 0;
for (const [name, got, want] of results) {
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got="${got}" want="${want}"`);
}
console.log(`\n${pass}/${results.length} 通过`);
