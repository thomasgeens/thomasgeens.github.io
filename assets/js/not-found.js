// 404 page: fake terminal that "cats" the missing path and suggests real pages
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  var PROMPT = "guest@thomas.geens.be:~$ ";

  var causes = [
    "page lived on a sparse VHD and someone ran `sudo fstrim -av`",
    "core.autocrlf=true converted the URL to CRLF",
    "it was opened with wslview, which no longer exists",
    "git push --force on main (we have all been there)",
    "a cosmic ray flipped a bit in the URL",
    "the page was classified. Ask π what it knows.",
    "it works on my machine",
  ];

  // Path segments that match every page, so they say nothing about intent
  var stopWords = [
    "snipdumps",
    "snipdump",
    "projects",
    "project",
    "blog",
    "html",
    "index",
    "www",
    "the",
    "and",
  ];

  var sections = [
    { title: "Home", url: "/" },
    { title: "Snipdumps", url: "/snipdumps/" },
    { title: "Projects", url: "/projects/" },
    { title: "About", url: "/about/" },
  ];

  function tokens(s) {
    return String(s || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(function (t) {
        return t.length >= 3 && !/^\d+$/.test(t);
      });
  }

  function distance(a, b) {
    var prev = [],
      cur,
      i,
      j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
      prev = cur;
    }
    return prev[b.length];
  }

  // Exact word match counts double; typos ("sprase") and prefixes ("wsl-spa") count once
  function score(item, want) {
    var have = tokens(
      [item.title, item.url, (item.tags || []).join(" ")].join(" "),
    );
    var s = 0;
    want.forEach(function (w) {
      if (have.indexOf(w) !== -1) {
        s += 2;
        return;
      }
      var near = have.some(function (h) {
        return (
          (w.length >= 4 && h.indexOf(w) === 0) ||
          (Math.abs(w.length - h.length) <= 2 &&
            distance(w, h) <= (w.length > 5 ? 2 : 1))
        );
      });
      if (near) s += 1;
    });
    return s;
  }

  function suggest(items, path) {
    var want = tokens(path).filter(function (t) {
      return stopWords.indexOf(t) === -1;
    });
    if (!want.length) return [];
    return items
      .map(function (item) {
        return { item: item, score: score(item, want) };
      })
      .filter(function (r) {
        return r.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, 3)
      .map(function (r) {
        return r.item;
      });
  }

  ready(function () {
    var term = document.getElementById("term-404");
    if (!term) return;

    var reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var path = window.location.pathname;
    try {
      path = decodeURIComponent(path);
    } catch (e) {
      /* keep raw path */
    }
    if (path.length > 80) path = path.slice(0, 77) + "...";

    // Start loading the index right away so it's ready when the typing ends
    var index = window.fetch
      ? fetch(term.getAttribute("data-search-index"))
          .then(function (r) {
            return r.ok ? r.json() : [];
          })
          .catch(function () {
            return [];
          })
      : Promise.resolve([]);

    term.textContent = "";

    function line(cls, text) {
      var el = document.createElement("div");
      el.className = "term-line" + (cls ? " " + cls : "");
      if (text) el.textContent = text;
      term.appendChild(el);
      return el;
    }

    function promptLine() {
      var el = line();
      var p = document.createElement("span");
      p.className = "term-prompt";
      p.textContent = PROMPT;
      el.appendChild(p);
      return el;
    }

    function link(el, label, url) {
      var a = document.createElement("a");
      a.href = url;
      a.textContent = label;
      el.appendChild(a);
    }

    // Drawn cursor: blinks even when the browser hasn't given the page focus yet
    var cursor = document.createElement("span");
    cursor.className = "term-cursor";
    cursor.setAttribute("aria-hidden", "true");

    // Type-ahead: keys pressed anywhere go to the prompt. During the animation they
    // skip it; once the prompt exists they focus it, so no click is needed.
    var skip = reduce;
    var typeahead = "";

    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (current && document.activeElement === current) return;
      if (e.target.closest && e.target.closest("input, textarea, select"))
        return;
      var printable = e.key.length === 1;
      if (!printable && e.key !== "Backspace") return;
      e.preventDefault();
      e.stopPropagation(); // keep "/" from opening the search modal
      if (current) {
        current.value = printable
          ? current.value + e.key
          : current.value.slice(0, -1);
        current.dispatchEvent(new Event("input"));
        current.focus({ preventScroll: true });
        return;
      }
      typeahead = printable ? typeahead + e.key : typeahead.slice(0, -1);
      skip = true;
    }
    document.addEventListener("keydown", onKey, true);

    function later(ms, fn) {
      if (skip) fn();
      else setTimeout(fn, ms);
    }

    function type(el, text, done) {
      var node = document.createTextNode("");
      el.appendChild(node);
      el.appendChild(cursor);
      var i = 0;
      function finish() {
        cursor.remove();
        done();
      }
      (function step() {
        if (skip) {
          node.data = text;
          return finish();
        }
        node.data = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, 30 + Math.random() * 50);
        else later(300, finish);
      })();
    }

    // Accepts a title, a /path or "~" (optionally after cd/cat/open); falls back to fuzzy matching the whole index
    function resolve(input, shown, items) {
      var q = input.trim().replace(/^(cd|cat|open)\s+/i, "");
      if (!q) return null;
      if (q === "~") return "/";
      var lower = q.toLowerCase();
      var all = shown.concat(sections, items);
      for (var i = 0; i < all.length; i++) {
        if (all[i].url === q || String(all[i].title).toLowerCase() === lower)
          return all[i].url;
      }
      var hit = suggest(items, q)[0];
      return hit ? hit.url : null;
    }

    var current = null;

    function ask(shown, items) {
      var el = promptLine();
      var input = document.createElement("input");
      input.type = "text";
      input.className = "term-input";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.setAttribute("autocapitalize", "off");
      input.setAttribute(
        "aria-label",
        "Go to page: type a title or path, then press Enter",
      );
      // Drawn cursor sits before the (empty) input; hidden once the real caret takes over
      el.appendChild(cursor);
      el.appendChild(input);
      if (!current) input.value = typeahead;
      current = input;
      function syncCursor() {
        cursor.hidden = document.activeElement === input || input.value !== "";
      }
      input.addEventListener("focus", syncCursor);
      input.addEventListener("blur", syncCursor);
      input.addEventListener("input", syncCursor);
      syncCursor();
      // Don't pop up the on-screen keyboard on touch devices
      if (window.matchMedia && window.matchMedia("(pointer: fine)").matches)
        input.focus({ preventScroll: true });

      input.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        var value = input.value.trim();
        el.replaceChild(document.createTextNode(value), input);
        if (value) {
          var url = resolve(value, shown, items);
          if (url) {
            line("term-comment", "# Redirecting to " + url + " ...");
            window.location.href = url;
            return;
          }
          line("term-error", "cat: " + value + ": No such file or directory");
        }
        ask(shown, items);
      });
    }

    // Clicking anywhere in the terminal (except a link) focuses the prompt
    term.addEventListener("click", function (e) {
      if (current && !e.target.closest("a"))
        current.focus({ preventScroll: true });
    });

    type(promptLine(), "cat " + path, function () {
      line("term-error", "cat: " + path + ": No such file or directory");
      later(400, function () {
        line("", " ");
        line(
          "term-comment",
          "# Probable cause: " + causes[(Math.random() * causes.length) | 0],
        );
        line("", " ");
        index.then(function (items) {
          items = items || [];
          var hits = suggest(items, path);
          var shown = hits.length ? hits : sections;
          later(400, function () {
            line(
              "term-comment",
              hits.length
                ? "# Did you mean:"
                : "# No close matches. Try one of these:",
            );
            shown.forEach(function (item) {
              var el = line("term-suggestion", "  → ");
              link(el, item.title, item.url);
            });
            line("", " ");
            ask(shown, items);
          });
        });
      });
    });
  });
})();
