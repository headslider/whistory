$ErrorActionPreference = "Stop"
$node = "C:\Users\tamak\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path $node)) { $node = "node" }
& $node "$PSScriptRoot\verify-static.js"