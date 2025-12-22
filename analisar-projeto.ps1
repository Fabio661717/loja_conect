param(
    [string]$ProjectPath = ".",
    [string]$OutputFile = "projeto_estrutura.md",
    [switch]$IncludeContent
)

Write-Host "Analisando projeto em: $ProjectPath" -ForegroundColor Yellow
Write-Host "Gerando documentação..." -ForegroundColor Yellow

# Cabeçalho do documento
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$content = @"
# Documentação da Estrutura do Projeto
**Gerado em:** $date
**Caminho:** $(Resolve-Path $ProjectPath)

## Estrutura de Pastas

\`\`\`text
"@

# Função para estrutura de pastas
function Get-FolderStructure {
    param([string]$Path, [int]$Level = 0)
    
    $indent = "│   " * $Level
    $items = Get-ChildItem -Path $Path
    
    foreach ($item in $items | Sort-Object Name) {
        if ($item.PSIsContainer) {
            $script:content += "$indent├── [$($item.Name)]`n"
            Get-FolderStructure -Path $item.FullName -Level ($Level + 1)
        } else {
            $size = if ($item.Length -gt 0) { "$($item.Length) bytes" } else { "vazio" }
            $script:content += "$indent├── $($item.Name) ($size)`n"
        }
    }
}

Get-FolderStructure -Path $ProjectPath

$content += @"
\`\`\`

## Arquivos por Tipo

"@

# Agrupa arquivos por extensão
$files = Get-ChildItem -Path $ProjectPath -Recurse -File | Group-Object Extension

foreach ($group in $files | Sort-Object Count -Descending) {
    $ext = if ($group.Name) { $group.Name } else { "(sem extensão)" }
    $content += "### $ext ($($group.Count) arquivos)`n`n"
    
    foreach ($file in $group.Group | Select-Object -First 10) {
        $relativePath = $file.FullName.Replace((Resolve-Path $ProjectPath).Path + "\", "")
        $content += "- \`$($relativePath)\` ($($file.Length) bytes)`n"
    }
    
    if ($group.Count -gt 10) {
        $content += "- ... mais $($group.Count - 10) arquivos`n"
    }
    
    $content += "`n"
}

# Adiciona conteúdo dos arquivos importantes se solicitado
if ($IncludeContent) {
    $content += @"
## Conteúdo de Arquivos Principais

"@
    
    # Lista de arquivos importantes para incluir conteúdo
    $importantFiles = @("package.json", "tsconfig.json", "vite.config.ts", "index.html", "App.tsx", "main.tsx")
    
    foreach ($pattern in $importantFiles) {
        $files = Get-ChildItem -Path $ProjectPath -Recurse -Filter $pattern -ErrorAction SilentlyContinue
        
        foreach ($file in $files) {
            $relativePath = $file.FullName.Replace((Resolve-Path $ProjectPath).Path + "\", "")
            $fileContent = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
            
            if ($fileContent) {
                $content += @"
### $relativePath

\`\`\`$(if ($pattern -match '\.json$') { 'json' } elseif ($pattern -match '\.(ts|tsx|js|jsx)$') { 'typescript' } else { 'text' })
$($fileContent.Substring(0, [Math]::Min($fileContent.Length, 2000)))
\`\`\`

"@
            }
        }
    }
}

$content += @"
## Estatísticas do Projeto
"@

# Estatísticas
$totalFiles = (Get-ChildItem -Path $ProjectPath -Recurse -File).Count
$totalFolders = (Get-ChildItem -Path $ProjectPath -Recurse -Directory).Count
$totalSize = "{0:N2} MB" -f ((Get-ChildItem -Path $ProjectPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB)

$content += @"
- **Total de Arquivos:** $totalFiles
- **Total de Pastas:** $totalFolders
- **Tamanho Total:** $totalSize
"@

# Salva o arquivo
$content | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "Documentação gerada em: $OutputFile" -ForegroundColor Green
