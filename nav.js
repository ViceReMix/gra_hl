// Reusable top navigation bar for GitHub Pages
// Usage: Include <script src="nav.js" defer></script> in any page.
// Optional: define window.NAV_CONFIG = { items: [{label, href, target?}], logoHref }
(function () {
  const cfg = (window.NAV_CONFIG || {});
  const items = Array.isArray(cfg.items) && cfg.items.length ? cfg.items : [
    { label: 'Dashboard', href: 'index.html' },
    { label: 'Articles', href: 'articles.html' },
    { label: 'GitHub', href: 'https://github.com/ViceOnChain', target: '_blank' },
    { label: 'Hyperliquid', href: 'https://app.hyperliquid.xyz/vaults/0xac2322fe93c6b79f1178cfe77bc732f729bcb606', target: '_blank' }
  ];

  const nav = document.createElement('nav');
  nav.className = 'top-nav';

  // container
  const inner = document.createElement('div');
  inner.className = 'top-nav__inner';
  nav.appendChild(inner);

  // left: logo
  const left = document.createElement('div');
  left.className = 'top-nav__left';
  const logoLink = document.createElement('a');
  logoLink.className = 'top-nav__logo-link';
  logoLink.href = cfg.logoHref || 'index.html';
  const img = document.createElement('img');
  img.src = 'Vice_Logo.svg';
  img.alt = 'Vice Algos';
  img.className = 'top-nav__logo';
  logoLink.appendChild(img);
  left.appendChild(logoLink);

  // right: menu
  const right = document.createElement('div');
  right.className = 'top-nav__right';
  const ul = document.createElement('ul');
  ul.className = 'top-nav__menu';
  for (const it of items) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.textContent = it.label;
    a.href = it.href;
    if (it.target) a.target = it.target;
    a.rel = (it.target === '_blank') ? 'noopener noreferrer' : undefined;
    a.className = 'top-nav__link';
    li.appendChild(a);
    ul.appendChild(li);
  }
  right.appendChild(ul);

  inner.appendChild(left);
  inner.appendChild(right);

  // Insert as the first child of body
  const body = document.body;
  if (body.firstChild) {
    body.insertBefore(nav, body.firstChild);
  } else {
    body.appendChild(nav);
  }
})();
