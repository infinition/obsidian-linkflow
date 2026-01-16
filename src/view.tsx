import * as React from "react";
import { LinkData } from "./types";
import { ItemView, WorkspaceLeaf, Notice, Modal, App, TFile } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import LinkFlowPlugin from "../main";
import { t } from "./i18n";

export const VIEW_TYPE_LINKFLOW = "linkflow-view";

class AddLinkModal extends Modal {
    url: string = "";
    onSubmit: (url: string) => void;

    constructor(app: App, onSubmit: (url: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: t("modal_add_title"), cls: "linkflow-modal-title" });

        const container = contentEl.createDiv({ cls: "linkflow-modal-container" });

        container.createEl("label", { text: t("modal_url_name"), cls: "linkflow-modal-label" });
        container.createEl("p", { text: t("modal_url_desc"), cls: "linkflow-modal-desc" });

        const textArea = container.createEl("textarea", {
            cls: "linkflow-modal-textarea",
            placeholder: "https://..."
        });

        textArea.addEventListener("input", () => {
            this.url = textArea.value;
        });

        const btnContainer = contentEl.createDiv({ cls: "linkflow-modal-buttons" });
        const addBtn = btnContainer.createEl("button", {
            text: t("modal_add_btn"),
            cls: "mod-cta"
        });

        addBtn.onclick = () => {
            const urlRegex = /(https?:\/\/[^\s\)\(]+)/g;
            const matches = this.url.match(urlRegex);
            if (matches && matches.length > 0) {
                this.close();
                this.onSubmit(matches.join('\n'));
            } else {
                new Notice(t("notice_no_links_found"));
            }
        };

        // Focus the textarea with a small delay to ensure modal is fully rendered
        setTimeout(() => {
            textArea.focus();
            // Force cursor to end if there's already text (though it's empty here)
            textArea.setSelectionRange(textArea.value.length, textArea.value.length);
        }, 150);
    }

    onClose() {
        this.contentEl.empty();
    }
}

