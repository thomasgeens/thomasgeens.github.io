---
layout: default
title: Code Snippets
---

# Code Snippets

Quick, reusable code snippets for common tasks.

<div class="content-grid">
  {% for snippet in site.snippets %}
    <div class="card">
      <h3><a href="{{ snippet.url | relative_url }}">{{ snippet.title }}</a></h3>
      {% if snippet.language %}
        <span class="snippet-language">{{ snippet.language }}</span>
      {% endif %}
    </div>
  {% endfor %}
</div>
