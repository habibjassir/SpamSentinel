// @ts-check
// Permission policy for the built manifest (see README, "Permissions"): only `storage`,
// and host access only to YouTube. Pure function so it can be unit tested.

const ALLOWED_PERMISSIONS = new Set(['storage']);
const YOUTUBE_PATTERN = /^(https|\*):\/\/(www\.)?youtube\.com\/.*$/;

/**
 * @param {Record<string, any>} manifest
 * @returns {string[]} list of policy violations; empty when the manifest is acceptable
 */
export function checkManifest(manifest) {
  /** @type {string[]} */
  const errors = [];

  if (manifest.manifest_version !== 3) {
    errors.push(`Expected Manifest V3, got manifest_version ${manifest.manifest_version}`);
  }

  for (const permission of manifest.permissions ?? []) {
    if (!ALLOWED_PERMISSIONS.has(permission)) {
      errors.push(`Permission not allowed: ${permission}`);
    }
  }

  for (const permission of manifest.optional_permissions ?? []) {
    errors.push(`Optional permission not allowed: ${permission}`);
  }

  const hostPatterns = [
    ...(manifest.host_permissions ?? []),
    ...(manifest.optional_host_permissions ?? []),
    ...(manifest.content_scripts ?? []).flatMap((/** @type {any} */ cs) => cs.matches ?? []),
  ];
  for (const pattern of hostPatterns) {
    if (!YOUTUBE_PATTERN.test(pattern)) {
      errors.push(`Host access outside YouTube: ${pattern}`);
    }
  }

  return errors;
}
