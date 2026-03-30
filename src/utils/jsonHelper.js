/**
 * Recursively processes a parsed JSON value so that any object key starting
 * with "_" is treated as "commented out":
 *   - The prefixed key (_foo) is removed.
 *   - The un-prefixed key (foo) is set to null, overriding any existing value.
 *
 * This lets content editors "comment out" a JSON field by simply prefixing
 * the key name with an underscore.
 */
export function stripCommentedFields(value) {
  if (Array.isArray(value)) {
    return value.map(stripCommentedFields)
  }

  if (value !== null && typeof value === 'object') {
    const result = {}

    // First pass: copy non-underscored keys (recursively processed)
    for (const key of Object.keys(value)) {
      if (!key.startsWith('_')) {
        result[key] = stripCommentedFields(value[key])
      }
    }

    // Second pass: for every _key, set the un-prefixed key to null
    for (const key of Object.keys(value)) {
      if (key.startsWith('_')) {
        const realKey = key.slice(1)
        result[realKey] = null
      }
    }

    return result
  }

  return value
}
