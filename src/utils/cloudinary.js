/**
 * Cloudinary configuration and helpers.
 *
 * Cloud name  : dqcmzcbrp
 * Folder      : dishari/carousel  (carousel images)
 *
 * The carousel uses Cloudinary's client-side Resource List API which returns
 * all images tagged with a given tag.  To enable this:
 *   1. Cloudinary Dashboard → Settings → Security → enable "Resource list"
 *   2. Tag carousel images with the tag "carousel"
 */

export const CLOUD_NAME = 'dqcmzcbrp'

/**
 * Build a Cloudinary delivery URL for a given public_id.
 * @param {string} publicId  – e.g. "dishari/carousel/img1"
 * @param {object} opts
 * @param {number} opts.width   – optional resize width
 * @param {number} opts.quality – optional quality (1-100), default auto
 * @param {string} opts.format  – optional format, default "auto"
 */
export function cloudinaryUrl(publicId, { width, quality, format = 'auto' } = {}) {
  const transforms = ['f_' + format]
  if (quality) transforms.push('q_' + quality)
  else transforms.push('q_auto')

  if (width) transforms.push('w_' + width)

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms.join(',')}/${publicId}`
}

/**
 * Build a URL for a raw (non-image) file stored in Cloudinary.
 * @param {string} publicId – e.g. "dishari/testimonials/testimonials.json"
 */
export function cloudinaryRawUrl(publicId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${publicId}`
}

/**
 * Fetch the list of images tagged with `tag` via Cloudinary's client-side
 * Resource List endpoint.
 *
 * Returns an array of { public_id, version, format, width, height, ... }
 *
 * Requires "Resource list" to be enabled in Cloudinary Security settings.
 */
export async function fetchImagesByTag(tag) {
  const url = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Cloudinary resource list failed (${res.status}). Make sure "Resource list" is enabled in Cloudinary settings.`)
  }
  const data = await res.json()
  return data.resources || []
}
