---
layout: snipdump
title: "Let WSL2 shrink its VHDX files automatically with Sparse VHD"
date: 2026-10-29
tags: [wsl, windows, vhdx, disk, powershell]
categories: [code]
language: powershell
---

## The problem

Every WSL2 distribution lives inside a virtual disk file (`ext4.vhdx`) on your Windows drive. By default that file behaves like a one-way sponge: it **grows** when you add data inside Linux, but it **never shrinks** when you delete it again. Pull a few big Docker images, clean them up, and Windows still sees a VHDX that's tens of gigabytes larger than what's actually in use.

**Sparse VHD** fixes that. In sparse mode Windows listens to the Linux TRIM (`discard`) commands and punches holes in the VHDX for blocks that are no longer used, so the freed space goes straight back to your Windows host.

| Disk mode | When you add files | When you delete files |
| --- | --- | --- |
| **Standard** | Expands automatically | Keeps its maximum size. The space stays trapped until you compact the disk by hand. |
| **Sparse** | Expands automatically | Shrinks automatically. Windows reclaims the space shortly after Linux trims the freed blocks. |

> **Warning**
> Sparse VHD is still an **experimental** WSL feature, and `wsl` prints a warning when you turn it on. Users have reported cases of distribution corruption with sparse disks ([1](https://medium.com/@kendallroth/wsl-space-reclamation-d46dad5a87c8), [2](https://greengorych.io/blog/wsl-hardware-resources-management/)). Back up any distribution you care about before converting it:
> `wsl --export <Distro> D:\backup\<Distro>.tar`
{: .admonition .warning }

## Prerequisites

Sparse VHD only works for **WSL2** distributions. Check which version each of yours uses:

{% highlight powershell linenos %}
wsl --list --verbose
{% endhighlight %}

## Make new distributions sparse by default

Add the following to `%USERPROFILE%\.wslconfig` (create the file if it doesn't exist):

{% highlight ini linenos %}
[experimental]
sparseVhd=true
{% endhighlight %}

Or flip **Enable sparse VHD by default** in the **WSL Settings** app, which writes the same setting.

> **Info**
> This only affects distributions you install **after** the change, and `.wslconfig` is only read when WSL starts. Run `wsl --shutdown` to make sure it's picked up. Existing distributions need the conversion below.
{: .admonition .info }

## Check and convert existing distributions

The script below reads every registered distribution from the registry, finds its VHDX and reports:

- whether the file is sparse,
- its **logical** size (what Explorer usually shows),
- its **real size on disk** (what it actually costs you).

It then asks whether to shut WSL down and convert every distribution that isn't sparse yet. Use `-WhatIf` to only see the status, or `-Force` to skip the question.

> **Info**
> The script also works under PowerShell lockdown (Constrained Language Mode), which many company devices enforce. In that mode it can't measure the real size on disk, so `OnDiskGB` shows `n/a`. If your device doesn't let you run scripts at all, use the manual commands below: they only need `wsl.exe`.
{: .admonition .info }

<details open markdown="1">
<summary><code>Enable-WslSparseVhd.ps1</code></summary>

{% highlight powershell linenos %}
#Requires -Version 5.1
<#
.SYNOPSIS
    Show Sparse VHD status for all WSL2 distributions and enable it where missing.
.DESCRIPTION
    Works under PowerShell lockdown (Constrained Language Mode). Measuring the
    real size on disk needs Add-Type, so that column is only filled in Full
    Language mode.
.PARAMETER Force
    Convert without asking for confirmation.
.EXAMPLE
    .\Enable-WslSparseVhd.ps1            # show status, then ask before converting
    .\Enable-WslSparseVhd.ps1 -WhatIf    # show status only
#>
[CmdletBinding(SupportsShouldProcess)]
param([switch]$Force)

# Real on-disk size (Explorer often shows the logical size of a sparse file)
$canMeasure = $ExecutionContext.SessionState.LanguageMode -eq 'FullLanguage'
if ($canMeasure) {
    Add-Type -Namespace Win32 -Name Disk -MemberDefinition @'
[DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
public static extern uint GetCompressedFileSizeW(string lpFileName, out uint lpFileSizeHigh);
'@
}

function Get-SizeOnDisk([string]$Path) {
    if (-not $canMeasure) { return 'n/a' }
    $high = [uint32]0
    $low  = [Win32.Disk]::GetCompressedFileSizeW($Path, [ref]$high)
    '{0:N2}' -f ((([int64]$high -shl 32) -bor [int64]$low) / 1GB)
}

$lxss = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Lxss\*'

$distros = @(Get-ItemProperty -Path $lxss -ErrorAction SilentlyContinue |
    Where-Object DistributionName |
    ForEach-Object {
        $name    = $_.DistributionName
        $base    = $_.BasePath -replace '^\\\\\?\\', ''   # strip \\?\ prefix
        $vhdName = if ($_.VhdFileName) { $_.VhdFileName } else { 'ext4.vhdx' }
        $vhd     = Get-Item -LiteralPath (Join-Path $base $vhdName) -ErrorAction SilentlyContinue

        if (-not $vhd) { Write-Warning "${name}: no VHDX found (WSL1 distro?), skipped."; return }

        # Select-Object instead of [pscustomobject], which lockdown blocks
        $vhd | Select-Object @{ n = 'Distribution'; e = { $name } },
            @{ n = 'Sparse';   e = { $_.Attributes -match 'SparseFile' } },
            @{ n = 'SizeGB';   e = { '{0:N2}' -f ($_.Length / 1GB) } },
            @{ n = 'OnDiskGB'; e = { Get-SizeOnDisk $_.FullName } },
            @{ n = 'Path';     e = { $_.FullName } }
    })

if (-not $distros) { Write-Warning 'No WSL2 distributions found.'; return }

$distros | Format-Table -AutoSize
if (-not $canMeasure) { Write-Host "OnDiskGB needs Full Language mode, check 'Size on disk' in Explorer instead." }

$todo = @($distros | Where-Object { -not $_.Sparse })
if (-not $todo) { Write-Host 'All WSL2 distributions already use Sparse VHD.' -ForegroundColor Green; return }

# $PSCmdlet.ShouldProcess() is blocked under lockdown, so handle -WhatIf and confirmation ourselves
$names = $todo.Distribution -join ', '
if ($WhatIfPreference) { Write-Host "What if: shut down WSL and enable Sparse VHD for: $names"; return }
if (-not $Force) {
    $answer = Read-Host "Shut down WSL and enable Sparse VHD for: $names? [y/N]"
    if ($answer -notmatch '^(y|yes)$') { return }
}

wsl.exe --shutdown
foreach ($d in $todo) {
    wsl.exe --manage $d.Distribution --set-sparse true
    if ($LASTEXITCODE -ne 0) { Write-Warning "Failed for '$($d.Distribution)' (exit $LASTEXITCODE)." }
    else { Write-Host "Enabled Sparse VHD for '$($d.Distribution)'." -ForegroundColor Green }
}
Write-Host "Inside each distro, run 'sudo fstrim -av' to reclaim space now." -ForegroundColor Yellow
{% endhighlight %}

</details>

Prefer doing it by hand? Make sure the distribution is fully stopped first, then convert it (quote the name if it contains spaces):

{% highlight powershell linenos %}
wsl --shutdown
wsl --manage Ubuntu --set-sparse true
{% endhighlight %}

## Reclaim the space that's already trapped

Switching to sparse mode doesn't free up the space that's **already** stuck in the VHDX. Windows only learns about free blocks when Linux trims them, so trigger a trim once inside each converted distribution:

{% highlight shell linenos %}
sudo fstrim -av
{% endhighlight %}

Run the script again afterwards and compare `OnDiskGB` with the earlier run.

> **Notice**
> Don't panic if Explorer or **Properties → Size** still shows the old, large number. For sparse files Windows often shows the logical size. Check **Size on disk**, or the `OnDiskGB` column of the script, to see what the file really takes ([Super User](https://superuser.com/questions/1827953/reclaim-wsl2-disk-space-after-setting-it-to-sparse)).
{: .admonition .notice }
