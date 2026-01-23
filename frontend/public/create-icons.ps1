Add-Type -AssemblyName System.Drawing

# Create 192x192 icon
$bmp192 = New-Object System.Drawing.Bitmap(192, 192)
$graphics192 = [System.Drawing.Graphics]::FromImage($bmp192)
$graphics192.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Orange gradient background
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
$graphics192.FillRectangle($brush, 0, 0, 192, 192)

# Draw wheat symbol
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 8)

# Stem
$graphics192.DrawLine($pen, 96, 140, 96, 60)

# Wheat grains
for ($i = 0; $i -lt 5; $i++) {
    $y = 70 + ($i * 14)
    $graphics192.FillEllipse($whiteBrush, 80, $y, 12, 20)
    $graphics192.FillEllipse($whiteBrush, 100, $y, 12, 20)
}

$bmp192.Save("$PSScriptRoot\pwa-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp192.Dispose()
$graphics192.Dispose()

# Create 512x512 icon
$bmp512 = New-Object System.Drawing.Bitmap(512, 512)
$graphics512 = [System.Drawing.Graphics]::FromImage($bmp512)
$graphics512.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$brush512 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
$graphics512.FillRectangle($brush512, 0, 0, 512, 512)

$whiteBrush512 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$pen512 = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 20)

# Stem
$graphics512.DrawLine($pen512, 256, 380, 256, 140)

# Wheat grains
for ($i = 0; $i -lt 8; $i++) {
    $y = 170 + ($i * 30)
    $graphics512.FillEllipse($whiteBrush512, 210, $y, 30, 50)
    $graphics512.FillEllipse($whiteBrush512, 272, $y, 30, 50)
}

$bmp512.Save("$PSScriptRoot\pwa-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Dispose()
$graphics512.Dispose()

Write-Host "PWA icons created successfully" -ForegroundColor Green
