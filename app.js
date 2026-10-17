/* Betting UI – app logic. State: balance + bets (configured by the user on entry). */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const STORE = 'betui.v1';

/* ---------- helpers ---------- */
const money = n => { const v = (Math.round(Math.abs(n) * 100) / 100).toFixed(2); return (n < 0 ? '-£' : '£') + v.replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
const r2 = n => Math.round(n * 100) / 100;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parseOdds = o => { const m = String(o || '').trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/); return m ? { n: +m[1], d: +m[2] } : null; };
const typeLabel = n => n === 1 ? 'Single' : n === 2 ? 'Double' : n === 3 ? 'Treble' : `${n} Fold`;
const boostPct = n => n >= 2 ? (n - 1) * 2.5 : 0;

function calc(bet) {
  const stake = +bet.stake || 0;
  let dec = 1;
  for (const s of bet.sels) { const o = parseOdds(s.odds); if (o && o.d) dec *= 1 + o.n / o.d; }
  const base = stake * dec;
  const pct = boostPct(bet.sels.length);
  const boost = r2(Math.max(base - stake, 0) * pct / 100);
  return { base: r2(base), boost, total: r2(base + boost), pct };
}

/* ---------- flags ---------- */
const FLAG_LOCAL = { portugal: 'portugal', wales: 'wales', netherlands: 'netherlands', holland: 'netherlands', germany: 'germany', kosovo: 'kosovo', 'rep of ireland': 'ireland', 'republic of ireland': 'ireland', ireland: 'ireland', norway: 'norway', denmark: 'denmark' };
const ISO = { england: 'gb-eng', scotland: 'gb-sct', 'northern ireland': 'gb-nir', france: 'fr', spain: 'es', italy: 'it', brazil: 'br', argentina: 'ar', belgium: 'be', croatia: 'hr', switzerland: 'ch', austria: 'at', poland: 'pl', sweden: 'se', turkey: 'tr', turkiye: 'tr', greece: 'gr', czechia: 'cz', 'czech republic': 'cz', hungary: 'hu', serbia: 'rs', ukraine: 'ua', romania: 'ro', slovakia: 'sk', slovenia: 'si', usa: 'us', 'united states': 'us', mexico: 'mx', japan: 'jp', 'south korea': 'kr', australia: 'au', canada: 'ca', morocco: 'ma', senegal: 'sn', nigeria: 'ng', egypt: 'eg', iceland: 'is', finland: 'fi', bosnia: 'ba', 'bosnia & herzegovina': 'ba', albania: 'al', 'north macedonia': 'mk', georgia: 'ge', israel: 'il', bulgaria: 'bg', lithuania: 'lt', latvia: 'lv', estonia: 'ee', luxembourg: 'lu', cyprus: 'cy', malta: 'mt', iran: 'ir', 'saudi arabia': 'sa', uruguay: 'uy', colombia: 'co', chile: 'cl', ecuador: 'ec', peru: 'pe', ghana: 'gh', cameroon: 'cm', 'ivory coast': 'ci', tunisia: 'tn', algeria: 'dz', qatar: 'qa', china: 'cn', india: 'in', 'new zealand': 'nz', russia: 'ru', belarus: 'by', moldova: 'md', armenia: 'am', azerbaijan: 'az', kazakhstan: 'kz', 'faroe islands': 'fo', liechtenstein: 'li', andorra: 'ad', 'san marino': 'sm', gibraltar: 'gi', montenegro: 'me', 'south africa': 'za', uzbekistan: 'uz', jordan: 'jo', iraq: 'iq', paraguay: 'py', venezuela: 've', bolivia: 'bo', panama: 'pa', 'costa rica': 'cr', jamaica: 'jm', honduras: 'hn', 'dr congo': 'cd', mali: 'ml', 'burkina faso': 'bf', 'cape verde': 'cv', 'south sudan': 'ss', 'united arab emirates': 'ae', uae: 'ae', oman: 'om', bahrain: 'bh', kuwait: 'kw', thailand: 'th', vietnam: 'vn', indonesia: 'id', malaysia: 'my', philippines: 'ph', singapore: 'sg', 'hong kong': 'hk', taiwan: 'tw', 'north korea': 'kp', portugal: 'pt', wales: 'gb-wls', netherlands: 'nl', germany: 'de', kosovo: 'xk', ireland: 'ie', norway: 'no', denmark: 'dk' };
function flagHTML(name) {
  const key = String(name || '').trim().toLowerCase();
  if (FLAG_LOCAL[key]) return `<span class="team__flag"><img src="assets/flag-${FLAG_LOCAL[key]}@3x.png" alt=""></span>`;
  if (ISO[key]) return `<span class="team__flag"><img src="https://flagcdn.com/w80/${ISO[key]}.png" alt="" loading="lazy"></span>`;
  const ini = key.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  return `<span class="team__flag">${esc(ini)}</span>`;
}
const TRUNKS = { home: 'red', away: 'blue' };
function iconHTML(sel, side) {
  if (sel.sport === 'boxing') return `<span class="team__flag team__flag--trunks"><img src="assets/trunks-${TRUNKS[side]}@3x.png" alt=""></span>`;
  return flagHTML(sel[side]);
}
const SPORT_DEFAULT_MARKET = { football: 'Full Time Result', boxing: 'Fight Result' };

