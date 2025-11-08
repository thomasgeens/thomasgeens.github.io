(function(){
  function copyToClipboard(text){
    if(navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function(resolve){
      var ta=document.createElement('textarea');
      ta.value=text; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); resolve();
    });
  }
  document.addEventListener('click', function(e){
    var btn = e.target.closest('.share-btn[data-copy]');
    if(!btn) return;
    e.preventDefault();
    var url = btn.getAttribute('data-copy');
    copyToClipboard(url).then(function(){
      var prevAria = btn.getAttribute('aria-label') || '';
      btn.setAttribute('aria-label','Copied!');
      btn.classList.add('copied');
      setTimeout(function(){ btn.setAttribute('aria-label', prevAria || 'Copy link'); btn.classList.remove('copied'); }, 1200);
    });
  });

  // Optional: use Web Share API if available and user long-presses the copy button (shift+click)
  document.addEventListener('click', function(e){
    var btn = e.target.closest('.share-btn[data-copy]');
    if(!btn || !e.shiftKey) return;
    e.preventDefault();
    var share = navigator.share;
    if(share){
      share({ title: document.title, url: btn.getAttribute('data-copy') }).catch(function(){});
    }
  });
})();