const LinkDashboard = ({ plugin }: { plugin: LinkFlowPlugin }) => {
    const [links, setLinks] = React.useState<LinkData[]>(Object.values(plugin.links || {}));
    const [filter, setFilter] = React.useState<'all' | 'read' | 'unread' | 'archived'>('unread');
    const [search, setSearch] = React.useState("");
    const [sort, setSort] = React.useState<'newest' | 'oldest' | 'title' | 'site'>('newest');
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
    const [isLoading, setIsLoading] = React.useState(false);

    const [isEditMode, setIsEditMode] = React.useState(false);
    const [selectedUrls, setSelectedUrls] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        const updateLinks = () => { setLinks(Object.values(plugin.links || {})); };
        plugin.app.workspace.on('linkflow:refresh' as any, updateLinks);
        // Initial load in case it was already populated
        updateLinks();
        return () => plugin.app.workspace.off('linkflow:refresh' as any, updateLinks);
    }, [plugin]);

    const toggleStatus = async (url: string) => {
        const link = plugin.links[url];
        if (link) {
            link.status = link.status === 'unread' ? 'read' : 'unread';
            await plugin.updateLinkInFile(url, link);
            setLinks([...Object.values(plugin.links)]);
        }
    };

    const markAsRead = async (url: string) => {
        const link = plugin.links[url];
        if (link && link.status === 'unread') {
            link.status = 'read';
            await plugin.updateLinkInFile(url, link);
            setLinks([...Object.values(plugin.links)]);
        }
    };

    const handleOpenLink = (url: string) => {
        if (!isEditMode) {
            window.open(url, '_blank');
            markAsRead(url);
        }
    };

    const toggleArchive = async (url: string) => {
        const link = plugin.links[url];
        if (link) {
            link.archived = !link.archived;
            await plugin.updateLinkInFile(url, link);
            setLinks([...Object.values(plugin.links)]);
        }
    };

    const deleteLink = async (url: string) => {
        if (confirm(t("confirm_delete_single"))) {
            await plugin.removeLinksFromFile([url]);
            setLinks([...Object.values(plugin.links)]);
            new Notice(t("notice_deleted"));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUrls.size === 0) return;
        if (confirm(t("confirm_delete_bulk", { count: selectedUrls.size.toString() }))) {
            const urlsToDelete = Array.from(selectedUrls);
            await plugin.removeLinksFromFile(urlsToDelete);
            setSelectedUrls(new Set());
            setIsEditMode(false);
            setLinks([...Object.values(plugin.links)]);
            new Notice(t("notice_bulk_deleted", { count: selectedUrls.size.toString() }));
        }
    };

    const toggleSelection = (url: string) => {
        const newSelected = new Set(selectedUrls);
        if (newSelected.has(url)) newSelected.delete(url);
        else newSelected.add(url);
        setSelectedUrls(newSelected);
    };

    const handleSelectAll = (visibleLinks: LinkData[]) => {
        if (selectedUrls.size === visibleLinks.length) {
            setSelectedUrls(new Set());
        } else {
            setSelectedUrls(new Set(visibleLinks.map(l => l.url)));
        }
    };

    const handleAddLink = () => {
        new AddLinkModal(plugin.app, async (url) => {
            setIsLoading(true);
            await plugin.addLinkManually(url);
            setIsLoading(false);
            setLinks([...Object.values(plugin.links)]);
        }).open();
    };

    const handleRefresh = async () => {
        const file = plugin.app.vault.getAbstractFileByPath(plugin.settings.targetFilePath);
        if (file instanceof TFile) {
            await plugin.processInboxFile(file);
            setLinks([...Object.values(plugin.links)]);
            new Notice(t("notice_refreshed"));
        }
    };

    // Filtrage et Tri
    const displayLinks = links
        .filter(l => {
            if (filter === 'archived') return l.archived;
            if (filter === 'all') return !l.archived;
            if (l.archived) return false;
            if (filter === 'read') return l.status === 'read';
            if (filter === 'unread') return l.status === 'unread';
            return true;
        })
        .filter(l => {
            const query = search.toLowerCase();
            return (l.title || "").toLowerCase().includes(query) ||
                (l.description || "").toLowerCase().includes(query) ||
                (l.siteName || "").toLowerCase().includes(query) ||
                (l.url || "").toLowerCase().includes(query);
        })
        .sort((a, b) => {
            if (sort === 'newest') return (b.dateAdded || 0) - (a.dateAdded || 0);
            if (sort === 'oldest') return (a.dateAdded || 0) - (b.dateAdded || 0);
            if (sort === 'title') return (a.title || a.url || "").localeCompare(b.title || b.url || "");
            if (sort === 'site') return (a.siteName || "").localeCompare(b.siteName || "");
            return 0;
        });

    const getHostname = (url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return t("hostname_default");
        }
    };

    return (
        <div className="linkflow-container">
            <div className="linkflow-header">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder={t("search_placeholder_dashboard")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="controls">
                    <div className="filter-group">
                        <button className={`filter-btn ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}>{t("filter_all")}</button>
                        <button className={`filter-btn ${filter === 'unread' ? 'is-active' : ''}`} onClick={() => setFilter('unread')}>{t("filter_unread")}</button>
                        <button className={`filter-btn ${filter === 'read' ? 'is-active' : ''}`} onClick={() => setFilter('read')}>{t("filter_read")}</button>
                        <button className={`filter-btn ${filter === 'archived' ? 'is-active' : ''}`} onClick={() => setFilter('archived')}>{t("filter_archives")}</button>
                    </div>
                    <div className="action-group">
                        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as any)}>
                            <option value="newest">{t("sort_newest")}</option>
                            <option value="oldest">{t("sort_oldest")}</option>
                            <option value="title">{t("sort_title_az")}</option>
                            <option value="site">{t("sort_site")}</option>
                        </select>
                        <button className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title={t("tooltip_grid")}>🔳</button>
                        <button className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title={t("tooltip_list")}>☰</button>
                        <button className="icon-btn" onClick={handleRefresh} title={t("tooltip_refresh")}>🔄</button>
                        <button className={`icon-btn ${isEditMode ? 'active' : ''}`} onClick={() => { setIsEditMode(!isEditMode); setSelectedUrls(new Set()); }} title={t("tooltip_edit")}>✏️</button>
                        <button className="icon-btn add-btn" onClick={handleAddLink} title={t("tooltip_add")} style={{ background: 'var(--lf-accent)', color: 'white' }}>➕</button>
                    </div>
                </div>
            </div>

            {isEditMode && (
                <div className="edit-toolbar">
                    <span>{t("edit_selected_count", { count: selectedUrls.size.toString() })}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleSelectAll(displayLinks)}>{t("select_all")}</button>
                        <button onClick={handleBulkDelete} style={{ background: 'var(--text-error)' }}>{t("delete")}</button>
                        <button onClick={() => setIsEditMode(false)}>{t("edit_cancel")}</button>
                    </div>
                </div>
            )}

            <div className={`linkflow-grid mode-${viewMode}`}>
                {isLoading ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="link-card skeleton"></div>)
                ) : displayLinks.length === 0 ? (
                    <div className="empty-state">
                        <h2>{t("empty_no_links")}</h2>
                        <p>{search ? t("empty_no_results") : t("empty_add_to_start")}</p>
                    </div>
                ) : (
                    displayLinks.map((link) => (
                        <div
                            key={link.url}
                            className={`link-card ${selectedUrls.has(link.url) ? 'is-selected' : ''}`}
                            onClick={() => isEditMode && toggleSelection(link.url)}
                        >
                            <div className="card-image-container" onClick={() => handleOpenLink(link.url)}>
                                {link.image ? <img src={link.image} alt="" loading="lazy" /> : <div className="no-image">{link.siteName || getHostname(link.url)}</div>}
                                {!isEditMode && <div className="card-overlay"><span className="open-hint">{t("overlay_open")}</span></div>}
                            </div>
                            <div className="card-content">
                                <div className="card-meta">
                                    {link.favicon && <img src={link.favicon} className="favicon" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                                    <span className="site-name">{link.siteName || getHostname(link.url)}</span>
                                </div>
                                <h3 onClick={() => handleOpenLink(link.url)} style={{ cursor: 'pointer' }}>{link.title || link.url}</h3>
                                {link.description && <p className="card-desc">{link.description}</p>}
                                {!isEditMode && (
                                    <div className="card-actions">
                                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(link.url); new Notice(t("notice_copied")); }}>📋</button>
                                        <button onClick={(e) => { e.stopPropagation(); toggleStatus(link.url); }}>{link.status === 'unread' ? '○' : '●'}</button>
                                        <button onClick={(e) => { e.stopPropagation(); toggleArchive(link.url); }}>{link.archived ? '📥' : '📦'}</button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteLink(link.url); }} className="btn-delete">🗑️</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export class LinkFlowView extends ItemView {
    plugin: LinkFlowPlugin;
    root: Root | null = null;
    constructor(leaf: WorkspaceLeaf, plugin: LinkFlowPlugin) { super(leaf); this.plugin = plugin; }
    getViewType() { return VIEW_TYPE_LINKFLOW; }
    getDisplayText() { return t("dashboard_title"); }
    getIcon() { return "layout-grid"; }
    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        this.root = createRoot(container);
        this.root.render(<LinkDashboard plugin={this.plugin} />);
    }
    async onClose() { this.root?.unmount(); }
}