/* ---------- example data (from the screenshots) ---------- */
const tennisLive = (rows, game) => ({ rows, game });
function examples() {
  const ftr = (pick, odds, home, away, ep) => ({ pick, market: 'Full Time Result', odds, home, away, date: 'Thu 24 Sep', time: '19:45', ep: !!ep });
  const live1 = tennisLive([['Errani/Paolini', [0, 1, 0], false], ['Guo/Jiang', [0, 0, 15], true]], 'Game 2');
  const box = (pick, market, odds, home, away) => ({ sport: 'boxing', pick, market, odds, home, away, date: 'Sun 18 Oct', time: '04:00' });
  const fundora = () => box('Sebastian Fundora to win in Rd 2', 'Round Betting', '22/1', 'Sebastian Fundora', 'Ermal Hadribeaj');
  const settledTennis = tennisLive([['Errani/Paolini', [0], false], ['Guo/Jiang', [0], false]], '');
  return {
    balance: 9.63,
    bets: [
      { status: 'live', stake: 0.10, cashout: 0, sels: [{ pick: 'Guo/Jiang (Svr) - Set 1 Game 2 Point 1 Winner', market: 'Point Betting', odds: '4/6', home: 'Errani/Paolini', away: 'Guo/Jiang', live: live1 }] },
      { status: 'live', stake: 0.10, cashout: 0, sels: [{ pick: 'Errani/Paolini - Set 1 Game 2 Point 2 Winner', market: 'Point Betting', odds: '11/10', home: 'Errani/Paolini', away: 'Guo/Jiang', live: live1 }] },
      { status: 'live', stake: 0.10, cashout: 0, sels: [{ pick: 'Guo/Jiang (Svr) - Set 1 Game 3 Point 1 Winner', market: 'Point Betting', odds: '4/6', home: 'Errani/Paolini', away: 'Guo/Jiang', live: live1 }] },
      { status: 'open', stake: 0.10, cashout: 0.10, sels: [fundora()] },
      { status: 'open', stake: 0.10, cashout: 0.10, sels: [ftr('Portugal', '1/7', 'Portugal', 'Wales', true), ftr('Draw', '11/4', 'Netherlands', 'Germany'), ftr('Draw', '21/10', 'Kosovo', 'Rep of Ireland'), ftr('Norway', '7/10', 'Norway', 'Denmark', true)] },
      { status: 'settled', result: 'cashed', cashedAmount: 0.10, stake: 0.10, cashout: 0, sels: [fundora()] },
      { status: 'settled', result: 'won', stake: 0.10, cashout: 0, sels: [{ pick: 'Guo/Jiang (Svr) - Set 1 Game 2 Point 2 Winner', market: 'Point Betting', odds: '4/6', home: 'Errani/Paolini', away: 'Guo/Jiang', live: settledTennis }] },
      { status: 'settled', result: 'lost', stake: 0.10, cashout: 0, sels: [{ pick: 'Errani/Paolini - Set 1 Game 2 Point 2 Winner', market: 'Point Betting', odds: '11/10', home: 'Errani/Paolini', away: 'Guo/Jiang', live: settledTennis }] },
      { status: 'settled', result: 'cashed', cashedAmount: 0.10, stake: 0.10, cashout: 0, sels: [ftr('Norway', '7/10', 'Norway', 'Denmark', true), ftr('Rep of Ireland', '21/10', 'Kosovo', 'Rep of Ireland', true)] },
    ].map(withId),
  };
}
let seq = 1;
function withId(b) { b.id = b.id || ('b' + (seq++) + Date.now().toString(36)); b.sels.forEach(s => { s.ep = !!s.ep; }); return b; }

/* ---------- state ---------- */
const state = { balance: 0, bets: [], screen: 'home', tab: 'open', ui: {}, recent: [] };
function load() { try { const j = JSON.parse(localStorage.getItem(STORE) || 'null'); if (j) { state.balance = +j.balance || 0; state.bets = (j.bets || []).map(withId); state.recent = j.recent || []; } } catch (e) {} }
function save() { try { localStorage.setItem(STORE, JSON.stringify({ balance: state.balance, bets: state.bets, recent: state.recent })); } catch (e) {} }
const openBets = () => state.bets.filter(b => b.status !== 'settled');

/* ---------- footer ---------- */
const CHEV = '<svg class="chev" viewBox="0 0 8 5" width="8" height="5" aria-hidden="true"><path d="M.6.6L4 4l3.4-3.4" fill="none" stroke="#b5b5b5" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const grid = items => `<ul class="links__grid">${items.map(i => `<li><a href="#">${i}</a></li>`).join('')}</ul>`;
const FOOTER = `
  <button class="delays" type="button" aria-expanded="false" data-action="toggle-delays"><span>Information and transmission delays</span>${CHEV}</button>
  <div class="delays__body" hidden><p>Please be aware that data on this site may be subject to a delay of a few seconds. The timings and scores shown are provided for information only and are not guaranteed to be accurate.</p></div>
  <div class="links">
    <h2 class="links__heading">Settings</h2>${grid(['Language' + CHEV, 'Odds Display' + CHEV])}
    <h2 class="links__heading">Promotions</h2>${grid(['Open Account Offer', 'Current Rewards'])}
    <h2 class="links__heading">Audio</h2>${grid(['Horse Racing', 'Greyhounds', 'Football', 'Cricket'])}
    <h2 class="links__heading">Form &amp; Stats</h2>${grid(['Football Stats', 'Sports Stats', 'Horse Racing Archive', 'Australian Horse Form'])}
    <h2 class="links__heading">Scores &amp; Results</h2>${grid(['Live Scores', 'Results'])}
    <h2 class="links__heading links__heading--help">Help</h2>${grid(['Deposits', 'Withdrawals', 'Contact Us', 'FAQ', 'Terms and Conditions', 'Safer Gambling', 'Technical Issues', 'Privacy Policy', 'Cookie Policy', 'Fair Payouts', 'Complaints Procedure', 'Rules', 'Deposit Limits'])}
    <h2 class="links__heading">Sites</h2>${grid(['Careers', 'Partners', 'Sports &amp; Betting News'])}
  </div>
  <div class="partner"><img src="assets/partner-block@3x.png" alt="Official Global Partner of the UEFA Champions League"></div>
  <div class="logos"><img src="assets/logos-block@3x.png" alt="GambleAware, Gordon Moody, IBIA, Gambling Commission, GamStop, IBAS, GamCare 0808 8020 133, 18+"></div>
  <div class="legal">
    <img class="legal__wordmark" src="assets/wordmark@3x.png" alt="Logo">
    <p>Registered Office: Hillside (UK Sports) ENC (registration number P1892) and Hillside (UK Gaming) ENC (registration number P1888), Office 1/2373, Level G, Quantum House, 75 Abate Rigord Street, Ta’ Xbiex, XBX 1120, Malta.</p>
    <p>Hillside (UK Sports) ENC is licensed and regulated by the British Gambling Commission (<span class="legal__hl">Account Number 55148</span>).</p>
    <p>Hillside (UK Gaming) ENC is licensed and regulated by the British Gambling Commission (<span class="legal__hl">Account Number 55149</span>).</p>
    <p class="legal__copy">© 2001-2026. All rights reserved.</p>
    <p class="legal__time">Server Time <span data-server-time>00:00:00</span> UK</p>
    <p class="legal__cookies">By accessing, continuing to use or navigating throughout this site you accept that we will use certain browser cookies to improve your customer experience with us. We only use cookies which will improve your experience with us and will not interfere with your privacy. Please refer to our <a class="legal__link" href="#">Cookies Policy</a> for further information on our use of cookies and how you can disable or manage their use should you wish.</p>
    <p class="legal__captcha">This site is protected by reCAPTCHA and the Google <span class="legal__hl">Privacy Policy</span> and <span class="legal__hl">Terms of Service</span> apply.</p>
  </div>`;
