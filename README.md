<div align="center">
  <img width="200" height="200" alt="LinkFlow Logo" src="https://github.com/user-attachments/assets/2c58fa68-1e51-4877-8e8a-f4ad3f63b259" />

  # LinkFlow for Obsidian
  
  **A visual, all-in-one link manager for Obsidian.**
  
  Centralize your web links in a single note, and LinkFlow transforms them into a stunning gallery of cards with automatic metadata scraping, powerful filters, and reading statuses.
</div>

---

## 🔥 Built for Obsidian Web Clipper (Recommended Workflow)

LinkFlow is designed to work perfectly with **Obsidian Web Clipper**:

- You configure **Obsidian Web Clipper** to save captured pages as **links in a user-defined README / template note** (your personal “inbox” note).
- LinkFlow then **automatically detects**, **parses**, and **processes** these incoming links.
- Result: every clipped link becomes a **dynamic card** in LinkFlow’s dashboard, with metadata, preview image, favicon, and status tracking.

This creates an ultra-fast “Clip → Auto-organize → Browse visually” workflow.

---

## ⚠️ IMPORTANT: REQUIRED SETUP

**LinkFlow requires a specific Markdown file to function.** Before using the plugin, you must define where your links will be stored:

1. Go to **Settings** > **LinkFlow**
2. Locate the **Target File Path** option
3. Select or type the path of the `.md` file you want to use (e.g., `Inbox/Links.md` or `Resources/ReadLater.md`)

> **Note:** If you do not select a target file, the plugin will not know where to save/read your links and the dashboard may appear empty.

---

## ✨ Key Features

- 📸 **Automatic Metadata Scraping**  
  Automatically fetches titles, descriptions, preview images, and favicons from any URL (including YouTube, social media, and news sites).

- 🚀 **Bulk Link Extraction**  
  Paste a block of text containing multiple URLs, and LinkFlow intelligently extracts and processes all of them at once.

- 🎨 **Premium Dashboard UI**  
  A beautiful, responsive interface with two view modes:
  - **Grid Mode**: Perfect for visual browsing with large preview cards.
  - **List Mode**: Ideal for quick scanning and mobile use.

- 🌍 **Multi-language Support**  
  Fully localized in 5 languages: English, French, Spanish, German, and Italian.

- 📂 **Markdown-Native Storage**  
  Your data stays in your vault. Links are stored in a simple, human-readable `linkflow` code block within the markdown file of your choice.

- 🔍 **Advanced Filtering & Sorting**
  - **Search** by title, description, or site name
  - **Filter** by status (Unread, Read, All) or Archive
  - **Sort** by Date Added (Newest/Oldest), Title, or Site

- ⚡ **Instant Sync**  
  The dashboard updates in real-time as you add links to your source file or modify them in the UI.

- 📊 **Custom Block Rendering**  
  The `linkflow` code block is rendered as a beautiful, interactive table in Obsidian’s Reading Mode.

---

## 🚀 Getting Started

### 1) Installation
Enable **LinkFlow** in your Obsidian Community Plugins settings.

### 2) Configuration (Crucial Step)
Set your **Target File Path** (this file acts as your database / inbox).

### 3) Add Links (3 ways)
- **Via Obsidian Web Clipper (recommended):** clip pages → links land in your predefined note → LinkFlow ingests automatically.
- **Via the Dashboard:** click the **"+"** button and paste text or URLs directly.
- **Via the Note:** open your target `.md` file and paste URLs anywhere; LinkFlow will detect them.

### 4) Open the Dashboard
- Click the **Grid Icon** in the left ribbon  
- Or use the Command Palette (`Ctrl/Cmd + P`) → `LinkFlow: Open Dashboard`

---

## 🛠️ Development

If you want to contribute or build from source:

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Run in watch mode: `npm run dev`

---

## 📄 License

This project is licensed under the MIT License.

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=infinition/obsidian-linkflow&type=date&legend=top-left)](https://www.star-history.com/#infinition/obsidian-linkflow&type=date&legend=top-left)
