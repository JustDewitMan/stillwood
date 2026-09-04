# Stillwood

A calm 2D gather-and-craft game inspired by RuneScape — tap trees to chop, bank your wood, mine ore, smith gear, and auto-battle.

## Play on your phone

**https://justdewitman.github.io/stillwood/**

Enable GitHub Pages once (required for the URL above):
1. Open [Settings → Pages](https://github.com/JustDewitMan/stillwood/settings/pages)
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Open the [Actions tab](https://github.com/JustDewitMan/stillwood/actions) and re-run the latest **Deploy to GitHub Pages** workflow

On iPhone/Android: open the URL → Share → **Add to Home Screen** for a fullscreen app feel.

## Controls

- **Tap ground** — walk there
- **Tap tree/rock** — walk over and gather until your bag is full
- **Tap bank** — deposit inventory
- **Tap furnace/anvil** — smelt ore / smith bars into tools
- **Tap enemy** — auto-battle
- **Bag / Skills / Smelt / Smith / Stop** — bottom HUD shortcuts

## Local development

```bash
npm install
npm run dev
```

## Architecture (extensible)

Data-driven catalogs for items, skills, resources, enemies, and recipes. Systems for pathfinding, gathering, combat, inventory/bank, and local saves — designed so new skills and tool tiers are mostly data additions.
