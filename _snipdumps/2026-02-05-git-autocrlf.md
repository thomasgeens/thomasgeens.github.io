---
layout: snipdump
title: "Git Auto CRLF (.gitattributes)"
date: 2026-02-05
tags: [git, eol, crlf]
categories: [code]
language: shell
---

To allow for proper collaboration on a Git repository across different platforms, make sure to disable git's auto CRLF feature and implement typically a .gitattributes file in your repo.

These measures will allow you to configure proper line-endings for each type of filetype extension and prevent git from updating them across multiple platforms (OS) each having their own EOL standard (CR/LF/CRLF).

> **Info**
> Recommended `core.autocrlf` settings typically vary by OS:
>
> - Windows: use `true` or `input` (pair with `.gitattributes`).
> - macOS/Linux: use `input` or `false` (pair with `.gitattributes`).
> - Mixed teams: use `false` to avoid silent conversions, and enforce line endings in `.gitattributes`.
{: .admonition .info }

As shown in the above hint defining proper line-endings per filetype extension allows a repo to maintain multiple standards for different file types within a single repo e.g., a PowerShell script for Windows, a Bash script for Linux etc.

> **Notice**
> Avoid the usage of tools such as `dos2unix` and `unix2dos` as they may conflict with git's handling of line endings and don't allow for proper granularity.
{: .admonition .notice }

## Verify your current line endings within your repository and their impact

{% highlight shell linenos %}
git ls-files --eol
git status
git diff
{% endhighlight %}

## Update your Git configuration settings

> **Warning**
> Changing line endings in a repo may cause a large number of changes to show up in `git status` and `git diff`. Make sure to review these changes carefully before committing them.
{: .admonition .warning }

{% highlight shell linenos %}
# list current configuration settings
git config --list
# add configuration setting auto crlf (use --global in case of privilege
# issues or unintended system-wide changes)
git config --system --add core.autocrlf false
# update configuration setting auto crlf via text-editor
git config --system --edit
{% endhighlight %}

## Add a .gitattributes file to your repository's root folder

<details open markdown="1">
<summary><code>.gitattributes</code></summary>

{% highlight conf linenos %}
# Set default behavior to automatically normalize line endings
* text=auto

# Git files should use LF
.gitattributes text eol=lf
.gitignore text eol=lf

# Markdown files should use LF
*.md text eol=lf
*.markdown text eol=lf

# Shell scripts should use LF
*.sh text eol=lf

# Windows scripts should use CRLF
*.ps1 text eol=crlf
*.bat text eol=crlf
*.cmd text eol=crlf

# Json files should use LF
*.json text eol=lf

# Explicitly declare text you want to always be normalized and converted
# to native line endings on checkout
Makefile text eol=lf
{% endhighlight %}

</details>

## Commit your .gitattributes file

{% highlight shell linenos %}
git status
# Make sure no other files are staged,
# if so unstage with `git restore --staged <file>`
git add .gitattributes
git commit -m "ci(.gitattributes): add EOL normalization for file types"
{% endhighlight %}

## Normalize your current line endings when required

{% highlight shell linenos %}
git add --renormalize .
{% endhighlight %}

## Again verify your current line endings within your repository and their impact

{% highlight shell linenos %}
git ls-files --eol
git status
git diff
{% endhighlight %}
