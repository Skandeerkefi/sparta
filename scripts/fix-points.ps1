$file = "c:\Users\skand\OneDrive\Desktop\dev\spartaTournement\sparta\src\pages\TournamentPage.tsx"
$content = Get-Content -Path $file -Raw

# Remove setPointsBalance line
$content = $content -replace '        setPointsBalance\(typeof pointsData\?\.balance === "number" \? pointsData\.balance : null\);\s*\n', ''

# Remove async block after winning
$content = $content -replace '    \(async \(\) => \{\s+try \{\s+const data = await pointsApi\.getUserPoints\(user\.id, token\);\s+const balance = typeof data\.balance === .number. \? data\.balance : null;\s+toast\(\{ title: .You won!., description: balance !== null \? `Your points balance: \$\{balance\}` : ''You won[^`]*check your points.''\} \);\s+\} catch \(err\) \{\s+console\.error\(.Failed to refresh points after win., err\);\s+\}\s+\}\)\(\);', ''

# Text replacements
$content = $content -replace 'Non-players can bet up to 500 points', 'Non-players can bet up to 500'
$content = $content -replace '\{myBet\.stake\} points', '{myBet.stake}'
$content = $content -replace '\{myBet\.potentialPayout\} points', '{myBet.potentialPayout}'
$content = $content -replace "placeholder='1-500 points'", "placeholder='1-500'"
$content = $content -replace 'Set starting and ending balance to settle profit points manually', 'Set starting and ending balance to settle profit manually'
$content = $content -replace 'Winner \+\{state\.tournament\.winnerBalanceBonusPoints \|\| 0\} points\.', 'Winner +{state.tournament.winnerBalanceBonusPoints || 0} currency.'
$content = $content -replace 'Participants \+\$\{state\.tournament\.participantProfitBonusPoints \|\| 0\} points each', 'Participants +${state.tournament.participantProfitBonusPoints || 0} currency each'
$content = $content -replace 'Total points wagered on each active player', 'Total wagered on each active player'
$content = $content -replace 'points wagered', 'wagered'

Set-Content -Path $file -Value $content -Encoding UTF8
Write-Host "Done"