$$('[data-footer]').forEach(el => { el.innerHTML = FOOTER; });

/* ---------- bet card rendering ---------- */
const isMulti = b => b.sels.length > 1;
const descOf = b => isMulti(b) ? b.sels.map(s => s.pick).join(', ') : b.sels[0].pick;
const hasCashout = b => b.status !== 'settled' && +b.cashout > 0;

function markHTML(bet, sel) {
  if (bet.status === 'settled') {
    if (bet.result === 'won') return '<img class="mark-check" src="assets/ic-won-check@3x.png" alt="">';
    if (bet.result === 'lost') return '<span class="mark-lost"></span>';
    return '<span class="mark-dash"></span>';
  }
  return bet.status === 'live' ? '<span class="mark-dot"></span>' : '<span class="mark-ring"></span>';
}

function selHTML(bet, sel) {
  const settled = bet.status === 'settled';
  const multi = isMulti(bet);
  let title;
  if (multi) {
    title = `<div class="sel__title sel__title--inline"><span class="sel__pick">${esc(sel.pick)}</span><span class="sel__odds">${esc(sel.odds)}</span>` +
      (settled && bet.result === 'cashed' ? '<span class="void">Void</span>' : '') +
      (!settled && sel.ep ? '<span class="ep">EARLY PAYOUT</span>' : '') + '</div>';
  } else {
    title = `<div class="sel__title sel__title--right"><span class="sel__pick">${esc(sel.pick)}</span><span class="sel__odds">${esc(sel.odds)}</span></div>`;
  }
  let body = '';
  if (sel.live && settled) {
    body = `<div class="teams teams--settled">${sel.live.rows.map(r => `<div class="team"><span class="team__name">${esc(r[0])}</span><span class="team__score">${esc(r[1][0])}</span></div>`).join('')}</div>`;
  } else if (sel.live && bet.status !== 'open') {
    body = `<div class="score">${sel.live.rows.map(r => `<div class="score__row"><span class="score__sq${r[2] ? ' score__sq--serving' : ''}"></span><span class="score__name">${esc(r[0])}</span><span class="score__cols">${r[1].map(v => `<span>${esc(v)}</span>`).join('')}</span></div>`).join('')}
      <div class="score__game"><span>${esc(sel.live.game || '')}</span><span class="score__icons"><img src="assets/ic-play@3x.png" alt=""><img src="assets/ic-stats@3x.png" alt=""></span></div></div>`;
  } else if (sel.home || sel.away) {
    const when = settled ? ['', ''] : [sel.date || '', sel.time || ''];
    body = `<div class="teams">
      <div class="team">${iconHTML(sel, 'home')}<span class="team__name">${esc(sel.home)}</span><span class="team__when">${esc(when[0])}</span></div>
      <div class="team">${iconHTML(sel, 'away')}<span class="team__name">${esc(sel.away)}</span><span class="team__when">${esc(when[1])}</span></div></div>`;
  }
  return `<div class="sel"><div class="sel__mark">${markHTML(bet, sel)}</div><div class="sel__main">${title}<div class="sel__market">${esc(sel.market)}</div>${body}</div></div>`;
}

function collapsedHTML(bet) {
  let right = '';
  if (hasCashout(bet)) right = `<span class="bet__co"><b>Cash Out</b><span>${money(+bet.cashout)}</span></span>`;
  else if (bet.status === 'live') {
    const s = bet.sels[0]; let h = 0, a = 0;
    if (s.live) { h = s.live.rows[0][1][0]; a = s.live.rows[1][1][0]; } else { h = s.hs ?? 0; a = s.as ?? 0; }
    right = `<span class="scorebox"><span>${esc(h)}</span><span>${esc(a)}</span></span>`;
  }
  return `<button class="bet__row" type="button" data-action="expand" data-id="${bet.id}"><span class="bet__stake">${money(+bet.stake)}</span><span class="bet__type">${typeLabel(bet.sels.length)}</span><span class="bet__desc">${esc(descOf(bet))}</span>${right}</button>`;
}

