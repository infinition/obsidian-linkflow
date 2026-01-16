import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, TFile, Notice, normalizePath } from 'obsidian';
import { LinkFlowView, VIEW_TYPE_LINKFLOW } from './src/view';
import { DEFAULT_SETTINGS, LinkData, LinkFlowSettings } from './src/types';
import { scrapeUrl } from './src/scraper';
import { t, setLanguage } from './src/i18n';

export default class LinkFlowPlugin extends Plugin {
    settings: LinkFlowSettings;
    links: Record<string, LinkData> = {};

    async onload() {
        console.log(t("log_init"));
        await this.loadPluginData();
        setLanguage(this.settings.language);

        this.registerView(
            VIEW_TYPE_LINKFLOW,
            (leaf) => new LinkFlowView(leaf, this)
        );

        // Enregistrer le processeur de bloc personnalisé
        this.registerMarkdownCodeBlockProcessor("linkflow", (source, el, ctx) => {
            this.renderLinkFlowBlock(source, el);
        });

        this.addRibbonIcon('layout-grid', t("ribbon_icon_title"), () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-linkflow-dashboard',
            name: t("command_open_dashboard"),
            callback: () => this.activateView(),
        });

        this.registerEvent(
            this.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.path === this.settings.targetFilePath) {
                    await this.processInboxFile(file);
                }
            })
        );

        this.addSettingTab(new LinkFlowSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(async () => {
            const file = this.app.vault.getAbstractFileByPath(this.settings.targetFilePath);
            if (file instanceof TFile) {
                await this.processInboxFile(file);
                console.log(`LinkFlow: Initial load complete. ${Object.keys(this.links).length} links loaded.`);
                this.triggerRefresh();
            } else {
                console.warn("LinkFlow: Target file not found on startup:", this.settings.targetFilePath);
            }
        });

        console.log(t("log_ready"));
    }

    async loadPluginData() {
        try {
            const saved = await this.loadData();
            this.settings = Object.assign({}, DEFAULT_SETTINGS, saved?.settings);
        } catch (e) {
            this.settings = DEFAULT_SETTINGS;
        }
    }

    async savePluginData() {
        await this.saveData({
            settings: this.settings
        });
    }

    renderLinkFlowBlock(source: string, el: HTMLElement) {
        let links: LinkData[] = [];
        try {
            links = JSON.parse(source);
        } catch (e) {
            el.createEl("pre", { text: t("error_json_corrupted") });
            return;
        }

        if (links.length === 0) {
            el.createEl("p", { text: t("no_links_recorded"), cls: "linkflow-empty-msg" });
            return;
        }

        const container = el.createDiv({ cls: "linkflow-rendered-container" });
        const table = container.createEl("table", { cls: "linkflow-table" });
        const thead = table.createEl("thead");
        const headerRow = thead.createEl("tr");
        [
            t("table_image"),
            t("table_title"),
            t("table_description"),
            t("table_status"),
            t("table_site"),
            t("table_date")
        ].forEach(h => {
            headerRow.createEl("th", { text: h });
        });

        const tbody = table.createEl("tbody");
        links.forEach(link => {
            const row = tbody.createEl("tr");

            // Image
            const imgCell = row.createEl("td");
            if (link.image) {
                const img = imgCell.createEl("img", { cls: "linkflow-table-img" });
                img.src = link.image;
            } else {
                const placeholder = imgCell.createDiv({ cls: "linkflow-table-img no-image-table" });
                placeholder.setText((link.siteName || link.title || "?").charAt(0).toUpperCase());
            }

            // Titre
            const titleCell = row.createEl("td");
            titleCell.createEl("a", {
                text: link.title || link.url,
                href: link.url,
                cls: "external-link"
            });

            // Description
            row.createEl("td", { text: link.description || "", cls: "linkflow-table-desc" });

            // Status
            const statusCell = row.createEl("td");
            statusCell.createEl("span", {
                text: link.status === "read" ? t("status_read") : t("status_unread"),
                cls: `linkflow-badge ${link.status}`
            });

            // Site
            row.createEl("td", { text: link.siteName || "", cls: "linkflow-table-site" });

            // Date
            const dateStr = link.dateAdded ? new Date(link.dateAdded).toLocaleDateString() : "";
            row.createEl("td", { text: dateStr, cls: "linkflow-table-date" });
        });
    }

    triggerRefresh() {
        this.app.workspace.trigger('linkflow:refresh');
    }

    async processInboxFile(file: TFile) {
        let content = await this.app.vault.read(file);
        let modified = false;

        // 1. S'assurer que le bloc LinkFlow existe
        if (!content.includes('```linkflow')) {
            const block = [
                t("inbox_header"),
                '',
                '```linkflow',
                '[]',
                '```',
                '',
                '---',
                ''
            ].join('\n');
            content = block + content;
            modified = true;
        }

        // 2. Extraire les données du bloc
        const startTag = '```linkflow';
        const endTag = '```';
        const startIndex = content.indexOf(startTag);
        let linksArray: LinkData[] = [];

        if (startIndex !== -1) {
            const contentStart = content.indexOf('\n', startIndex) + 1;
            const endIndex = content.indexOf(endTag, contentStart);
            if (endIndex !== -1) {
                const blockContent = content.substring(contentStart, endIndex).trim();
                if (blockContent && blockContent !== '[]') {
                    try {
                        linksArray = JSON.parse(blockContent);
                    } catch (e) {
                        console.error("LinkFlow: Erreur de parsing JSON", e);
                    }
                }
            }
        }

        this.links = {};
        linksArray.forEach(l => this.links[l.url] = l);
        console.log(`LinkFlow: ${linksArray.length} links parsed from file.`);

        // 3. Trouver les URLs brutes HORS du bloc
        const blockStart = content.indexOf('```linkflow');
        const blockEnd = content.indexOf('```', blockStart + 1) + 3;

        const bodyBefore = content.substring(0, blockStart);
        const bodyAfter = content.substring(blockEnd);

        const urlRegex = /(https?:\/\/[^\s\)\(]+)/g;
        const matchesBefore = bodyBefore.match(urlRegex) || [];
        const matchesAfter = bodyAfter.match(urlRegex) || [];
        const allMatches = [...matchesBefore, ...matchesAfter];

        let newBodyBefore = bodyBefore;
        let newBodyAfter = bodyAfter;

        for (const url of allMatches) {
            if (this.links[url]) {
                newBodyBefore = newBodyBefore.replace(url, "");
                newBodyAfter = newBodyAfter.replace(url, "");
                modified = true;
                continue;
            }

            new Notice(t("notice_analyzing", { url }));
            const metadata = await scrapeUrl(url).catch(() => null);

            if (metadata) {
                const link: LinkData = {
                    url,
                    title: metadata.title || url,
                    description: metadata.description || "",
                    image: metadata.image || "",
                    favicon: metadata.favicon || "",
                    siteName: metadata.siteName || "",
                    isVideo: metadata.isVideo || false,
                    dateAdded: Date.now(),
                    status: 'unread',
                    archived: false
                };
                linksArray.push(link);
                this.links[url] = link;

                newBodyBefore = newBodyBefore.replace(url, "");
                newBodyAfter = newBodyAfter.replace(url, "");
                modified = true;
            }
        }

        // Nettoyage des anciens formats DataviewJS si présents
        if (content.includes('```dataviewjs')) {
            const dvjsRegex = /```dataviewjs[\s\S]*?```/g;
            content = content.replace(dvjsRegex, "");
            modified = true;
        }

        if (modified) {
            const newContent = newBodyBefore + "```linkflow\n" + JSON.stringify(linksArray, null, 2) + "\n```" + newBodyAfter;
            await this.app.vault.modify(file, newContent);
            new Notice(t("notice_sync"));
            this.triggerRefresh();
        }
    }

    async updateLinkInFile(url: string, updatedLink: LinkData) {
        const file = this.app.vault.getAbstractFileByPath(this.settings.targetFilePath);
        if (file instanceof TFile) {
            let content = await this.app.vault.read(file);
            const startTag = '```linkflow';
            const endTag = '```';
            const startIndex = content.indexOf(startTag);

            if (startIndex !== -1) {
                const contentStart = content.indexOf('\n', startIndex) + 1;
                const endIndex = content.indexOf(endTag, contentStart);
                if (endIndex !== -1) {
                    const blockContent = content.substring(contentStart, endIndex).trim();
                    let linksArray: LinkData[] = [];
                    try {
                        linksArray = JSON.parse(blockContent || '[]');
                        const index = linksArray.findIndex(l => l.url === url);
                        if (index !== -1) {
                            linksArray[index] = updatedLink;
                            const newBlock = "```linkflow\n" + JSON.stringify(linksArray, null, 2) + "\n```";
                            const oldBlock = content.substring(startIndex, endIndex + 3);
                            content = content.replace(oldBlock, newBlock);
                            await this.app.vault.modify(file, content);
                            this.links[url] = updatedLink;
                            this.triggerRefresh();
                        }
                    } catch (e) {
                        console.error("LinkFlow: Error updating link", e);
                    }
                }
            }
        }
    }

    async removeLinksFromFile(urls: string[]) {
        const file = this.app.vault.getAbstractFileByPath(this.settings.targetFilePath);
        if (file instanceof TFile) {
            let content = await this.app.vault.read(file);
            const startTag = '```linkflow';
            const endTag = '```';
            const startIndex = content.indexOf(startTag);

            if (startIndex !== -1) {
                const contentStart = content.indexOf('\n', startIndex) + 1;
                const endIndex = content.indexOf(endTag, contentStart);
                if (endIndex !== -1) {
                    const blockContent = content.substring(contentStart, endIndex).trim();
                    let linksArray: LinkData[] = [];
                    try {
                        linksArray = JSON.parse(blockContent || '[]');
                        linksArray = linksArray.filter(l => !urls.includes(l.url));
                        const newBlock = "```linkflow\n" + JSON.stringify(linksArray, null, 2) + "\n```";
                        const oldBlock = content.substring(startIndex, endIndex + 3);
                        content = content.replace(oldBlock, newBlock);
                        await this.app.vault.modify(file, content);
                        urls.forEach(url => delete this.links[url]);
                        this.triggerRefresh();
                    } catch (e) {
                        console.error("LinkFlow: Error removing links", e);
                    }
                }
            }
        }
    }

    async addLinkManually(url: string) {
        const file = this.app.vault.getAbstractFileByPath(this.settings.targetFilePath);
        if (file instanceof TFile) {
            let content = await this.app.vault.read(file);
            if (content.length > 0 && !content.endsWith('\n')) {
                content += '\n';
            }
            await this.app.vault.modify(file, content + url);
        }
    }

    async activateView() {
        const { workspace } = this.app;
        workspace.detachLeavesOfType(VIEW_TYPE_LINKFLOW);
        const leaf = workspace.getLeaf('tab');
        await leaf.setViewState({
            type: VIEW_TYPE_LINKFLOW,
            active: true,
        });
        workspace.revealLeaf(leaf);
    }
}

class LinkFlowSettingTab extends PluginSettingTab {
    plugin: LinkFlowPlugin;
    constructor(app: App, plugin: LinkFlowPlugin) { super(app, plugin); this.plugin = plugin; }
    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: t("settings_title") });
        new Setting(containerEl)
            .setName(t("target_file_name"))
            .setDesc(t("target_file_desc"))
            .addText(text => text
                .setPlaceholder(t("target_file_placeholder"))
                .setValue(this.plugin.settings.targetFilePath)
                .onChange(async (value) => {
                    this.plugin.settings.targetFilePath = value;
                    await this.plugin.savePluginData();
                }));

        new Setting(containerEl)
            .setName(t("settings_language_name"))
            .setDesc(t("settings_language_desc"))
            .addDropdown(dropdown => dropdown
                .addOption("auto", t("settings_language_auto"))
                .addOption("en", "English")
                .addOption("fr", "Français")
                .addOption("es", "Español")
                .addOption("de", "Deutsch")
                .addOption("it", "Italiano")
                .setValue(this.plugin.settings.language)
                .onChange(async (value) => {
                    this.plugin.settings.language = value;
                    setLanguage(value);
                    await this.plugin.savePluginData();
                    this.display(); // Refresh to update labels
                }));
    }
}