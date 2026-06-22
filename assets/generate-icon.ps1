Add-Type -AssemblyName System.Drawing

$size = 16
$bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Background: dark navy rounded square
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 26, 26, 46))
$bgPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 3
$bgPath.AddArc(0, 0, $radius*2, $radius*2, 180, 90)
$bgPath.AddArc($size - $radius*2, 0, $radius*2, $radius*2, 270, 90)
$bgPath.AddArc($size - $radius*2, $size - $radius*2, $radius*2, $radius*2, 0, 90)
$bgPath.AddArc(0, $size - $radius*2, $radius*2, $radius*2, 90, 90)
$bgPath.CloseFigure()
$g.FillPath($bgBrush, $bgPath)

# Left spine (blue accent strip)
$spineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 79, 142, 247))
$g.FillRectangle($spineBrush, 2, 2, 2, 12)

# Text lines (white)
$lineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 255, 255, 255))
$lineMid   = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(170, 255, 255, 255))
$lineFaint = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(110, 255, 255, 255))

$g.FillRectangle($lineBrush, 5, 4, 7, 1)   # line 1 (longest)
$g.FillRectangle($lineMid,   5, 6, 6, 1)    # line 2
$g.FillRectangle($lineMid,   5, 8, 6, 1)    # line 3
$g.FillRectangle($lineFaint, 5, 10, 4, 1)   # line 4 (shortest)

# Pencil dot (yellow, bottom-right)
$pencilBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 245, 200, 66))
$g.FillEllipse($pencilBrush, 10, 11, 3, 3)

# Cleanup
$g.Dispose()

$outPath = Join-Path $PSScriptRoot "tray-icon.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "Icon saved to: $outPath"
