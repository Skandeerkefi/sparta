with open(r"c:\Users\skand\OneDrive\Desktop\dev\spartaTournement\sparta\src\components\Navbar.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip_block = False
skip_count = 0

for i, line in enumerate(lines):
    # Skip Coins import
    if "\tCoins," in line:
        continue
    # Skip History import
    if "\tHistory," in line:
        continue
    # Skip loadBalance useEffect block
    if "let mounted = true;" in line:
        skip_block = True
        skip_count = 0
        continue
    if skip_block:
        skip_count += 1
        if skip_count >= 18:  # The useEffect block is about 18 lines
            skip_block = False
        continue
    # Skip pointsBalance display lines in header
    if "typeof pointsBalance === 'number' && (" in line:
        skip_count = 0
        continue
    if skip_count > 0 and skip_count < 5:
        skip_count += 1
        continue
    if "{pointsBalance} pts" in line:
        continue
    # Skip pointsBalance display in mobile menu
    if "user && typeof pointsBalance === 'number' && (" in line:
        skip_count = 0
        continue
    new_lines.append(line)

with open(r"c:\Users\skand\OneDrive\Desktop\dev\spartaTournement\sparta\src\components\Navbar.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Done")
