import re
with open(r"c:\Users\skand\OneDrive\Desktop\dev\spartaTournement\sparta\src\components\Navbar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove History and Coins imports
content = content.replace("\tHistory,\n", "")
content = content.replace("\t\tCoins,\n", "")

# Remove points-related admin menu items
content = re.sub(r"\t+\{ path: \"/admin/points-adjust\".*?\},\n", "", content)
content = re.sub(r"\t+\{ path: \"/admin/points-transactions\".*?\},\n", "", content)
content = re.sub(r"\t+\{ path: \"/admin/points-leaderboard\".*?\},\n", "", content)
content = re.sub(r"\t+\{ path: \"/admin/points-config\".*?\},\n", "", content)
content = re.sub(r"\t+\{ path: \"/admin/store\".*?\},\n", "", content)
content = re.sub(r"\t+\{ path: \"/admin/redemptions\".*?\},\n", "", content)
content = re.sub(r"\t+\{ path: \"/points\".*?\},\n", "", content)

# Remove loadBalance useEffect block
content = re.sub(r"\tuseEffect\(\(\) => \{\s+let mounted = true;\s+const loadBalance = async \(\) => \{\s+if \(!user\?\.id \|\| !token\) return setPointsBalance\(null\);\s+try \{\s+const data = await pointsApi\.getUserPoints\(user\.id, token\);\s+if \(mounted\) setPointsBalance\(typeof data\.balance === .number. \? data\.balance : null\);\s+\} catch \(err\) \{\s+console\.error\(.'Failed to load points balance', err\);\s+if \(mounted\) setPointsBalance\(null\);\s+\}\s+\};\s+loadBalance\(\);\s+const id = setInterval\(loadBalance, 60_000\);\s+return \(\) => clearTimeout\(id\);\s+\}, \[\]\);\s+", "", content)

# Remove points balance display in header
content = re.sub(r"\t{14}\{typeof pointsBalance === .number. && \(\s+<span className=.text-xs text-white/50.>\s+<span className=.mr-1.>\x27\x27\{pointsBalance\}\x27\x27 pts</span>\s+</span>\s+\)\}", "", content)

# Remove points balance display in mobile menu
content = re.sub(r"\t{8}\{user && typeof pointsBalance === .number. && \(\s+<span className=.text-xs text-\[#E7AC78\]/70.>\s+\{pointsBalance\} pts\s+</span>\s+\)\}", "", content)

with open(r"c:\Users\skand\OneDrive\Desktop\dev\spartaTournement\sparta\src\components\Navbar.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
