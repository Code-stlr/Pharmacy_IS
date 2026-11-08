param([string]$DemoPassword = $env:DEMO_PASSWORD)
$ErrorActionPreference = 'Stop'
if (-not $DemoPassword) { throw 'Set DEMO_PASSWORD to a strong fictional-test password.' }
$repoPath = Split-Path $PSScriptRoot -Parent
Push-Location $repoPath
try {
    $env:PHARMACY_ENV_FILE = '.env.example'
    $env:DEMO_PASSWORD = $DemoPassword
    $env:PLAYWRIGHT_BASE_URL = 'http://localhost:8181'
    $compose = @('compose', '-p', 'pharmacy-acceptance', '--env-file', '.env.example', '-f', 'docker-compose.yml', '-f', 'docker-compose.acceptance.yml')
    function Invoke-Checked([string]$Program, [string[]]$Arguments) {
        & $Program @Arguments
        if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit code $LASTEXITCODE" }
    }
    Invoke-Checked docker ($compose + @('up', '--build', '-d', '--wait'))
    Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'python', 'manage.py', 'check'))
    Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'python', 'manage.py', 'makemigrations', '--check', '--dry-run'))
    Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'python', '-m', 'pytest', '-p', 'no:cacheprovider', '-q'))
    Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'python', 'manage.py', 'spectacular', '--validate', '--fail-on-warn', '--file', '/tmp/schema.yml'))
    Invoke-Checked docker ($compose + @('exec', '-T', 'backend', 'python', 'manage.py', 'seed_demo'))
    Invoke-Checked docker ($compose + @('exec', '-T', '-e', "DEMO_PASSWORD=$DemoPassword", 'backend', 'python', 'manage.py', 'create_demo_users'))
    $health = Invoke-RestMethod 'http://localhost:8181/api/health/'
    if ($health.status -ne 'ok') { throw 'Database readiness failed.' }
    Push-Location frontend
    try {
        Invoke-Checked npm.cmd @('ci')
        Invoke-Checked npm.cmd @('test')
        Invoke-Checked npm.cmd @('run', 'build')
        Invoke-Checked npx.cmd @('playwright', 'test')
    } finally { Pop-Location }
    Write-Output 'Acceptance run passed. Isolated stack remains at http://localhost:8181.'
    Write-Output 'Existing local demonstration database was not reset.'
} finally { Pop-Location }
