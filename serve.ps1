param([int]$Port = 8765)
Write-Host "Open http://localhost:$Port in your browser (Ctrl+C to stop)"
$root = $PSScriptRoot
$l = New-Object System.Net.HttpListener; $l.Prefixes.Add("http://localhost:$Port/"); $l.Start()
$types = @{ '.html'='text/html; charset=utf-8'; '.jpg'='image/jpeg'; '.png'='image/png'; '.js'='text/javascript'; '.css'='text/css' }
while ($l.IsListening) {
  $c = $l.GetContext(); $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/')); if (-not $p) { $p = 'index.html' }
  $f = Join-Path $root $p
  if ((Test-Path $f -PathType Leaf) -and -not $p.StartsWith('.')) { $b = [IO.File]::ReadAllBytes($f); $c.Response.ContentType = $types[[IO.Path]::GetExtension($f)]; $c.Response.OutputStream.Write($b, 0, $b.Length) } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}
