import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard that verifies the user has access to the workspace they're trying to run code in.
 * 
 * For MVP, this implements a simple token-based check:
 * - If X-Workspace-Token header matches the workspace ID, access is granted
 * - In production, this should validate against a proper user/workspace database
 * 
 * The guard expects:
 * - Request body to contain `workspaceId`
 * - Or route params to contain `workspaceId`
 */
@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
    private readonly logger = new Logger(WorkspaceAccessGuard.name);

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        // Extract workspace ID from body or params
        const workspaceId =
            (request.body as { workspaceId?: string })?.workspaceId ||
            request.params.workspaceId;

        if (!workspaceId) {
            // If no workspaceId, skip this guard (let other guards/validators handle it)
            return true;
        }

        // Extract user token/identifier from headers
        const authHeader = request.headers.authorization;
        const workspaceToken = request.headers['x-workspace-token'] as string | undefined;

        // MVP Access Control Logic:
        // 1. If X-Workspace-Token matches workspace ID, allow access
        // 2. If in development mode (no WS_AUTH_TOKEN env), allow all access
        // 3. Otherwise, deny access

        const isDevMode = !process.env.WS_AUTH_TOKEN || process.env.WS_AUTH_TOKEN === 'devtoken';

        if (isDevMode) {
            // In development, log but allow access
            this.logger.debug(
                `[DEV MODE] Workspace access granted for workspace: ${workspaceId}`,
            );
            return true;
        }

        // Production mode: require valid workspace token
        if (workspaceToken && this.validateWorkspaceAccess(workspaceId, workspaceToken)) {
            this.logger.debug(
                `Workspace access granted for workspace: ${workspaceId}`,
            );
            return true;
        }

        // Check if user has a valid auth token (future: verify against user database)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice('Bearer '.length);
            if (await this.verifyUserWorkspaceAccess(workspaceId, token)) {
                return true;
            }
        }

        this.logger.warn(
            `Workspace access denied for workspace: ${workspaceId} - No valid credentials`,
        );
        throw new ForbiddenException(
            `You do not have access to workspace: ${workspaceId}`,
        );
    }

    /**
     * Simple workspace token validation.
     * In production, this would check against a database.
     */
    private validateWorkspaceAccess(
        workspaceId: string,
        workspaceToken: string,
    ): boolean {
        // MVP: Token should be a hash of workspace ID + secret
        // For now, accept if token contains workspace ID
        return workspaceToken.includes(workspaceId);
    }

    /**
     * Verify user has access to workspace via their auth token.
     * In production, this would query a user/workspace relationship database.
     */
    private async verifyUserWorkspaceAccess(
        _workspaceId: string,
        _token: string,
    ): Promise<boolean> {
        // TODO: Implement proper user-workspace access verification
        // For now, return false to require explicit workspace token
        return false;
    }
}
