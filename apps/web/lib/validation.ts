/**
 * Input validation utilities for security.
 * Use these to sanitize and validate all user inputs.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: unknown): value is string {
    return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

export function validateUUID(value: unknown, paramName: string): string {
    if (!isValidUUID(value)) {
        throw new Error(`Invalid ${paramName}: must be a valid UUID`);
    }
    return (value as string).trim();
}

export const LIMITS = {
    MESSAGE_CONTENT_MAX: 10000,
    KNOWLEDGE_SOURCE_NAME_MAX: 200,
    KNOWLEDGE_SOURCE_CONTENT_MAX: 2_000_000,
    CONVERSATION_TITLE_MAX: 200,
} as const;
