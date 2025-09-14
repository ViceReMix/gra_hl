// Shared top navigation for GitHub Pages dashboard
// Usage: include this script and call renderTopNav('home'|'learn'|'contact')
// Can be extended later with more items.

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
