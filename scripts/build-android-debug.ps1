$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $projectRoot "android"
$androidStudioJbr = "C:\Program Files\Android\Android Studio\jbr"

if (Test-Path $androidStudioJbr) {
  $env:JAVA_HOME = $androidStudioJbr
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

if (-not (Test-Path $androidDir)) {
  throw "Android project not found. Run npm run mobile:add:android first."
}

Push-Location $androidDir
try {
  .\gradlew.bat assembleDebug
} finally {
  Pop-Location
}
