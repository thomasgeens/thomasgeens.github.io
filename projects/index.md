---
layout: default
title: Projects
---

# Project Starters & Scaffolding

Collection of starter templates and scaffolding projects.

<div class="content-grid">
  {% assign sorted_projects = site.projects | sort: "title" %}
  {% for project in sorted_projects %}
    <div class="card">
      <h3><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h3>
      {% if project.github %}
        <p><a href="{{ project.github }}" target="_blank">View on GitHub →</a></p>
      {% endif %}
    </div>
  {% endfor %}
</div>
