import { createHash } from 'crypto';

export function toCategoryKey(displayName: string): string {
    return displayName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // strip accent marks
        .replace(/[^a-zA-Z0-9\s]/g, '')  // strip any remaining non-ascii chars
        .toUpperCase()
        .replace(/\s+/g, '_');
}


export function toCategoryKeyHash(displayName: string): string {
    return createHash('md5')
        .update(displayName.toLowerCase().trim())
        .digest('hex')
        .slice(0, 8) // short enough to be readable
        .toString();
}