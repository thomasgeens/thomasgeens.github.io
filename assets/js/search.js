(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const $ = (sel, ctx=document) => ctx.querySelector(sel);
    const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

    const openBtn = $('#search-open');
    const modal = $('#search-modal');
    if(!openBtn || !modal) return; // markup not present

    const panel = modal.querySelector('.search-panel');
    const closeBtn = $('#search-close');
    const input = $('#search-query');
    const resultsEl = $('#search-results');
  const tagCloud = $('#tag-cloud');
  const catCloud = $('#category-cloud');
  const yearCloud = $('#year-cloud');
  const sortCloud = $('#sort-cloud');

    // Determine search index URL from script attribute
    const scriptEl = $$('script').find(s => s.src && s.src.indexOf('/assets/js/search.js') !== -1);
    const indexUrl = (scriptEl && scriptEl.dataset && scriptEl.dataset.searchIndex) ? scriptEl.dataset.searchIndex : '/search.json';

    let index = [];
    let tagCounts = new Map();
    let catCounts = new Map();
  let selectedTags = new Set();
  let selectedCats = new Set();
  let selectedYears = new Set();
  let yearCounts = new Map();
  let selectedSort = 'relevance'; // 'relevance' | 'newest' | 'oldest'

    const sanitize = (s) => (s || '').toString().toLowerCase();

    function tallyCounts(){
      tagCounts = new Map();
      catCounts = new Map();
      yearCounts = new Map();
      index.forEach(i => {
        (i.tags||[]).forEach(t => tagCounts.set(t, (tagCounts.get(t)||0)+1));
        (i.categories||[]).forEach(c => catCounts.set(c, (catCounts.get(c)||0)+1));
        if(i.date){
          const y = String(new Date(i.date).getFullYear());
          if(y && y !== 'NaN') yearCounts.set(y, (yearCounts.get(y)||0)+1);
        }
      });
    }

    function chip(label, count, type){
      const el = document.createElement('button');
      el.className = 'chip';
      el.type = 'button';
      el.dataset.type = type; // 'tag' | 'category' | 'year'
      el.dataset.value = label;
      el.innerHTML = `${label} <span class="count">${count}</span>`;
      return el;
    }

    function renderCloud(container, map, type){
      container.innerHTML = '';
      const arr = Array.from(map.entries()).sort((a,b)=> b[1]-a[1]).slice(0, 80);
      arr.forEach(([label,count]) => {
        const el = chip(label, count, type);
        container.appendChild(el);
      });
    }

    function renderSort(){
      if(!sortCloud) return;
      sortCloud.innerHTML = '';
      [['relevance','Relevance'],['newest','Newest'],['oldest','Oldest']].forEach(([val,label])=>{
        const el = document.createElement('button');
        el.className = 'chip';
        el.type = 'button';
        el.dataset.type = 'sort';
        el.dataset.value = val;
        el.innerHTML = label;
        sortCloud.appendChild(el);
      });
    }

    function scoreItem(item, terms){
      if(!terms.length) return 1; // base score
      const title = sanitize(item.title);
      const ex = sanitize(item.excerpt);
      let s = 0;
      terms.forEach(t => {
        if(!t) return;
        if(title.includes(t)) s += 3;
        if(ex.includes(t)) s += 1;
      });
      return s;
    }

    function applyFilters(){
      const q = sanitize(input ? input.value : '');
      const terms = q.split(/\s+/).filter(Boolean);

      const filtered = index.filter(i => {
        for(const t of selectedTags){ if(!(i.tags||[]).includes(t)) return false; }
        for(const c of selectedCats){ if(!(i.categories||[]).includes(c)) return false; }
        if(selectedYears.size){
          const yr = i.date ? String(new Date(i.date).getFullYear()) : '';
          if(!selectedYears.has(yr)) return false;
        }
        if(!terms.length) return true;
        const t = sanitize(i.title);
        const e = sanitize(i.excerpt);
        return terms.every(term => t.includes(term) || e.includes(term));
      });

      if(selectedSort === 'newest'){
        filtered.sort((a,b)=> new Date(b.date) - new Date(a.date));
      } else if(selectedSort === 'oldest'){
        filtered.sort((a,b)=> new Date(a.date) - new Date(b.date));
      } else {
        filtered.sort((a,b) => scoreItem(b, terms)-scoreItem(a, terms));
      }

      resultsEl.innerHTML = '';
      if(!filtered.length){
        resultsEl.innerHTML = '<div class="result">No results.</div>';
        return;
      }
        filtered.slice(0, 50).forEach(i => {
          const a = document.createElement('a');
          a.className = 'result';
          a.href = i.url;
          const tags = (i.tags && i.tags.length) ? i.tags.map(t=>`<span class="tag">${t}</span>`).join(' ') : '';
          const cats = (i.categories && i.categories.length) ? i.categories.map(c=>`<span class="category">${c}</span>`).join(' ') : '';
          a.innerHTML = `<div class="title">${i.title}</div>
            <div class="meta">${i.type} • ${i.date}</div>
            <div class="meta-badges">${cats} ${tags}</div>`;
          resultsEl.appendChild(a);
        });
    }

    function syncSelectedVisuals(){
      $$('.chip', modal).forEach(el => {
        const type = el.dataset.type;
        const val = el.dataset.value;
        let selected = false;
        if(type === 'tag') selected = selectedTags.has(val);
        else if(type === 'category') selected = selectedCats.has(val);
        else if(type === 'year') selected = selectedYears.has(val);
        else if(type === 'sort') selected = (selectedSort === val);
        el.classList.toggle('selected', selected);
      });
    }

    function openModal(){
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      setTimeout(()=> input && input.focus(), 10);
      applyFilters();
      syncSelectedVisuals();
    }

    function closeModal(){
      modal.hidden = true;
      document.body.style.overflow = '';
    }

    function toggleFilter(type, value){
      if(type === 'sort'){
        selectedSort = value;
      } else {
        const set = type === 'tag' ? selectedTags : (type === 'category' ? selectedCats : selectedYears);
        if(set.has(value)) set.delete(value); else set.add(value);
      }
      syncSelectedVisuals();
      applyFilters();
    }

    // Event wiring
    openBtn.addEventListener('click', openModal);
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && !modal.hidden) closeModal(); });
    if(input) input.addEventListener('input', applyFilters);

    // Click on chips
    modal.addEventListener('click', (e)=>{
      const btn = e.target.closest('.chip');
      if(btn){ toggleFilter(btn.dataset.type, btn.dataset.value); }
    });

    // Make on-page tag/category badges open the modal with that filter
    document.addEventListener('click', (e)=>{
      const tag = e.target.closest('.tag');
      const cat = e.target.closest('.category');
      if(tag){ selectedTags = new Set([tag.textContent.trim()]); selectedCats = new Set(); openModal(); e.preventDefault(); }
      if(cat){ selectedCats = new Set([cat.textContent.trim()]); selectedTags = new Set(); openModal(); e.preventDefault(); }
    });

    // Load index
    fetch(indexUrl)
      .then(r => r.json())
      .then(data => {
        index = Array.isArray(data) ? data : [];
        tallyCounts();
        renderCloud(tagCloud, tagCounts, 'tag');
        renderCloud(catCloud, catCounts, 'category');
        if(yearCloud) renderCloud(yearCloud, new Map(Array.from(yearCounts.entries()).sort((a,b)=> b[0]-a[0])), 'year');
        renderSort();
        applyFilters();
      })
      .catch(()=>{
        // fail silently
      });
  });
})();