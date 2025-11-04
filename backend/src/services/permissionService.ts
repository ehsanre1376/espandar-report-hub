import { permissionsConfig } from '../config/permissions.config';

export interface UserIdentity {
  username: string;
  email: string;
  displayName?: string;
  groups?: string[];
}

interface CacheEntry {
  reportIds: string[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export class PermissionService {
  private getCacheKey(user: UserIdentity): string {
    return user.email || user.username;
  }

  computeAllowedReportIds(groups: string[] = []): string[] {
    const { groupToReportIds } = permissionsConfig;
    const allowed = new Set<string>();

    groups.forEach(group => {
      const ids = groupToReportIds.get(group);
      if (ids) ids.forEach(id => allowed.add(id));
    });

    return Array.from(allowed);
  }

  getAllowedReportIds(user: UserIdentity): string[] {
    const key = this.getCacheKey(user);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.reportIds;
    }

    const reportIds = this.computeAllowedReportIds(user.groups || []);
    const ttlMs = (permissionsConfig.ttlSeconds || 600) * 1000;
    cache.set(key, { reportIds, expiresAt: now + ttlMs });
    return reportIds;
  }
}

export const permissionService = new PermissionService();


