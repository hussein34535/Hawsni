
Add-Type -AssemblyName System.Drawing

$sourcePath = "icon.png"
$sizes = @(16, 48, 128)

if (Test-Path $sourcePath) {
    try {
        $img = [System.Drawing.Image]::FromFile($sourcePath)
        
        foreach ($size in $sizes) {
            $targetPath = "icons\icon${size}.png"
            $bmp = New-Object System.Drawing.Bitmap $size, $size
            $graph = [System.Drawing.Graphics]::FromImage($bmp)
            $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graph.DrawImage($img, 0, 0, $size, $size)
            $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $bmp.Dispose()
            $graph.Dispose()
            Write-Host "Resized to ${size}x${size} at $targetPath"
        }
        $img.Dispose()
    } catch {
        Write-Error "Error resizing images: $_"
    }
} else {
    Write-Error "Source file $sourcePath not found."
}