function expandedHTML(bet) {
  const settled = bet.status === 'settled', multi = isMulti(bet), c = calc(bet);
  const co = state.ui[bet.id]?.co;
  let html = `<div class="bet__body${hasCashout(bet) ? ' bet__body--co' : ''}${settled ? ' bet__body--foot' : ''}">
    <div class="bet__head" data-action="expand" data-id="${bet.id}"><span class="bet__stake">${money(+bet.stake)}</span><span class="bet__type">${typeLabel(bet.sels.length)}${settled && bet.result === 'cashed' && multi ? 's' : ''}</span>${multi && !settled ? '<span class="bet__track">Track</span>' : ''}${settled && bet.result === 'lost' ? '<span class="bet__lost">Lost</span>' : ''}</div>
    <div class="bet__btns">${settled && (bet.result === 'won' || bet.result === 'lost') ? '' : '<span class="bet__btn"><img src="assets/ic-reuse@3x.png" alt="">Reuse Selections</span>'}<button class="bet__btn" type="button" data-action="share" data-id="${bet.id}"><img src="assets/ic-share@3x.png" alt="">Share</button></div>
    <div class="sels">${bet.sels.map(s => selHTML(bet, s)).join('')}</div>`;
  if (multi && !settled && c.pct > 0) {
    html += `<div class="sels-div" style="height:1px;background:var(--card-div);margin-top:17.6px"></div>
      <div class="boost"><span class="boost__box"><span>+${c.pct.toFixed(2)}%</span><span>ACCA BOOST</span></span><span class="boost__text">applied when all matches have finished</span></div>`;
  }
  // totals
  let retLab = settled ? 'Return' : (multi ? 'Total To Return' : 'To Return');
  let retVal, grey = false;
  if (settled) {
    if (bet.result === 'won') retVal = money(c.total);
    else if (bet.result === 'cashed') { retVal = money(+bet.cashedAmount || 0); grey = true; }
    else { retVal = money(0); grey = true; }
  } else retVal = money(c.total);
  if (multi && !settled && c.boost > 0) {
    html += `<div class="totals totals--boost"><div class="totals__l"><div class="totals__lab">Stake</div><div class="totals__val">${money(+bet.stake)}</div></div>
      <div class="totals__r totals__r--wide"><div class="totals__lab">${retLab}</div><div class="totals__val totals__val--big">${retVal}<small>incl ${money(c.boost)} Boost</small></div></div></div>`;
  } else {
    html += `<div class="totals"><div class="totals__l"><div class="totals__lab">Stake</div><div class="totals__val">${money(+bet.stake)}</div></div>
      <div class="totals__r${!settled && !multi ? ' totals__r--inset' : ''}"><div class="totals__lab${grey ? ' totals__lab--grey' : ''}">${retLab}</div><div class="totals__val${grey ? ' totals__val--grey' : ''}">${retVal}</div></div></div>`;
  }
  html += '</div>';
  if (hasCashout(bet)) {
    const amt = money(+bet.cashout);
    if (co === 'confirm') html += `<button class="bet__cashout bet__cashout--confirm" type="button" data-action="cashout-confirm" data-id="${bet.id}">Confirm<span class="co-amt">${amt}</span></button>`;
    else if (co === 'busy') html += `<button class="bet__cashout bet__cashout--busy" type="button">Cashing Out<span class="spin"></span></button>`;
    else if (co === 'done') html += `<button class="bet__cashout bet__cashout--done" type="button">${amt}<span class="co-amt">Cashed Out</span><img src="assets/ic-cashed-check@3x.png" alt=""></button>`;
    else html += `<button class="bet__cashout" type="button" data-action="cashout" data-id="${bet.id}">Cash Out<span class="co-amt">${amt}</span></button>`;
  }
  if (settled) {
    if (bet.result === 'won') html += `<div class="bet__foot"><img src="assets/ic-returned-check@3x.png" alt=""><span>${money(c.total)}</span><span class="gap">Returned</span></div>`;
    else if (bet.result === 'cashed') html += `<div class="bet__foot bet__foot--cashed"><span>${money(+bet.cashedAmount || 0)}</span><span class="gap">Cashed Out</span></div>`;
    else html += `<div class="bet__foot bet__foot--lost"><span>Lost</span></div>`;
  }
  return html;
}

function betHTML(bet) {
  const ui = state.ui[bet.id] || (state.ui[bet.id] = {});
  const expanded = bet.status === 'settled' ? ui.expanded !== false : !!ui.expanded;
  const cls = ['bet'];
  if (bet.status === 'settled' && bet.result === 'won') cls.push('bet--won');
  if (bet.status === 'settled' && bet.result === 'cashed') cls.push('bet--cashed');
  if (bet.status === 'settled' && bet.result === 'lost') cls.push('bet--lost');
  if (expanded) cls.push('bet--expanded');
  const tag = bet.status === 'settled' && bet.result === 'won' && expanded ? '<span class="bet__tag">WON</span>' : '';
  return `<article class="${cls.join(' ')}" data-bet="${bet.id}">${tag}${expanded ? expandedHTML(bet) : collapsedHTML(bet)}</article>`;
}

const EMPTY = { open: 'Bets that are unsettled will appear here', live: 'Bets on In-Play events will appear here', settled: 'Bets that have been settled will appear here' };
function renderBets() {
  const tab = state.tab;
  const list = state.bets.filter(b => tab === 'open' ? b.status !== 'settled' : tab === 'live' ? b.status === 'live' : b.status === 'settled');
  const main = $('#bets');
  $$('.tab').forEach(t => { t.classList.toggle('is-active', t.dataset.tab === tab); t.setAttribute('aria-selected', String(t.dataset.tab === tab)); });
  if (!list.length) {
    main.className = 'content content--empty';
    main.innerHTML = `<section class="empty"><p>There are currently no bets to display</p><p>${EMPTY[tab]}</p></section>`;
    return;
  }
  main.className = 'content content--list';
  main.innerHTML = `<div class="bet-list">${list.map(betHTML).join('')}</div>` +
    (tab === 'settled' ? '<button class="older" type="button">View older bets in Account History</button>' : '<div class="list-gap"></div>');
}

/* ---------- global bindings ---------- */
function renderBalance() { $$('[data-bind="balance"]').forEach(el => { el.textContent = money(state.balance); }); }
function renderBadge() { const n = openBets().length; const b = $('#nav-badge'); b.hidden = !n; b.textContent = n; }
function showScreen(name) {
  state.screen = name;
  $('#screen-home').hidden = name !== 'home';
  $('#screen-mybets').hidden = name !== 'mybets';
  $$('.nav__item').forEach(i => i.classList.toggle('is-active', i.dataset.nav === name));
  $('#phone').classList.toggle('is-home', name === 'home');
  if (name === 'mybets') renderBets();
}

/* ---------- cash out ---------- */
function cashOut(id) {
  const bet = state.bets.find(b => b.id === id); if (!bet) return;
  const ui = state.ui[id]; ui.co = 'busy'; renderBets();
  setTimeout(() => {
    ui.co = 'done'; renderBets();
    setTimeout(() => {
      const amt = +bet.cashout;
      bet.status = 'settled'; bet.result = 'cashed'; bet.cashedAmount = amt; bet.cashout = 0;
      state.balance = r2(state.balance + amt); ui.co = null; ui.expanded = true;
      state.bets = [bet, ...state.bets.filter(b => b !== bet)];
      save(); renderBalance(); renderBadge(); renderBets();
    }, 1400);
  }, 1500);
}

