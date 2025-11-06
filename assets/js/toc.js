(function(){
  const selectors = ['.post-content','.snippet-content','.project-content','.snipdump-content'];
  const containers = document.querySelectorAll(selectors.join(','));
  if(!containers.length) return;

  const slug = (str) => str.toString().toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-');

  containers.forEach(root => {
    const heads = root.querySelectorAll('h2, h3');
    if(heads.length < 3) return; // only add TOC for longer pages

    heads.forEach(h => { if(!h.id){ h.id = slug(h.textContent); } });

    const nav = document.createElement('nav');
    nav.className = 'toc';
    nav.setAttribute('aria-label','Table of contents');
    nav.innerHTML = '<strong>On this page</strong>';

    const ul = document.createElement('ul');
    heads.forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      li.appendChild(a);
      ul.appendChild(li);
    });
    nav.appendChild(ul);

    root.insertBefore(nav, root.firstChild);
  });
})();