/**
 * Utilities for persisting and restoring workspace session state across page refreshes
 */

const WORKSPACE_SESSION_PREFIX = 'nebula-workspace:';

export interface WorkspaceSession {
    workspaceId: string;
    openTabIds: string[];
    activeTabId: string | null;
    savedAt: string;
}

/**
 * Store workspace session for restoration after page refresh
 */
export function storeWorkspaceSession(session: WorkspaceSession): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(
            `${WORKSPACE_SESSION_PREFIX}${session.workspaceId}`,
            JSON.stringify(session)
        );
    } catch (error) {
        console.error('Failed to store workspace session', error);
    }
}

/**
 * Retrieve stored workspace session
 */
export function getWorkspaceSession(workspaceId: string): WorkspaceSession | null {
    if (typeof window === 'undefined') return null;

    try {
        const data = localStorage.getItem(`${WORKSPACE_SESSION_PREFIX}${workspaceId}`);
        if (!data) return null;

        return JSON.parse(data) as WorkspaceSession;
    } catch (error) {
        console.error('Failed to retrieve workspace session', error);
        return null;
    }
}

/**
 * Clear workspace session
 */
export function clearWorkspaceSession(workspaceId: string): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(`${WORKSPACE_SESSION_PREFIX}${workspaceId}`);
    } catch (error) {
        console.error('Failed to clear workspace session', error);
    }
}

/**
 * Update just the open tabs without changing activeTabId
 */
export function updateOpenTabs(workspaceId: string, openTabIds: string[]): void {
    if (typeof window === 'undefined') return;

    try {
        const session = getWorkspaceSession(workspaceId);
        if (session) {
            session.openTabIds = openTabIds;
            session.savedAt = new Date().toISOString();
            storeWorkspaceSession(session);
        }
    } catch (error) {
        console.error('Failed to update open tabs', error);
    }
}

/**
 * Update active tab selection
 */
export function updateActiveTab(workspaceId: string, activeTabId: string | null): void {
    if (typeof window === 'undefined') return;

    try {
        const session = getWorkspaceSession(workspaceId);
        if (session) {
            session.activeTabId = activeTabId;
            session.savedAt = new Date().toISOString();
            storeWorkspaceSession(session);
        } else {
            // Create new session if none exists
            storeWorkspaceSession({
                workspaceId,
                openTabIds: activeTabId ? [activeTabId] : [],
                activeTabId,
                savedAt: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error('Failed to update active tab', error);
    }
}
