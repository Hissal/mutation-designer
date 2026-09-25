# Windows bootstrap. Node cannot check its own absence, so this runs first.
function Find-SupportedNode {
    $candidates = @()
    $command = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($command) { $candidates += $command.Source }
    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA)) {
        if ($base) { $candidates += Join-Path $base 'nodejs\node.exe' }
    }
    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            try {
                $version = & $candidate --version 2>$null
                if ($LASTEXITCODE -eq 0 -and "$version" -match '^v(\d+)\.' -and [int]$Matches[1] -ge 22) {
                    return $candidate
                }
            } catch { }
        }
    }
}

function Find-WinGet {
    $command = Get-Command winget.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
}

function Install-NodeLts($winget) {
    & $winget install --id OpenJS.NodeJS.LTS --exact --source winget | Out-Host
    return $LASTEXITCODE
}

function Refresh-ProcessPath {
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machinePath;$userPath;$env:Path"
}

function Resolve-Node {
    $node = Find-SupportedNode
    if ($node) { return $node }
    Write-Host 'Mutation Designer needs Node.js 22 or newer. A supported installation was not found.'
    $winget = Find-WinGet
    if (-not $winget) {
        throw 'Windows Package Manager (winget) is unavailable. Install Node.js LTS from https://nodejs.org/ then run this launcher again.'
    }
    Write-Host 'The launcher can install Node.js LTS using Windows Package Manager. Windows may ask for administrator permission.'
    do { $answer = Read-Host 'Install Node.js now? [Y/N]' } until ($answer.Trim() -match '^[YyNn]$')
    if ($answer.Trim() -notmatch '^[Yy]$') {
        Write-Host 'No installation requested. You can run the launcher again when ready.'
        return $null
    }
    $result = Install-NodeLts $winget
    if ($result -ne 0) {
        throw "Node.js installation did not complete (exit code $result). Try again, or install Node.js LTS from https://nodejs.org/ manually."
    }
    Refresh-ProcessPath
    $node = Find-SupportedNode
    if (-not $node) {
        throw 'A supported Node.js installation is still unavailable. Close and reopen the launcher. If needed, install Node.js LTS from https://nodejs.org/ manually.'
    }
    return $node
}

# Dot-sourcing exposes the functions for tests without launching or installing.
if ($MyInvocation.InvocationName -ne '.') {
    try {
        $node = Resolve-Node
        if (-not $node) { exit 0 }
        & $node (Join-Path $PSScriptRoot 'launch.mjs') @args
        exit $LASTEXITCODE
    } catch {
        Write-Host "Could not launch Mutation Designer: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