/* ---------- share (image of the slip) ---------- */
const H2C_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
let h2cPromise = null;
function loadH2C() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (!h2cPromise) h2cPromise = new Promise((res, rej) => { const s = document.createElement('script'); s.src = H2C_URL; s.onload = () => res(window.html2canvas); s.onerror = () => { h2cPromise = null; rej(new Error('html2canvas failed to load')); }; document.head.appendChild(s); });
  return h2cPromise;
}
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shareDate(d = new Date()) { const p = n => String(n).padStart(2, '0'); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONS[d.getMonth()]} ${p(d.getHours())}:${p(d.getMinutes())}`; }
async function renderShareImage(card) {
  const h2c = await loadH2C();
  const frame = document.createElement('div');
  frame.className = 'shareframe';
  frame.innerHTML = `<div class="shareframe__head"><span class="shareframe__date">${esc(shareDate())}</span><img class="shareframe__logo" src="assets/wordmark-white@3x.png" alt=""></div><div class="shareframe__clip"></div>`;
  const clone = card.cloneNode(true);
  clone.querySelectorAll('.bet__tag').forEach(el => el.remove());
  frame.querySelector('.shareframe__clip').appendChild(clone);
  document.body.appendChild(frame);
  try {
    const btns = clone.querySelector('.bet__btns');
    if (btns) clone.style.marginTop = -btns.offsetTop + 'px';   // bet365 crops the slip at the button row
    await Promise.all(Array.from(frame.querySelectorAll('img')).map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })));
    const canvas = await h2c(frame, { scale: 3, backgroundColor: '#111111', useCORS: true, logging: false });
    return await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png'));
  } finally { frame.remove(); }
}
let shareBusy = false;
async function shareBet(id, btn) {
  if (shareBusy) return;
  const card = $(`[data-bet="${id}"]`); if (!card) return;
  shareBusy = true; btn && btn.classList.add('is-busy');
  let blob = null;
  try {
    blob = await renderShareImage(card);
    const file = new File([blob], `bet-${id}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); }
      catch (e) { if (e && e.name !== 'AbortError') openShareSheet(blob); }
    } else openShareSheet(blob);
  } catch (e) {
    console.error(e);
    alert('Could not create the share image' + (location.protocol === 'file:' ? ' (open the app over http or GitHub Pages).' : '.'));
  } finally { shareBusy = false; btn && btn.classList.remove('is-busy'); }
}
let shareURL = null;
function openShareSheet(blob) {
  if (shareURL) URL.revokeObjectURL(shareURL);
  shareURL = URL.createObjectURL(blob);
  $('#ssheet-img').src = shareURL; $('#ssheet-save').href = shareURL;
  $('#ssheet').hidden = false;
}
function closeShareSheet() { $('#ssheet').hidden = true; }

/* ---------- balance sheet / bank ---------- */
function openBalance() { $('#bsheet').hidden = false; $('#nav').hidden = true; $('#fab').hidden = true; }
function closeBalance() { $('#bsheet').hidden = true; $('#nav').hidden = false; $('#fab').hidden = false; }
function openBank(page) { closeBalance(); $('#bank').hidden = false; $('#fab').hidden = true; $('#phone').classList.add('is-bank'); renderBank(page); }
function closeBank() { $('#bank').hidden = true; $('#fab').hidden = false; $('#phone').classList.remove('is-bank'); }
function renderBank(page) {
  const p = $('#bank-page');
  if (page === 'withdraw') {
    p.innerHTML = `<div class="bank__title"><span>Withdraw</span><svg viewBox="0 0 16 14" width="16" height="14"><path d="M0 1h16M0 7h16M0 13h16" stroke="#333" stroke-width="1.4"/></svg></div>
      <div class="bank__sub">Withdraw to Apple Pay</div>
      <form class="wform" data-form="withdraw" novalidate>
        <div class="wfield" id="wfield"><span class="wfield__label">Withdrawal Amount GBP</span><input id="wamount" type="text" inputmode="decimal" placeholder="Withdrawal Amount GBP" autocomplete="off"><span class="wfield__min">Min £5.00</span></div>
        <div class="werror" id="werror"></div>
        <button class="wbtn" type="submit">Withdraw</button>
      </form>`;
    const inp = $('#wamount'), f = $('#wfield');
    inp.addEventListener('input', () => { f.classList.toggle('is-filled', inp.value.length > 0); f.classList.remove('is-error'); $('#werror').textContent = ''; });
    setTimeout(() => inp.focus(), 50);
  } else {
    const last = state.recent[0];
    p.innerHTML = `<div class="bank__title"><span>Balances</span><svg viewBox="0 0 16 14" width="16" height="14"><path d="M0 1h16M0 7h16M0 13h16" stroke="#333" stroke-width="1.4"/></svg></div>
      ${last && last.fresh ? `<div class="notice" id="notice"><b>Withdrawal Request Received</b><span>Your balance has been updated.</span><button type="button" data-action="close-notice" aria-label="Dismiss"><svg viewBox="0 0 12 12" width="12" height="12"><path d="M1 1l10 10M11 1L1 11" stroke="#333" stroke-width="1.3" stroke-linecap="round"/></svg></button></div>` : ''}
      <div class="brow brow--main"><span>Withdrawable</span><span data-bind="balance">${money(state.balance)}</span></div>
      <div class="bbtns"><button type="button"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 1v9M4.5 6.5L8 10l3.5-3.5M2 13.5h12" fill="none" stroke="#303030" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Deposit</button><button type="button" data-action="open-withdraw"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 10V1M4.5 4.5L8 1l3.5 3.5M2 13.5h12" fill="none" stroke="#303030" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Withdraw</button></div>
      <div class="bdiv"></div>
      <div class="bsec"><span>Bonuses and Bet Credits</span></div>
      <div class="brow brow--item"><span>Sports Bet Credits</span><span>£0.00</span></div>
      <div class="brow brow--item"><span>Casino Bonus</span><span>£0.00</span></div>
      <div class="bdiv"></div>
      <div class="bsec"><span>Recent Withdrawals</span><span class="more">View more</span></div>
      ${state.recent.length ? state.recent.slice(0, 3).map(r => `<div class="recent"><b>${money(r.amount)}</b><span>Apple Pay</span></div>`).join('') : '<div class="recent" style="border-color:#ddd"><span>No recent withdrawals</span></div>'}`;
  }
}
function submitWithdraw() {
  const inp = $('#wamount'), f = $('#wfield'), err = $('#werror');
  const v = parseFloat(String(inp.value).replace(/[£,\s]/g, ''));
  let msg = '';
  if (!(v > 0)) msg = 'Enter an amount to withdraw.';
  else if (v < 5) msg = 'The minimum withdrawal is £5.00.';
  else if (v > state.balance + 1e-9) msg = `You can withdraw up to ${money(state.balance)}.`;
  if (msg) { f.classList.add('is-error'); err.textContent = msg; return; }
  state.balance = r2(state.balance - v);
  state.recent.forEach(r => { r.fresh = false; });
  state.recent.unshift({ amount: r2(v), when: Date.now(), fresh: true });
  save(); renderBalance(); renderBank('balances');
}

