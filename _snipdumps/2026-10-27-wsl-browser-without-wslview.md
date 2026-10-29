---
layout: snipdump
title: "Open your Windows browser from WSL2 without wslview"
date: 2026-10-27
tags: [wsl, windows, ubuntu, browser, vscode, gh]
categories: [code]
language: shell
---

## The problem

On a fresh WSL2 **Ubuntu 26.04 LTS** install `wslview` is gone. Anything that relied on it to pop open your Windows browser (`gh auth login`, `xdg-open`, etc.) now fails or prints a URL you have to copy by hand.

The fix turns out to be a one-liner: point the `BROWSER` environment variable at Windows' own `explorer.exe`.

## What happened to wslu / wslview?

`wslview` was part of [wslu](https://github.com/wslutilities/wslu), a community collection of WSL helper utilities that Ubuntu shipped for years. The project has been discontinued:

- **February 2025**: the maintainer announced that development of wslu and its related projects would cease completely, that the `wslutiliti.es` site would shut down, and that the versions bundled with Ubuntu would no longer be supported by them.
- **March 2025**: the `wslutilities/wslu` repository was archived (read-only). The GitHub organization followed in May 2025. The repo and the announcement discussion now return a 404, which is why you can't reach them anymore.
- **Ubuntu 26.04 "Resolute"**: no `wslu` package. [Launchpad](https://launchpad.net/ubuntu/+source/wslu) lists it only up to 24.04 Noble, so `apt install wslu` gives you `E: Unable to locate package wslu`.

Other projects such as [DDEV](https://github.com/ddev/ddev/issues/8326) and the Rust [`open`](https://github.com/Byron/open-rs/issues/122) crate have dropped it as well.

> **Notice**
> Even on older releases where `wslu` can still be installed (22.04, 24.04), it's unmaintained. It's better to move off it now than to have it break during your next distro upgrade.
{: .admonition .notice }

## The trick: `BROWSER=explorer.exe`

Most Linux CLI tools that want to open a URL respect the `BROWSER` environment variable: `gh`, `xdg-open` (when no desktop environment is detected, which is the case in WSL), Python's `webbrowser`, `git web--browse`, and many Node.js tools. With WSL interop enabled (the default) you can run Windows executables directly from Linux, and `explorer.exe <url>` hands the URL to whatever Windows has set as its **default browser**.

{% highlight shell linenos %}
export BROWSER=/mnt/c/Windows/explorer.exe
# Test opening a URL:
"$BROWSER" 'https://github.com'
{% endhighlight %}

Your default Windows browser should open on github.com. Now try the thing that broke:

{% highlight shell linenos %}
gh auth login --web
xdg-open 'https://github.com'
python3 -m webbrowser 'https://github.com'
{% endhighlight %}

### Caveats

> **Info**
> `explorer.exe` returns exit code `1` even when it opened the URL successfully. Some tools see that as a failure and print something like `Failed opening a web browser ... exit status 1` even though the browser did open. The wrapper script below hides this.
{: .admonition .info }

- **URLs only.** `explorer.exe` doesn't understand Linux paths like `/home/me/report.html`. To open a local file, convert the path first: `explorer.exe "$(wslpath -w ./report.html)"`.
- **Quote URLs you type by hand.** Your shell treats `&` and `?` as special, so wrap the URL in single quotes: `"$BROWSER" 'https://example.com/?a=1&b=2'`. Tools like `gh` pass the URL directly and aren't affected.
- **Custom `/etc/wsl.conf`.** A changed `automount.root` moves `/mnt/c`, and `[interop] enabled=false` blocks Windows executables entirely.

## Making it permanent

Running `export` in a terminal only lasts for that session. Put it in your shell startup files, but think about **which** file you use and **when** you set it.

### Recommended: a tiny wrapper script

A wrapper deals with the exit-code quirk and gives every tool a single, stable path to call:

{% highlight shell linenos %}
mkdir -p ~/.local/bin
cat > ~/.local/bin/winbrowser <<'EOF'
#!/bin/sh
# Open URLs in the default Windows browser from WSL.
# explorer.exe exits 1 even on success, so always report success.
/mnt/c/Windows/explorer.exe "$@"
exit 0
EOF
chmod +x ~/.local/bin/winbrowser
{% endhighlight %}

### zsh

`~/.zshrc` is only read by **interactive** shells. If you want scripts, VS Code tasks and other non-interactive zsh processes to see `BROWSER` too, use `~/.zshenv`, which every zsh instance reads:

{% highlight shell linenos %}
# ~/.zshenv
# Only on WSL, only when nothing else (e.g. VS Code) already set BROWSER
if [[ -n "$WSL_DISTRO_NAME" && -z "$BROWSER" && -x "$HOME/.local/bin/winbrowser" ]]; then
  export BROWSER="$HOME/.local/bin/winbrowser"
fi
{% endhighlight %}

### bash

Ubuntu's default `~/.bashrc` is read by interactive non-login shells, while `~/.profile` is read by login shells (and already sources `~/.bashrc` and adds `~/.local/bin` to `PATH`). Put it in `~/.profile` so it's set once per login and inherited by every child process:

{% highlight shell linenos %}
# ~/.profile
# Only on WSL, only when nothing else (e.g. VS Code) already set BROWSER
if [ -n "$WSL_DISTRO_NAME" ] && [ -z "$BROWSER" ] && [ -x "$HOME/.local/bin/winbrowser" ]; then
  export BROWSER="$HOME/.local/bin/winbrowser"
fi
{% endhighlight %}

If your terminal starts non-login shells only, put the same block in `~/.bashrc` as well.

### Why the guards?

- **`$WSL_DISTRO_NAME`**: WSL sets this automatically. The check keeps your dotfiles portable, so the same `.zshenv` or `.profile` doesn't break `BROWSER` when you sync it to a real Linux machine or a Mac.
- **`-z "$BROWSER"`**: VS Code's Remote-WSL integrated terminal exports its own `BROWSER` helper, which opens URLs on the host side through VS Code. Don't overwrite it unconditionally. If that helper doesn't work for you, drop this check and your wrapper will always win.
- **`-x`**: if the wrapper is missing, you don't end up with a `BROWSER` that points at nothing.

## Clean up leftovers from wslu

If you upgraded from an older Ubuntu release instead of installing fresh, there may still be references to `wslview` around:

{% highlight shell linenos %}
# Is the (unmaintained) package still installed?
dpkg -l wslu
sudo apt remove wslu

# Does anything still point at wslview?
grep -n wslview ~/.zshrc ~/.zshenv ~/.bashrc ~/.profile 2>/dev/null
update-alternatives --display x-www-browser 2>/dev/null
echo "$BROWSER"
{% endhighlight %}

## Verify

Open a new shell (`exec zsh` / `exec bash -l`) and check that `echo "$BROWSER"` prints your wrapper.
