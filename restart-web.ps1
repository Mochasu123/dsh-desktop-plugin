# dsh-my — 重启当前 dsh web 实例（终端兜底，带端口参数，可自脱离进程树）。
#
# 什么时候需要它：
#   界面左下角「重启 Harness」按钮走的是 /api/session-center.restart；如果插件宿主
#   半边本身没加载成功（例如 0.1.5 升级后 connection 未 inject → 该路由返回 400），
#   按钮就会「点了没反应」。此时用本脚本从终端重启。
#
# 两条运行路径：
#   默认（用户直接跑）：解析出「旧监听者 pid + 其完整启动参数」，然后 spawn 一个
#     **detached 的 -Detach 助手**去做真正的重启，本进程立刻返回。
#     之所以要 detachment：本脚本会杀掉监听者 pid，而它往往正是当前 DSH 会话进程，
#     不脱离进程树的话助手会跟着一起死，端口就没人接管了。
#   -Detach（助手模式）：停旧监听者 → 等端口释放 → 用同一套参数拉起继任实例
#     （追加 --no-open，日志续写 restart.out.log|.err.log）→ 轮询到新实例响应
#     （未登录的 401 也算活着）→ 写 restart-web.log。
#
# 用法：
#   pwsh -File dsh-plugin/restart-web.ps1                 # 端口缺省取 DSH_WEB_URL，否则 3081
#   pwsh -File dsh-plugin/restart-web.ps1 -Port 3080
#
# 注意：执行后当前 DSH 会话进程会被结束（会话记录不丢）。等约 10-30 秒刷新浏览器即可。

param(
    [int]$Port = 0,
    [int]$HealthTimeoutSeconds = 60,
    [switch]$Detach
)

$ErrorActionPreference = "Stop"

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME ".dsh" }
$workingDir = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
if (-not $workingDir -or -not (Test-Path -LiteralPath $workingDir)) { $workingDir = (Get-Location).Path }
$logDir = Join-Path $dshHome "session-center"
if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$runLog = Join-Path $logDir "restart-web.log"
$selfPath = $PSCommandPath
if (-not $selfPath) { $selfPath = Join-Path $workingDir "dsh-plugin\restart-web.ps1" }

function Write-RunLog([string]$message) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $message
    Write-Host $line
    try { Add-Content -LiteralPath $runLog -Value $line -Encoding utf8 } catch { }
}

# --- 端口缺省：优先 DSH_WEB_URL，其次 3081 -------------------------------------
if ($Port -le 0) {
    $Port = 3081
    if ($env:DSH_WEB_URL) { try { $Port = ([uri]$env:DSH_WEB_URL).Port } catch { } }
}

# --- 定位内核 bin.js：全局安装优先，退回 npx 缓存 -------------------------------
function Resolve-DshBin {
    $found = $null
    $npmRoot = (npm root -g 2>$null | Select-Object -First 1)
    if ($npmRoot) {
        $candidate = Join-Path $npmRoot "@deepseek-ai\dsh\lib\bin.js"
        if (Test-Path -LiteralPath $candidate) { $found = $candidate }
    }
    if (-not $found -and $env:LOCALAPPDATA) {
        $npxRoot = Join-Path $env:LOCALAPPDATA "npm-cache\_npx"
        if (Test-Path -LiteralPath $npxRoot) {
            $found = Get-ChildItem -LiteralPath $npxRoot -Recurse -Filter bin.js -ErrorAction SilentlyContinue |
                Where-Object { $_.FullName -like "*\node_modules\@deepseek-ai\dsh\lib\bin.js" } |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1 -ExpandProperty FullName
        }
    }
    return $found
}

# --- 读旧监听者：pid + 完整启动参数（用于 1:1 复刻）-----------------------------
function Get-ListenerPids([int]$listenPort) {
    $listeners = Get-NetTCPConnection -LocalPort $listenPort -State Listen -ErrorAction SilentlyContinue
    if (-not $listeners) { return @() }
    return @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)
}

function Get-LaunchArgs([int[]]$pids, [string]$bin) {
    foreach ($pidValue in $pids) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$pidValue" -ErrorAction SilentlyContinue
        if (-not ($proc -and $proc.CommandLine)) { continue }
        $argvText = $proc.CommandLine
        if ($argvText.StartsWith('"')) { $argvText = $argvText.Substring(1) }
        $closing = $argvText.IndexOf('"')
        if ($closing -gt 0) { $argvText = $argvText.Substring($closing + 1) }
        $argv = @([regex]::Matches($argvText, '"[^"]*"|\S+') | ForEach-Object { $_.Value.Trim('"') })
        $binIndex = -1
        for ($i = 0; $i -lt $argv.Count; $i++) {
            if ($argv[$i] -like "*\lib\bin.js" -or $argv[$i] -like "*/lib/bin.js") { $binIndex = $i; break }
        }
        if ($binIndex -lt 0) { continue }
        $head = if ($binIndex -gt 0) { @($argv[0..($binIndex - 1)]) } else { @() }
        $tail = @()
        if ($binIndex + 1 -le $argv.Count - 1) { $tail = @($argv[($binIndex + 1)..($argv.Count - 1)]) }
        if ($tail -notcontains "--no-open") { $tail += "--no-open" }
        return @{ pid = $pidValue; args = ($head + @($bin) + $tail) }
    }
    return $null
}

