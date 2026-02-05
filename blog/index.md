---
layout: default
title: Blog
---

# Blog Posts

<div class="content-grid">
  {% assign sorted_posts = site.posts | sort: "date" | reverse %}
  {% for post in sorted_posts %}
    <div class="card">
      <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      <p class="post-date">{{ post.date | date: "%B %d, %Y" }}</p>
      {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
      {% endif %}
    </div>
  {% endfor %}
</div>
