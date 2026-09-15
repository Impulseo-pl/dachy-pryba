// DACHY PRYBA - interaktywność (nav mobilne + reveal + galeria-lightbox) + licznik otwarć
(function () {
  // ---- NAV mobilne ----
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  var nav = document.getElementById('nav');
  var backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);
  function closeMenu(){ links.classList.remove('open'); toggle.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); backdrop.classList.remove('show'); }
  function openMenu(){ links.classList.add('open'); toggle.classList.add('open'); toggle.setAttribute('aria-expanded','true'); backdrop.classList.add('show'); }
  if (toggle) toggle.addEventListener('click', function(){ links.classList.contains('open') ? closeMenu() : openMenu(); });
  backdrop.addEventListener('click', closeMenu);
  if (links) links.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });

  // ---- cień navbara po przewinięciu ----
  function onScroll(){ if (window.scrollY > 10) nav.classList.add('scrolled'); else nav.classList.remove('scrolled'); }
  window.addEventListener('scroll', onScroll, { passive:true });
  requestAnimationFrame(onScroll);

  // ---- reveal on scroll ----
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:.12, rootMargin:'0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
  }

  // ---- galeria lightbox ----
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCap');
    var tiles = [].slice.call(document.querySelectorAll('.gallery .tile'));
    var idx = 0;
    function show(i){ idx = (i + tiles.length) % tiles.length; var t = tiles[idx]; lbImg.src = t.getAttribute('href'); lbImg.alt = t.getAttribute('data-cap') || ''; lbCap.textContent = t.getAttribute('data-cap') || ''; }
    function openLb(i){ show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden'; }
    function closeLb(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }
    tiles.forEach(function(t,i){ t.addEventListener('click', function(ev){ ev.preventDefault(); openLb(i); }); });
    document.getElementById('lbClose').addEventListener('click', closeLb);
    document.getElementById('lbPrev').addEventListener('click', function(){ show(idx-1); });
    document.getElementById('lbNext').addEventListener('click', function(){ show(idx+1); });
    lb.addEventListener('click', function(e){ if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function(e){
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(idx-1);
      if (e.key === 'ArrowRight') show(idx+1);
    });
  }

  // ---- formularz kontaktowy: wysylka docelowo przez Cloudflare (TODO), na razie bez akcji ----
  document.querySelectorAll('.contact-form').forEach(function(form){
    form.addEventListener('submit', function(e){ e.preventDefault(); });
  });
})();

// LICZNIK WAŻNOŚCI DEMA (K. 09.08: pełne odliczanie dni/godzin/minut/sekund).
// Element wstrzykuje multipage TYLKO w dema. Nie wita klienta przy wejściu - wjeżdża
// po zejściu z pierwszego ekranu i chowa się po powrocie na górę.
(function () {
  var el = document.querySelector('.demo-wazne');
  if (!el || !el.getAttribute('data-do')) return;
  var koniec = new Date(el.getAttribute('data-do') + 'T23:59:59');
  if (isNaN(koniec)) return;
  var txt = el.querySelector('.dw-txt') || el;
  var dwa = function (n) { return (n < 10 ? '0' : '') + n; };

  var cykl = parseInt(el.getAttribute('data-cykl') || '0', 10);   // dni; 0 = brak wznowienia
  function tyka() {
    var teraz = new Date(), ms = koniec - teraz;
    // po wygaśnięciu licznik rusza od nowa (K. 10.08) - dema i tak zostają, a odliczanie
    // ma dawać klientowi realne poczucie, że sprawa ma termin.
    while (ms <= 0 && cykl > 0) {
      koniec = new Date(koniec.getTime() + cykl * 86400000);
      ms = koniec - teraz;
    }
    if (ms <= 0) { txt.innerHTML = 'Wersja pokazowa wygasła'; el.classList.add('is-koniec'); return false; }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
    var g = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
    var zegar = dwa(g) + ':' + dwa(m) + ':' + dwa(sek);
    txt.innerHTML = d > 0
      ? 'Wersja pokazowa · <b>' + d + ' dni</b> <span class="dw-zeg">' + zegar + '</span>'
      : 'Wersja pokazowa · <b class="dw-pilne">' + zegar + '</b>';
    el.classList.toggle('is-pilne', d === 0);
    return true;
  }
  if (tyka() !== false) setInterval(tyka, 1000);
  el.hidden = false;

  var tick = false;
  function stan() {
    el.classList.toggle('is-on', (window.scrollY || 0) > window.innerHeight * 0.55);
    tick = false;
  }
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true; requestAnimationFrame(stan);
  }, { passive: true });
  stan();
})();

// PAS ZE STOJĄCYM ZDJĘCIEM - tło robi się "fixed" dopiero, gdy pas jest w oknie.
// Poza oknem zostaje absolute, żeby element na stałe rozpięty na całym ekranie
// nie leżał nad nagłówkiem pierwszego ekranu.
(function () {
  var pasy = document.querySelectorAll('.stopklatka');
  if (!pasy.length) return;
  if (!('IntersectionObserver' in window)) {
    pasy.forEach(function (p) { p.classList.add('is-view'); });
    return;
  }
  var io = new IntersectionObserver(function (wpisy) {
    wpisy.forEach(function (w) { w.target.classList.toggle('is-view', w.isIntersecting); });
  }, { threshold: 0 });
  pasy.forEach(function (p) { io.observe(p); });
})();

// LICZNIK WEJŚĆ NA DEMO (ten sam beacon co w silniku dem - nie ruszać)
(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
