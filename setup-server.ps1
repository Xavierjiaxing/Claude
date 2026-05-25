# 医疗器械AI知识库 - Windows服务器部署脚本
# 在服务器上以管理员身份运行 PowerShell，执行此脚本

$ErrorActionPreference = "Stop"
$APP_DIR = "C:\medical-kb"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  医疗器械 AI 知识库 - 部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Node.js
Write-Host "[1/5] 检查 Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "Node.js 未安装，正在下载安装..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v20.19.0/node-v20.19.0-win-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart"
    Remove-Item $nodeInstaller
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
    Write-Host "Node.js 安装完成" -ForegroundColor Green
} else {
    Write-Host "Node.js $nodeVersion 已安装" -ForegroundColor Green
}

# 2. 解压部署包
Write-Host "[2/5] 部署应用文件..." -ForegroundColor Yellow
$deployFile = "D:\medical-kb-deploy.tar.gz"
if (-not (Test-Path $deployFile)) { $deployFile = "C:\medical-kb-deploy.tar.gz" }
if (-not (Test-Path $deployFile)) {
    $deployFile = Read-Host "请输入部署包完整路径 (medical-kb-deploy.tar.gz)"
}
if (-not (Test-Path $deployFile)) {
    Write-Host "找不到部署包，请确认路径" -ForegroundColor Red
    exit 1
}

if (Test-Path $APP_DIR) {
    Write-Host "备份旧版本..." -ForegroundColor Yellow
    $backupDir = "$APP_DIR.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Move-Item $APP_DIR $backupDir
}

New-Item -ItemType Directory -Path $APP_DIR -Force | Out-Null
tar -xzf $deployFile -C $APP_DIR
Write-Host "文件解压完成" -ForegroundColor Green

# 3. 安装依赖
Write-Host "[3/5] 安装 npm 依赖..." -ForegroundColor Yellow
Set-Location $APP_DIR
npm install --production
Write-Host "依赖安装完成" -ForegroundColor Green

# 4. 配置环境变量
Write-Host "[4/5] 配置环境变量..." -ForegroundColor Yellow
if (-not (Test-Path "$APP_DIR\.env")) {
    @"
ANTHROPIC_API_KEY=sk-dca0b49cb4c7417ebc06cc2456be313d
KIMI_API_KEY=sk-P1au6j6BFwrh8u6TwJCvEwA3JY3P0784SVjKWMxav0CuNhDE
PORT=3000
"@ | Out-File -FilePath "$APP_DIR\.env" -Encoding UTF8
    Write-Host ".env 文件已创建" -ForegroundColor Green
}

# 5. 配置防火墙
Write-Host "[5/5] 配置防火墙..." -ForegroundColor Yellow
$ruleName = "Medical-KB-Port-3000"
if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow | Out-Null
    Write-Host "防火墙规则已添加: 允许端口 3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "启动命令：" -ForegroundColor Yellow
Write-Host "  cd C:\medical-kb" -ForegroundColor White
Write-Host "  node dist\server\server.js" -ForegroundColor White
Write-Host ""
Write-Host "访问地址: http://45.43.61.113:3000" -ForegroundColor Cyan
Write-Host "登录密码: 721006" -ForegroundColor Cyan
