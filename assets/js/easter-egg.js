// Pi Easter Egg: fake confidential windows pile + playful message
(function(){
  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    var trigger = document.getElementById('pi-trigger');
    var overlay = document.getElementById('pi-overlay');
    var stack = overlay ? overlay.querySelector('.pi-stack') : null;
    var msg = document.getElementById('pi-message');
    var closeBtn = document.getElementById('pi-close');
    if (!trigger || !overlay || !stack || !msg || !closeBtn) return;

    var active = false, restoreFocusEl = null;

    function rand(min, max){ return Math.random() * (max - min) + min; }

    var agencies = ['NSA','FBI','CIA','MI6','NASA','KGB','DARPA'];
    var fakeLines = [
      'CLASSIFIED//NOFORN//ORCON',
      'AUTHZ: bearer 9f2c...redacted',
      'SUBJECT: Project NEBULA',
      'clearance: TOP SECRET',
      'trace-id: 7b3-ef9-42a',
      'route add 10.0.0.0/8 via 10.4.1.1',
      'conf: SIGINT | HUMINT | OSINT',
      'hostname: gateway-13.sec',
      'uid=0(root) gid=0(root)',
      'SELECT * FROM ops WHERE level = "S"',
      'Δt: 0.003s checksum OK',
      'X-CLASS: EYES ONLY',
    ];
    var conspirLines = [
      'FILE: V. Putin - offshore holdings',
      'DOSSIER: D.J. Trump - undisclosed loans',
      'INCIDENT: Epstein flight logs [REDACTED]',
      'PROJECT: Apollo 11 studio footage backup',
      'EVIDENCE: Roswell NM crash site analysis',
      'MEMO: Area 51 personnel roster (restricted)',
      'BRIEF: Moon landing set design archives',
      'REPORT: UAP encounter 2004 USS Nimitz',
      'INTEL: Extraterrestrial signal confirmation',
      'DATA: Chemtrails composition study (classified)',
      'SURVEILLANCE: Deep state coordination log',
      'ARCHIVE: JFK files - missing pages recovered',
    ];

    function makeWindow(i, total){
      var w = document.createElement('div');
      w.className = 'pi-window glitch';
      var width = Math.floor(rand(220, 360));
      var height = Math.floor(rand(120, 200));
      var x = Math.floor(rand(5, 75)); // vw
      var y = Math.floor(rand(5, 65)); // vh
      var rot = rand(-6, 6);
      w.style.width = width + 'px';
      w.style.height = height + 'px';
      w.style.left = x + 'vw';
      w.style.top = y + 'vh';
      w.style.transform = 'rotate(' + rot + 'deg)';
      w.style.animationDelay = (i * 0.08) + 's';

    w.innerHTML = '\n        <div class="pi-titlebar">\n          <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>\n          <span class="title">SECURE TERMINAL \u03C0</span>\n        </div>\n        <div class="pi-body">\n          <div class="pi-code"></div>\n          <div class="pi-watermark">CONFIDENTIAL</div>\n        </div>\n      ';

      // randomly append an agency badge
      if (Math.random() < 0.6) {
        var agency = agencies[(Math.random() * agencies.length) | 0];
        var tb = w.querySelector('.pi-titlebar');
        if (tb && agency){
          var badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = agency;
          badge.setAttribute('data-agency', agency);
          tb.appendChild(badge);
        }
      }

      // fill with faux confidential content lines
      var c = w.querySelector('.pi-code');
      if (c){
        var n = (Math.random() * 4 + 3) | 0; // 3..6
        var html = '';
        // mix regular and conspiracy lines
        var pool = (Math.random() < 0.6) ? conspirLines : fakeLines;
        for (var k=0; k<n; k++){
          var line = pool[(Math.random() * pool.length) | 0];
          if (Math.random() < 0.4) line += ' #' + (((Math.random() * 900) | 0) + 100);
          html += '<div class="l">' + line.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>';
        }
        c.innerHTML = html;
      }
      return w;
    }

    function openPi(){
      if (active) return;
      active = true;
      restoreFocusEl = document.activeElement;
      overlay.hidden = false;
      msg.hidden = true;
      document.body.style.overflow = 'hidden';

      // clear any old nodes
      stack.innerHTML = '';

      var total = 14;
      for (var i=0; i<total; i++){
        stack.appendChild(makeWindow(i, total));
      }

      // reveal message after animations
      setTimeout(function(){
        msg.hidden = false;
        closeBtn.focus();
      }, 1800);
    }

    function closePi(){
      if (!active) return;
      active = false;
      overlay.hidden = true;
      msg.hidden = true;
      stack.innerHTML = '';
      document.body.style.overflow = '';
      try { if (restoreFocusEl) restoreFocusEl.focus(); } catch(e){}
    }

    trigger.addEventListener('click', openPi);
    closeBtn.addEventListener('click', closePi);
    overlay.addEventListener('click', function(e){
      // allow clicking backdrop to close when message is visible
      if (e.target === overlay && !msg.hidden) closePi();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && active) closePi();
    });
  });
})();
