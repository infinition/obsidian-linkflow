<div align="center">
<img src=".github/obsidian-linkflow.png" alt="obsidian-linkflow icon" width="336" height="335" />
</div>

# LinkFlow for Obsidian

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white) [![Release](https://img.shields.io/github/v/release/infinition/obsidian-linkflow?style=flat)](https://github.com/infinition/obsidian-linkflow/releases) [![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md/plugins?id=linkflow) [![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/infinition)

A visual link manager for Obsidian. Point it at a note that holds your saved URLs, and it turns every link into a card with automatically scraped title, description, image, favicon, and reading status.

Designed to work with Obsidian Web Clipper: clip a page, the link lands in your inbox note, LinkFlow picks it up and adds it to the dashboard automatically.

---

## Features

- Auto-detection of URLs in a configured target note.
- Metadata scraping: title, description, cover image, favicon.
- Card gallery with filters (status, tags, search).
- Reading statuses: Unread, Reading, Done, Archived.
- Manual link addition from the dashboard.
- Works with any note that holds plain URLs or Markdown links.

---

## Setup

1. Install and enable **LinkFlow** in Community Plugins.
2. Open Settings and set the **Target File Path** (the note that acts as your inbox).
3. Paste URLs into that note, or use Obsidian Web Clipper to clip pages into it.
4. Open the dashboard: click the grid icon in the left ribbon, or run `LinkFlow: Open Dashboard` from the Command Palette.

---

## Development

```bash
git clone https://github.com/infinition/obsidian-linkflow.git
npm install
npm run dev    # watch mode
npm run build  # production
```

---

## Star History

<a href="https://www.star-history.com/?repos=infinition%2Fobsidian-linkflow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=infinition/obsidian-linkflow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=infinition/obsidian-linkflow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=infinition/obsidian-linkflow&type=date&legend=top-left" />
 </picture>
</a>

---

## License

MIT. See [LICENSE](LICENSE).