function Get-DefaultArgs([int]$listenPort, [string]$bin) {
    $bootstrapPath = Join-Path $dshHome "proxy-bootstrap.mjs"
    if (Test-Path -LiteralPath $bootstrapPath) {
        $bootstrapUrl = "file:///" + $bootstrapPath.Replace('\', '/')
        return @("--import", $bootstrapUrl, $bin, "web", "--port", "$listenPort", "--no-open")
    }
    return @($bin, "web", "--port", "$listenPort", "--no-open")
}

# =============================== 助手模式 ======================================
if ($Detach) {
    try {
        $binPath = Resolve-DshBin
        if (-not $binPath) { throw "找不到 @deepseek-ai/dsh/lib/bin.js" }
        $nodeExe = (Get-Command node -ErrorAction Stop).Source

        $pids = Get-ListenerPids $Port
        $plan = if ($pids.Count -gt 0) { Get-LaunchArgs $pids $binPath } else { $null }
        $childArgs = if ($plan) { $plan.args } else { Get-DefaultArgs $Port $binPath }
        Write-RunLog "助手启动：端口 $Port，目标 argv = $($childArgs -join ' ')"

        foreach ($pidValue in $pids) {
            Write-RunLog "停止端口 $Port 上的旧监听者 (pid $pidValue)"
            Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
        }
        for ($i = 0; $i -lt 40; $i++) {
            if (-not (Get-ListenerPids $Port).Count) { break }
            Start-Sleep -Milliseconds 500
        }
        if ((Get-ListenerPids $Port).Count) { Write-RunLog "警告：端口 $Port 仍被占用，继任实例可能 EADDRINUSE" }

        $env:DSH_HOME = $dshHome
        Write-RunLog "启动继任实例…"
        $outLog = Join-Path $logDir "restart.out.log"
        $errLog = Join-Path $logDir "restart.err.log"
        $successor = Start-Process -FilePath $nodeExe -ArgumentList $childArgs -WorkingDirectory $workingDir `
            -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
        Write-RunLog "继任实例 pid=$($successor.Id)"

        $healthy = $false
        for ($i = 0; $i -lt $HealthTimeoutSeconds; $i++) {
            Start-Sleep -Seconds 1
            if ($successor.HasExited) { Write-RunLog "继任实例已退出（exit=$($successor.ExitCode)），看 $errLog"; break }
            if (-not (Get-ListenerPids $Port).Count) { continue }
            try {
                Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 3 | Out-Null
                $healthy = $true; break
            } catch {
                if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401) { $healthy = $true; break }
            }
        }
        if ($healthy) { Write-RunLog "OK: dsh web 已在 http://127.0.0.1:$Port 上起来 —— 刷新浏览器即可" }
        else { Write-RunLog "端口 $Port 未能确认就绪，请查 $outLog 与 $errLog" }
    } catch {
        Write-RunLog "重启失败：$($_.Exception.Message)"
    }
    exit 0
}

# =============================== 默认模式 ======================================
Write-RunLog "目标端口：$Port"
$bin = Resolve-DshBin
if (-not $bin) { Write-RunLog "找不到 @deepseek-ai/dsh/lib/bin.js，退出"; exit 1 }

$pids = Get-ListenerPids $Port
$plan = if ($pids.Count -gt 0) { Get-LaunchArgs $pids $bin } else { $null }
if ($plan) {
    Write-RunLog "将复刻旧监听者 pid $($plan.pid) 的启动参数：$($plan.args -join ' ')"
} else {
    Write-RunLog "端口 $Port 上没有监听者，将按默认形态启动"
}

# 关键：助手必须脱离本进程树 —— 它稍后要杀掉监听者，而监听者往往正是当前 DSH 会话进程
# 环境显式带上，保证助手与继任实例都拿到同一个 DSH_HOME / 代理设置
$env:DSH_HOME = $dshHome
if (-not $env:HTTP_PROXY) { $env:HTTP_PROXY = "http://127.0.0.1:7897" }
if (-not $env:HTTPS_PROXY) { $env:HTTPS_PROXY = "http://127.0.0.1:7897" }
$pwshExe = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
if (-not $pwshExe) { $pwshExe = (Get-Command powershell).Source }
$helperArgs = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $selfPath, "-Port", "$Port", "-Detach", "-HealthTimeoutSeconds", "$HealthTimeoutSeconds")
$helper = Start-Process -FilePath $pwshExe -ArgumentList $helperArgs -WindowStyle Hidden -PassThru
Write-RunLog "已拉起脱离进程树的重启助手 pid=$($helper.Id)（进度写入 $runLog）"
Write-RunLog "约 10-30 秒后刷新 http://127.0.0.1:$Port/ 即可"
