// Shared navigation with left slide-out drawer
// Usage: include this script and call renderTopNav('home'|'learn'|'contact')
// The drawer is controlled by a .burger-btn, #site-drawer, and .nav-backdrop

function renderTopNav(activeKey) {
  const navRoot = document.querySelector('.nav-links');
  if (!navRoot) return;

  const items = [
    { key: 'home', label: 'Home', href: 'index.html' },
    { key: 'learn', label: 'Learn', href: 'Learn.html' },
    { key: 'contact', label: 'Contact', href: 'Contact.html' },
  ];

  navRoot.innerHTML = items.map(it => {
    const isActive = it.key === activeKey;
    const activeAttrs = isActive ? ' class="active" aria-current="page"' : '';
    const target = it.target ? ` target="${it.target}"` : '';
    const rel = it.rel ? ` rel="${it.rel}"` : '';
    return `<a href="${it.href}"${activeAttrs}${target}${rel}>${it.label}</a>`;
  }).join('\n');
}

function initNavDrawer() {
  const btn = document.querySelector('.burger-btn');
  const drawer = document.getElementById('site-drawer');
  const backdrop = document.querySelector('.nav-backdrop');
  if (!btn || !drawer || !backdrop) return;

  const open = () => {
    drawer.classList.add('open');
    backdrop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    drawer.classList.remove('open');
    backdrop.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    if (drawer.classList.contains('open')) close();
    else open();
  });
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', initNavDrawer);
