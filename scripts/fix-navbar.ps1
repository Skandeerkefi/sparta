$file = "c:\Users\skand\OneDrive\Desktop\dev\spartaTournement\sparta\src\components\Navbar.tsx"
$content = Get-Content -Path $file -Raw

# Remove History and Coins imports
$content = $content -replace '\tHistory,\r?\n', ''
$content = $content -replace '\t\tCoins,\r?\n', ''

# Remove admin menu points items
$content = $content -replace '\t+\{ path: "/admin/points-adjust".*?\},\r?\n', ''
$content = $content -replace '\t+\{ path: "/admin/points-transactions".*?\},\r?\n', ''
$content = $content -replace '\t+\{ path: "/admin/points-leaderboard".*?\},\r?\n', ''
$content = $content -replace '\t+\{ path: "/admin/points-config".*?\},\r?\n', ''
$content = $content -replace '\t+\{ path: "/admin/store".*?\},\r?\n', ''
$content = $content -replace '\t+\{ path: "/admin/redemptions".*?\},\r?\n', ''
$content = $content -replace '\t+\{ path: "/points".*?\},\r?\n', ''

# Remove loadBalance useEffect
$pattern = '\tuseEffect\(\(\) => \{\r?\n\t\tlet mounted = true;\r?\n\t\tconst loadBalance = async \(\) => \{\r?\n\t\t\tif \(!user\?\.id \|\| !token\) return setPointsBalance\(null\);\r?\n\t\t\r?\n\t\ttry \{\r?\n\t\t\tconst data = await pointsApi\.getUserPoints\(user\.id, token\);\r?\n\t\t\tif \(mounted\) setPointsBalance\(typeof data\.balance === .number. \? data\.balance : null\);\r?\n\t\t\} catch \(err\) \{\r?\n\t\t\tconsole\.error\('"'"'Failed to load points balance'"'"', err\);\r?\n\t\t\tif \(mounted\) setPointsBalance\(null\);\r?\n\t\t\}\r?\n\t\t\};\r?\n\r?\n\t\tloadBalance\(\);\r?\n\t\tconst id = setInterval\(loadBalance, 60_000\);\r?\n\t\treturn \(\) => clearTimeout\(id\);\r?\n\t\}, \[\]\);\r?\n'
$content = $content -replace $pattern, ''

# Remove points balance display in header
$content = $content -replace '\t\t\t\t\t\t\t\t\t\t\{typeof pointsBalance === .number. && \(\r?\n\t\t\t\t\t\t\t\t\t\t\t<span className=.text-xs text-white/50.\>\r?\n\t\t\t\t\t\t\t\t\t\t\t\t<span className=.mr-1.\>\x27\x27\{pointsBalance\}\x27\x27 pts</span>\r?\n\t\t\t\t\t\t\t\t\t\t\t</span>\r?\n\t\t\t\t\t\t\t\t\t\t\)\}', ''

# Remove points balance display in mobile menu  
$content = $content -replace '\t\t\t\t\t\t\{user && typeof pointsBalance === .number. && \(\r?\n\t\t\t\t\t\t\t<span className=.text-xs text-\[#E7AC78\]/70.\>\r?\n\t\t\t\t\t\t\t\t\{pointsBalance\} pts\r?\n\t\t\t\t\t\t\t</span>\r?\n\t\t\t\t\t\t\)\}', ''

Set-Content -Path $file -Value $content -Encoding UTF8
Write-Host "Done"
