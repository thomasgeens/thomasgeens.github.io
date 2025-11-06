---
layout: default
title: Snipdumps
---

# Snipdumps

Short braindumps and code snippets by Thomas Geens.

<div class="content-grid">
  {% for snipdump in site.snipdumps %}
    <div class="card">
      <h3><a href="{{ snipdump.url | relative_url }}">{{ snipdump.title }}</a></h3>
      <p class="post-date">{{ snipdump.date | date: "%B %d, %Y" }}</p>
      {% if snipdump.tags %}
        <span class="tags">
          {% for tag in snipdump.tags %}
            <span class="tag">{{ tag }}</span>
          {% endfor %}
        </span>
      {% endif %}
      {% if snipdump.categories %}
        <span class="categories">
          {% for category in snipdump.categories %}
            <span class="category">{{ category }}</span>
          {% endfor %}
        </span>
      {% endif %}
    </div>
  {% endfor %}
</div>
