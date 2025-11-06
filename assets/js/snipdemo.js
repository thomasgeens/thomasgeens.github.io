(function(){
  function init(){
    var demo = document.querySelector('.snipdemo');
    if(!demo) return;
    demo.classList.add('js-kinetic');

    var running = false;
    var timer;

    function rel(el, base){
      var r = el.getBoundingClientRect();
      return {
        x: r.left - base.left,
        y: r.top - base.top,
        w: r.width,
        h: r.height,
        style: window.getComputedStyle(el)
      };
    }

    function makeFly(text, cls, ref){
      var span = document.createElement('span');
      span.className = 'fly ' + cls;
      span.setAttribute('aria-hidden', 'true');
      span.textContent = text;
      // Match source text styling reasonably
      span.style.fontSize = ref.style.fontSize;
      span.style.fontFamily = ref.style.fontFamily;
      span.style.fontWeight = ref.style.fontWeight || '800';
      span.style.lineHeight = ref.style.lineHeight;
      span.style.transform = 'translate(' + Math.round(ref.x) + 'px,' + Math.round(ref.y) + 'px)';
      demo.appendChild(span);
      return span;
    }

    function flashResult(){
      var res = demo.querySelector('.word-result');
      if(!res) return;
      res.classList.add('result-flash');
      setTimeout(function(){ res.classList.remove('result-flash'); }, 550);
    }

    function run(){
      if(running) return; running = true;
      var snipSrc = demo.querySelector('.word-snippet .snip');
      var dumpSrc = demo.querySelector('.word-braindump .dump');
      var snipDst = demo.querySelector('.word-result .snip');
      var dumpDst = demo.querySelector('.word-result .dump');
      if(!(snipSrc && dumpSrc && snipDst && dumpDst)) { running = false; return; }

      var base = demo.getBoundingClientRect();
      var a = rel(snipSrc, base), b = rel(snipDst, base);
      var c = rel(dumpSrc, base), d = rel(dumpDst, base);

      var flySnip = makeFly(snipSrc.textContent, 'fly-snip', a);
      var flyDump = makeFly(dumpSrc.textContent, 'fly-dump', c);

      var ease = 'cubic-bezier(0.33,1,0.68,1)';

      var snipAnim = flySnip.animate([
        { transform: 'translate(' + Math.round(a.x) + 'px,' + Math.round(a.y) + 'px) scale(1)', opacity: 1 },
        { transform: 'translate(' + Math.round(b.x) + 'px,' + Math.round(b.y) + 'px) scale(1.06)', opacity: 1 }
      ], { duration: 900, easing: ease, delay: 100 });

      var dumpAnim = flyDump.animate([
        { transform: 'translate(' + Math.round(c.x) + 'px,' + Math.round(c.y) + 'px) scale(1)', opacity: 1 },
        { transform: 'translate(' + Math.round(d.x) + 'px,' + Math.round(d.y) + 'px) scale(1.06)', opacity: 1 }
      ], { duration: 900, easing: ease, delay: 350 });

      var arrived = 0;
      function finish(el, final){
        try { el.style.transform = 'translate(' + Math.round(final.x) + 'px,' + Math.round(final.y) + 'px)'; } catch(_){}
        setTimeout(function(){ if(el && el.parentNode) el.parentNode.removeChild(el); }, 150);
        arrived += 1;
        if(arrived === 2){
          flashResult();
          setTimeout(function(){ running = false; schedule(); }, 2000);
        }
      }

      snipAnim.onfinish = function(){ finish(flySnip, b); };
      dumpAnim.onfinish = function(){ finish(flyDump, d); };
    }

    function schedule(){ clearTimeout(timer); timer = setTimeout(run, 2400); }
    schedule();

    window.addEventListener('resize', function(){ /* next cycle will re-measure */ });
    document.addEventListener('themechange', function(){ /* next cycle will adapt colors */ });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
