# install-deps.ps1
# Checks for Node/npm and runs project installs in this folder.
$ErrorActionPreference = 'Stop'
function Command-Exists($name) { return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null }
if (-not (Command-Exists node)) {
  Write-Host "Node.js not found. Install Node.js LTS from https://nodejs.org/ or run: winget install OpenJS.NodeJS.LTS (requires winget)." -ForegroundColor Yellow
  exit 1
}
if (-not (Command-Exists npm)) {
  Write-Host "npm not found. Ensure Node.js installation added npm to PATH." -ForegroundColor Yellow
  exit 1
}
# Run from script directory (project root)
Set-Location -LiteralPath (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)
Write-Host "Using Node: $(node -v)  npm: $(npm -v)" -ForegroundColor Green
Write-Host "Installing runtime dependencies..." -ForegroundColor Cyan
npm install react react-dom lucide-react
Write-Host "Installing devDependencies..." -ForegroundColor Cyan
npm install --save-dev typescript @types/react @types/react-dom tailwindcss
Write-Host "Dependencies installed. You can now build or run your project." -ForegroundColor Green
