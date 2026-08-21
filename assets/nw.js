/* ============================================================
   NIGHT WORKERS — shared runtime
   Language toggle · nav · catalogue rendering
   ============================================================ */
(function () {
  'use strict';

  /* ---------- language ---------- */
  var KEY = 'nw-lang';
  function get() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function detect() {
    var s = get();
    if (s === 'fr' || s === 'en' || s === 'ja') return s;
    var n = (navigator.language || 'en').toLowerCase();
    if (n.indexOf('fr') === 0) return 'fr';
    if (n.indexOf('ja') === 0) return 'ja';
    return 'en';
  }

  /* Not every page is translated into every language (only the Japanese desk
     carries a ja version). Fall back to English rather than blanking the page. */
  function available(l) {
    if (l === 'en') return true;
    return !!document.querySelector('[data-l="' + l + '"]');
  }

  function setLang(l) {
    save(l);                       // remember the choice even if this page can't show it
    var shown = available(l) ? l : 'en';
    document.documentElement.setAttribute('data-lang', shown);
    document.documentElement.setAttribute('lang', shown);
    var btns = document.querySelectorAll('.lang button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('on', btns[i].getAttribute('data-set') === shown);
    }
    document.dispatchEvent(new CustomEvent('nwlang', { detail: shown }));
  }
  window.NW_setLang = setLang;
  window.NW_lang = function () { return document.documentElement.getAttribute('data-lang') || 'en'; };

  /* apply immediately to avoid flash */
  document.documentElement.setAttribute('data-lang', detect());

  /* ---------- boot ---------- */
  function boot() {
    setLang(detect());

    var btns = document.querySelectorAll('.lang button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () { setLang(this.getAttribute('data-set')); });
    }

    var burger = document.querySelector('.burger');
    var menu = document.querySelector('.nl');
    if (burger && menu) {
      burger.addEventListener('click', function () { menu.classList.toggle('open'); });
      var links = menu.querySelectorAll('a');
      for (var j = 0; j < links.length; j++) {
        links[j].addEventListener('click', function () { menu.classList.remove('open'); });
      }
    }

    if (document.getElementById('cat-body')) initCatalogue();
    renderShelves();
    renderCounters();
  }

  /* ---------- helpers ---------- */
  var AMZ = 'https://www.amazon.com/dp/';
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function books() { return window.NW_BOOKS || []; }

  /* Pages under /book/ need to climb one level to reach assets and siblings. */
  var UP = /\/book\//.test(location.pathname) ? '../' : '';

  function bookUrl(b) { return b.slug ? UP + 'book/' + b.slug + '.html' : null; }

  function links(b) {
    var h = '';
    if (b.k) h += '<a class="mk k" href="' + AMZ + b.k + '" target="_blank" rel="noopener">Kindle</a>';
    if (b.p) h += '<a class="mk p" href="' + AMZ + b.p + '" target="_blank" rel="noopener">Paper</a>';
    if (b.h) h += '<a class="mk h" href="' + AMZ + b.h + '" target="_blank" rel="noopener">Hardcover</a>';
    if (!h) h += '<span class="mk p" style="opacity:.55">Soon</span>';
    return h;
  }

  /* Jacket sources, best first:
       1. a local file in assets/covers/ (from b.cov)
       2. Amazon's ASIN image endpoint, tried for Kindle, then paperback, then hardcover
     Amazon sometimes answers a 1x1 placeholder instead of a 404, so onload checks the
     real width too. When every candidate fails the img removes itself and the
     typographic cover underneath shows through — nothing ever renders blank. */
  var AMZ_IMG = 'https://m.media-amazon.com/images/P/';
  function candidates(b) {
    var c = [];
    if (b.cov) c.push(UP + b.cov);
    ['k', 'p', 'h'].forEach(function (f) {
      if (b[f]) c.push(AMZ_IMG + b[f] + '.01._SCLZZZZZZZ_.jpg');
    });
    return c;
  }

  var NEXT = "var n=(this.getAttribute('data-nx')||'').split('|').filter(Boolean);" +
             "if(n.length){this.setAttribute('data-nx',n.slice(1).join('|'));this.src=n[0];}" +
             "else{this.remove();}";
  var CHECK = "if(this.naturalWidth&&this.naturalWidth<50){" + NEXT + "}else{this.style.opacity=1;}";

  function cover(b, short) {
    var inner = '<div class="ct">' + esc(short || b.t) + '</div>' +
                '<div class="ca">' + esc(lastName(b.au)) + '</div>';
    var c = candidates(b);
    if (c.length) {
      inner += '<img src="' + esc(c[0]) + '" data-nx="' + esc(c.slice(1).join('|')) + '"' +
               ' alt="' + esc(b.t) + '" loading="lazy"' +
               ' onerror="' + NEXT + '" onload="' + CHECK + '"' +
               ' style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;' +
               'opacity:0;transition:opacity .35s">';
    }
    var box = '<div class="cov">' + inner + '</div>';
    /* Covers now lead to the book page, not straight to Amazon. */
    var url = bookUrl(b);
    return url ? '<a class="cvl" href="' + url + '">' + box + '</a>' : box;
  }

  function lastName(n) {
    if (!n) return '';
    var p = n.split(' ');
    return p[p.length - 1];
  }

  /* ---------- shelves: <div class="js-shelf" data-prog="zevaco" data-ser="Les Pardaillan"> ---------- */
  function renderShelves() {
    var nodes = document.querySelectorAll('.js-shelf');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var prog = el.getAttribute('data-prog');
      var ser = el.getAttribute('data-ser');
      var au = el.getAttribute('data-au');
      var list = books().filter(function (b) {
        if (prog && b.prog !== prog) return false;
        if (ser && b.ser !== ser) return false;
        if (au && b.au !== au) return false;
        return true;
      });
      var html = '';
      for (var j = 0; j < list.length; j++) {
        var b = list[j];
        var label = b.ser === 'Les Pardaillan' && b.pos
          ? 'Vol. ' + b.pos
          : (b.pos ? 'No. ' + b.pos : b.t);
        var u = bookUrl(b);
        var cap = esc(b.pos ? label : b.t);
        if (u) cap = '<a href="' + u + '" style="text-decoration:none">' + cap + '</a>';
        html += '<div class="sv">' + cover(b, b.t) +
          '<div class="svn">' + cap + '</div>' +
          '<div class="svk">' + links(b) + '</div></div>';
      }
      el.innerHTML = html || '<p class="note">—</p>';
    }
  }

  /* ---------- counters: <b class="js-count" data-prog="zevaco"> ---------- */
  function renderCounters() {
    var nodes = document.querySelectorAll('.js-count');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var prog = el.getAttribute('data-prog');
      var au = el.getAttribute('data-au');
      var tr = el.getAttribute('data-tr');
      var n = books().filter(function (b) {
        if (prog && b.prog !== prog) return false;
        if (au && b.au !== au) return false;
        if (tr && b.tr !== tr) return false;
        return true;
      }).length;
      el.textContent = n;
    }
  }

  /* ---------- catalogue ---------- */
  var state = { prog: 'all', tr: 'all', fmt: 'all', q: '', sort: 'ser', dir: 1 };

  var PROG_LABEL = {
    zevaco: ['The Zévaco Project', 'Le Projet Zévaco'],
    gaboriau: ['The Gaboriau Project', 'Le Projet Gaboriau'],
    rocambole: ['The Rocambole Saga', 'La Saga Rocambole'],
    lostfrench: ['Lost French Thrillers', 'Romans oubliés'],
    lupin: ['Arsène Lupin: The Forgotten', 'Arsène Lupin oublié'],
    rostand: ['The Rostand Project', 'Le Projet Rostand'],
    updated: ['The Great Works, Updated', 'Les Grands Textes, actualisés'],
    origins: ['Origins', 'Origines'],
    bakumatsu: ['Bakumatsu Eyewitness', 'Témoins du Bakumatsu']
  };

  function initCatalogue() {
    var chips = document.querySelectorAll('.chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function () {
        var g = this.getAttribute('data-g'), v = this.getAttribute('data-v');
        state[g] = v;
        var sib = document.querySelectorAll('.chip[data-g="' + g + '"]');
        for (var k = 0; k < sib.length; k++) sib[k].classList.remove('on');
        this.classList.add('on');
        draw();
      });
    }
    var s = document.getElementById('cat-search');
    if (s) s.addEventListener('input', function () { state.q = this.value.toLowerCase().trim(); draw(); });

    var ths = document.querySelectorAll('.ctable th[data-s]');
    for (var t = 0; t < ths.length; t++) {
      ths[t].addEventListener('click', function () {
        var key = this.getAttribute('data-s');
        state.dir = (state.sort === key) ? -state.dir : 1;
        state.sort = key;
        draw();
      });
    }
    document.addEventListener('nwlang', draw);
    draw();
  }

  function match(b) {
    if (state.prog !== 'all' && b.prog !== state.prog) return false;
    if (state.tr !== 'all' && (b.tr || b.au) !== state.tr) return false;
    if (state.fmt === 'k' && !b.k) return false;
    if (state.fmt === 'p' && !b.p) return false;
    if (state.fmt === 'h' && !b.h) return false;
    if (state.fmt === 'new' && !b.new) return false;
    if (state.fmt === 'pub' && !b.pub) return false;
    if (state.fmt === 'soon' && b.pub) return false;
    if (state.q) {
      var hay = (b.t + ' ' + (b.sub || '') + ' ' + (b.fr || '') + ' ' + b.au + ' ' + (b.tr || '') + ' ' + (b.ser || '')).toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }
    return true;
  }

  function draw() {
    var fr = window.NW_lang() === 'fr';
    var list = books().filter(match);
    var key = state.sort, dir = state.dir;
    list.sort(function (a, b) {
      var x, y;
      if (key === 'ser') {
        x = (a.prog || '') + '|' + (a.ser || '') + '|' + String(1000 + (a.pos || 0));
        y = (b.prog || '') + '|' + (b.ser || '') + '|' + String(1000 + (b.pos || 0));
      } else if (key === 'au') { x = a.au; y = b.au; }
      else if (key === 'tr') { x = a.tr || a.au; y = b.tr || b.au; }
      else { x = a.t; y = b.t; }
      return x < y ? -dir : x > y ? dir : 0;
    });

    var rows = '';
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      var sub = fr ? (b.fr || b.sub) : b.sub;
      var serTxt = b.ser ? esc(b.ser) + (b.pos ? ' · ' + b.pos : '') : '—';
      var url = bookUrl(b);
      var titleCell = '<span class="ct-title">' + esc(b.t) +
        (b.pub ? '' : '<span class="badge soonbadge">' + (fr ? 'à paraître' : 'soon') + '</span>') + '</span>';
      if (url) titleCell = '<a href="' + url + '" class="ct-link">' + titleCell + '</a>';
      rows += '<tr>' +
        '<td>' + titleCell +
        (sub ? '<span class="ct-sub">' + esc(sub) + '</span>' : '') + '</td>' +
        '<td><span class="ct-auth">' + esc(b.au) + '</span></td>' +
        '<td><span class="ct-price">' + serTxt + '</span></td>' +
        '<td><span class="ct-auth">' + esc(b.tr || '—') + '</span></td>' +
        '<td><span class="vk">' + links(b) + '</span></td>' +
        '</tr>';
    }

    document.getElementById('cat-body').innerHTML = rows;
    var empty = document.getElementById('cat-empty');
    if (empty) empty.style.display = list.length ? 'none' : 'block';
    var c = document.getElementById('cat-count');
    if (c) c.textContent = fr
      ? list.length + ' titre' + (list.length > 1 ? 's' : '') + ' sur ' + books().length
      : list.length + ' of ' + books().length + ' titles';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
