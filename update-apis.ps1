# Script to update all API files to use storage-adapter instead of Cloudflare KV
# Run this after pnpm install completes

$files = @(
    "server/api/link/delete.post.ts",
    "server/api/link/edit.put.ts",
    "server/api/link/list.get.ts",
    "server/api/link/query.get.ts",
    "server/api/link/search.get.ts",
    "server/api/link/upsert.post.ts"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        
        # Add import if not exists
        if ($content -notmatch "import.*getKV.*from.*storage-adapter") {
            $content = $content -replace "(import.*\r?\n)", "`$1import { getKV } from '../../utils/storage-adapter'`r`n"
        }
        
        # Replace Cloudflare KV access patterns
        $content = $content -replace "const \{ cloudflare \} = event\.context\r?\n\s*const \{ KV \} = cloudflare\.env", "const KV = getKV(event)"
        $content = $content -replace "cloudflare\.env\.KV", "getKV(event)"
        
        Set-Content $path $content -NoNewline
        Write-Host "✅ Updated: $file"
    }
}

Write-Host "`n🎉 All API files updated!"
