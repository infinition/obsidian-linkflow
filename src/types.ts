export interface LinkData {
    url: string;
    title: string;
    description: string;
    image: string;
    favicon?: string;
    siteName?: string;
    dateAdded: number;
    status: 'read' | 'unread';
    archived: boolean;
    isVideo: boolean;
}

export interface LinkFlowSettings {
    targetFilePath: string;
    language: string;
}

export interface LinkFlowData {
    settings: LinkFlowSettings;
    links: Record<string, LinkData>;
}

export const DEFAULT_SETTINGS: LinkFlowSettings = {
    targetFilePath: "TOREAD.md",
    language: "auto"
}