/* ---------- configurator ---------- */
const newSel = () => ({ sport: 'football', pick: '', market: 'Full Time Result', odds: '', home: '', away: '', date: 'Thu 24 Sep', time: '19:45', ep: false, hs: 0, as: 0 });
const SPORT_UI = {
  football: { pick: 'e.g. Portugal or Draw', market: 'Full Time Result', home: 'Home team', away: 'Away team', homePh: 'Netherlands', awayPh: 'Germany', when: 'Kick-off', hs: 'Home score', as: 'Away score' },
  boxing: { pick: 'e.g. Sebastian Fundora to win in Rd 2', market: 'Round Betting', home: 'Fighter 1 (red corner)', away: 'Fighter 2 (blue corner)', homePh: 'Sebastian Fundora', awayPh: 'Ermal Hadribeaj', when: 'Fight time', hs: 'Fighter 1 score', as: 'Fighter 2 score' },
};
const previewHTML = s => (s.home ? iconHTML(s, 'home') + esc(s.home) : '') + (s.away ? '<span style="width:8px"></span>' + iconHTML(s, 'away') + esc(s.away) : '');
let draft = null;
const resetDraft = () => { draft = { status: 'open', result: 'won', stake: '0.10', cashout: '', sels: [newSel()] }; };
function draftCalc() { return calc({ stake: +draft.stake || 0, sels: draft.sels }); }
function segHTML(name, opts, cur) { return `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${cur === v ? 'is-on' : ''}">${l}</button>`).join('')}</div>`; }
function selFormHTML(s, i) {
  const u = SPORT_UI[s.sport] || SPORT_UI.football;
  const liveFields = draft.status === 'live' ? `<div class="cfg-row"><div class="cfg-f"><label>${u.hs}</label><input data-sel="${i}" data-k="hs" type="number" min="0" value="${esc(s.hs)}"></div><div class="cfg-f"><label>${u.as}</label><input data-sel="${i}" data-k="as" type="number" min="0" value="${esc(s.as)}"></div></div>` : '';
  const whenFields = draft.status === 'open' ? `<div class="cfg-row"><div class="cfg-f"><label>Date</label><input data-sel="${i}" data-k="date" value="${esc(s.date)}"></div><div class="cfg-f"><label>${u.when}</label><input data-sel="${i}" data-k="time" value="${esc(s.time)}"></div><div class="cfg-f"><label>Early payout</label><select data-sel="${i}" data-k="ep"><option value="0"${!s.ep ? ' selected' : ''}>No</option><option value="1"${s.ep ? ' selected' : ''}>Yes</option></select></div></div>` : '';
  return `<div class="cfg-sel">
    <div class="cfg-sel__head"><span>Selection ${i + 1}</span>${draft.sels.length > 1 ? `<button type="button" data-action="cfg-del-sel" data-i="${i}">Remove</button>` : ''}</div>
    <div class="cfg-f" style="margin-top:8px"><label>Sport</label><div class="seg" data-sel="${i}" data-k="sport"><button type="button" data-v="football" class="${s.sport !== 'boxing' ? 'is-on' : ''}">Football</button><button type="button" data-v="boxing" class="${s.sport === 'boxing' ? 'is-on' : ''}">Boxing</button></div></div>
    <div class="cfg-row"><div class="cfg-f" style="flex:2"><label>First line (${s.sport === 'boxing' ? 'fighter / pick' : 'team / pick'})</label><input data-sel="${i}" data-k="pick" placeholder="${u.pick}" value="${esc(s.pick)}"></div><div class="cfg-f"><label>Odds</label><input data-sel="${i}" data-k="odds" placeholder="11/8" value="${esc(s.odds)}"></div></div>
    <div class="cfg-row"><div class="cfg-f"><label>Second line (bet type)</label><input data-sel="${i}" data-k="market" placeholder="${u.market}" value="${esc(s.market)}"></div></div>
    <div class="cfg-row"><div class="cfg-f"><label>${u.home}</label><input data-sel="${i}" data-k="home" placeholder="${u.homePh}" value="${esc(s.home)}"></div><div class="cfg-f"><label>${u.away}</label><input data-sel="${i}" data-k="away" placeholder="${u.awayPh}" value="${esc(s.away)}"></div></div>
    <div class="cfg-flags" data-flags="${i}">${previewHTML(s)}</div>
    ${whenFields}${liveFields}</div>`;
}
function renderConfig() {
  const c = draftCalc();
  const statusOf = b => b.status === 'settled' ? (b.result || 'won') : b.status;
  const list = state.bets.map(b => `<div class="cfg-item"><div class="cfg-item__main"><b>${money(+b.stake)} ${typeLabel(b.sels.length)}</b> · returns ${money(calc(b).total)}<small>${esc(descOf(b))}</small></div><span class="cfg-status cfg-status--${statusOf(b)}">${b.status === 'settled' ? b.result : b.status === 'live' ? 'live' : 'not started'}</span>${b.status === 'settled' ? '<span class="cfg-kept">Kept</span>' : `<button type="button" data-action="cfg-del" data-id="${b.id}">Remove</button>`}</div>`).join('');
  $('#config-scroll').innerHTML = `
    <div class="cfg-h1">Configure bets</div>
    <div class="cfg-sub">Set up the account balance and the bet slips you want to see in My Bets. Everything is saved on this device. Settled bets stay in the Settled tab for good (only "Reset everything" clears them).</div>
    <div class="cfg-card"><h3>Account</h3><div class="cfg-row"><div class="cfg-f"><label>Balance (£)</label><input id="cfg-balance" type="number" step="0.01" min="0" value="${state.balance.toFixed(2)}"></div></div></div>
    <div class="cfg-card"><h3>Add a bet</h3>
      <div class="cfg-f"><label>Status</label>${segHTML('status', [['open', 'Not started'], ['live', 'Live'], ['settled', 'Settled']], draft.status)}</div>
      ${draft.status === 'settled' ? `<div class="cfg-f" style="margin-top:8px"><label>Outcome</label>${segHTML('result', [['won', 'Winning'], ['lost', 'Losing']], draft.result)}</div>` : ''}
      <div class="cfg-row"><div class="cfg-f"><label>Stake (£)</label><input id="cfg-stake" type="number" step="0.01" min="0" value="${esc(draft.stake)}"></div>${draft.status !== 'settled' ? `<div class="cfg-f"><label>Cash out offer (£, blank = none)</label><input id="cfg-cashout" type="number" step="0.01" min="0" value="${esc(draft.cashout)}"></div>` : ''}</div>
      <div id="cfg-sels">${draft.sels.map(selFormHTML).join('')}</div>
      <button class="cfg-add" type="button" data-action="cfg-add-sel">+ Add another selection (makes it a ${typeLabel(draft.sels.length + 1)})</button>
      <div class="cfg-calc" id="cfg-calc">${calcLine(c)}</div>
      <button class="cfg-primary" type="button" data-action="cfg-add-bet">Add bet</button>
    </div>
    <div class="cfg-list"><h3 style="margin:0 0 4px;font-size:14px;color:#ddd">Configured bets (${state.bets.length})</h3>${list || '<div class="cfg-sub">No bets yet. Add one above or load the example bets.</div>'}</div>
    <div class="cfg-actions"><button class="cfg-primary" type="button" data-action="cfg-done">Open app</button><button class="cfg-ghost" type="button" data-action="cfg-examples">Add the example bets from the screenshots</button>${openBets().length ? '<button class="cfg-ghost" type="button" data-action="cfg-clear">Remove open and live bets</button>' : ''}<button class="cfg-ghost cfg-ghost--danger" type="button" data-action="cfg-reset" id="cfg-reset">Reset everything</button></div>`;
}
function calcLine(c) {
  const n = draft.sels.length;
  return `<span>${typeLabel(n)} · ${n} selection${n > 1 ? 's' : ''}${c.pct ? ` · +${c.pct.toFixed(2)}% ACCA boost` : ''}</span><span>Returns <b>${money(c.total)}</b>${c.boost ? ` <span style="color:var(--grey-2)">incl ${money(c.boost)} boost</span>` : ''}</span>`;
}
function openConfig() { if (!draft) resetDraft(); renderConfig(); $('#config').hidden = false; }
function closeConfig() { $('#config').hidden = true; save(); renderBalance(); renderBadge(); if (state.screen === 'mybets') renderBets(); }
function addDraftBet() {
  let bad = false;
  $$('#cfg-sels input[data-k="pick"], #cfg-sels input[data-k="odds"]').forEach(inp => { const ok = inp.dataset.k === 'pick' ? inp.value.trim() : parseOdds(inp.value); inp.classList.toggle('is-bad', !ok); if (!ok) bad = true; });
  const stakeEl = $('#cfg-stake'); if (!(+stakeEl.value > 0)) { stakeEl.classList.add('is-bad'); bad = true; }
  if (bad) return;
  const bet = withId({ status: draft.status, result: draft.status === 'settled' ? draft.result : undefined, stake: r2(+draft.stake), cashout: draft.status !== 'settled' && +draft.cashout > 0 ? r2(+draft.cashout) : 0,
    sels: draft.sels.map(s => ({ sport: s.sport === 'boxing' ? 'boxing' : 'football', pick: s.pick.trim(), market: s.market.trim() || SPORT_DEFAULT_MARKET[s.sport] || 'Full Time Result', odds: s.odds.trim(), home: s.home.trim(), away: s.away.trim(), date: s.date, time: s.time, ep: !!s.ep, hs: +s.hs || 0, as: +s.as || 0 })) });
  if (bet.status === 'live') bet.sels.forEach(s => { if (s.home || s.away) s.live = { rows: [[s.home, [s.hs], false], [s.away, [s.as], false]], game: 'In-Play' }; });
  state.bets.push(bet); resetDraft(); save(); renderConfig();
  $('#config-scroll').scrollTo({ top: $('#config-scroll').scrollHeight, behavior: 'smooth' });
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-action], [data-nav], [data-tab], .seg button');
  if (!t) return;
  if (t.dataset.nav !== undefined) {
    e.preventDefault();
    const n = t.dataset.nav;
    if (n === 'home' || n === 'mybets') { if (state.screen === n) $(`[data-scroll="${n}"]`).scrollTo({ top: 0, behavior: 'smooth' }); else showScreen(n); }
    return;
  }
  if (t.dataset.tab) { state.tab = t.dataset.tab; renderBets(); return; }
  if (t.closest('.seg')) {
    const seg = t.closest('.seg'); syncDraftFromForm();
    if (seg.dataset.sel !== undefined) {
      const sel = draft.sels[+seg.dataset.sel]; const was = sel.sport || 'football'; sel.sport = t.dataset.v;
      if (!sel.market.trim() || sel.market.trim() === SPORT_DEFAULT_MARKET[was]) sel.market = SPORT_DEFAULT_MARKET[sel.sport];
    } else draft[seg.dataset.seg] = t.dataset.v;
    renderConfig(); return;
  }
  const a = t.dataset.action;
  switch (a) {
    case 'toggle-delays': { const open = t.getAttribute('aria-expanded') === 'true'; t.setAttribute('aria-expanded', String(!open)); t.nextElementSibling.hidden = open; break; }
    case 'expand': { const ui = state.ui[t.dataset.id] || (state.ui[t.dataset.id] = {}); const bet = state.bets.find(b => b.id === t.dataset.id); const cur = bet.status === 'settled' ? ui.expanded !== false : !!ui.expanded; ui.expanded = !cur; renderBets(); break; }
    case 'cashout': { state.ui[t.dataset.id].co = 'confirm'; renderBets(); break; }
    case 'cashout-confirm': cashOut(t.dataset.id); break;
    case 'share': shareBet(t.dataset.id, t); break;
    case 'close-share': closeShareSheet(); break;
    case 'open-balance': openBalance(); break;
    case 'close-balance': closeBalance(); break;
    case 'open-withdraw': openBank('withdraw'); break;
    case 'close-bank': closeBank(); break;
    case 'close-notice': $('#notice')?.remove(); state.recent.forEach(r => { r.fresh = false; }); save(); break;
    case 'open-config': openConfig(); break;
    case 'cfg-done': closeConfig(); break;
    case 'cfg-examples': {
      const ex = examples(), sig = b => JSON.stringify([b.status, b.result, b.stake, b.sels.map(s => [s.pick, s.odds])]);
      const have = new Set(state.bets.map(sig));
      const add = ex.bets.filter(b => !have.has(sig(b)));
      if (!state.bets.length) state.balance = ex.balance;
      state.bets = [...state.bets.filter(b => b.status !== 'settled'), ...add.filter(b => b.status !== 'settled'), ...add.filter(b => b.status === 'settled'), ...state.bets.filter(b => b.status === 'settled')];
      save(); renderConfig(); break;
    }
    case 'cfg-clear': state.bets = state.bets.filter(b => b.status === 'settled'); save(); renderConfig(); break;
    case 'cfg-reset': {
      if (!t.dataset.armed) { t.dataset.armed = '1'; t.textContent = 'Tap again to reset everything'; setTimeout(() => { if (t.isConnected) { delete t.dataset.armed; t.textContent = 'Reset everything'; } }, 3000); break; }
      state.balance = 0; state.bets = []; state.ui = {}; state.recent = []; state.tab = 'open'; resetDraft();
      try { localStorage.removeItem(STORE); } catch (e) {}
      renderBalance(); renderBadge(); renderConfig(); $('#config-scroll').scrollTo({ top: 0 }); break;
    }
    case 'cfg-del': state.bets = state.bets.filter(b => b.id !== t.dataset.id); save(); renderConfig(); break;
    case 'cfg-add-sel': syncDraftFromForm(); draft.sels.push(newSel()); renderConfig(); break;
    case 'cfg-del-sel': syncDraftFromForm(); draft.sels.splice(+t.dataset.i, 1); renderConfig(); break;
    case 'cfg-add-bet': syncDraftFromForm(); addDraftBet(); break;
  }
});
function syncDraftFromForm() {
  const b = $('#cfg-balance'); if (b) state.balance = r2(+b.value || 0);
  const s = $('#cfg-stake'); if (s) draft.stake = s.value;
  const c = $('#cfg-cashout'); if (c) draft.cashout = c.value;
  $$('#cfg-sels [data-sel]').forEach(inp => { const sel = draft.sels[+inp.dataset.sel]; if (!sel) return; const k = inp.dataset.k; sel[k] = k === 'ep' ? inp.value === '1' : inp.value; });
}
document.addEventListener('input', e => {
  const el = e.target;
  if (el.closest('#config')) {
    syncDraftFromForm();
    const cl = $('#cfg-calc'); if (cl) cl.innerHTML = calcLine(draftCalc());
    if (el.dataset.k === 'home' || el.dataset.k === 'away') { const i = el.dataset.sel, s = draft.sels[+i]; const f = $(`[data-flags="${i}"]`); if (f) f.innerHTML = previewHTML(s); }
    el.classList.remove('is-bad');
  }
});
document.addEventListener('change', e => { if (e.target.closest('#config')) syncDraftFromForm(); });
document.addEventListener('submit', e => { if (e.target.dataset.form === 'withdraw') { e.preventDefault(); submitWithdraw(); } });

/* ---------- clocks ---------- */
function tick() {
  const now = new Date();
  const t = now.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  $$('[data-server-time]').forEach(el => { el.textContent = t; });
  $('#status-time').textContent = t.slice(0, 5);
}
tick(); setInterval(tick, 1000);

/* ---------- boot ---------- */
load();
setTimeout(() => { loadH2C().catch(() => {}); }, 1500);
renderBalance(); renderBadge();
showScreen('home');
const q = new URLSearchParams(location.search);
if (q.has('demo')) {
  // ?demo=home|mybets|balance|withdraw|balances|config  &tab=open|live|settled  &expand=1  &examples=1
  if (q.get('examples') !== '0') { const ex = examples(); state.balance = ex.balance; state.bets = ex.bets; }
  if (q.has('only')) state.bets = q.get('only').split(',').map(i => state.bets[+i]).filter(Boolean);
  if (q.get('expand')) state.bets.forEach(b => { state.ui[b.id] = { expanded: true }; });
  if (q.get('collapse')) state.bets.forEach(b => { state.ui[b.id] = { expanded: false }; });
  state.tab = q.get('tab') || 'open';
  renderBalance(); renderBadge();
  const d = q.get('demo');
  if (d === 'mybets') showScreen('mybets');
  else if (d === 'balance') openBalance();
  else if (d === 'withdraw') openBank('withdraw');
  else if (d === 'balances') { state.recent = [{ amount: state.balance, fresh: true }]; state.balance = 0; renderBalance(); openBank('balances'); }
  else if (d === 'config') openConfig();
  if (q.get('scroll')) { const sc = $(`[data-scroll="${d === 'mybets' ? 'mybets' : 'home'}"]`); sc.scrollTop = +q.get('scroll'); }
  if (q.has('share')) { const b = state.bets[+q.get('share')]; if (b) { state.ui[b.id] = { expanded: true }; renderBets(); setTimeout(() => shareBet(b.id), 400); } }
} else {
  openConfig();
}
})();
