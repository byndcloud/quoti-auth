/**
 * Checks if a given HTTP status code indicates an error.
 *
 * This function determines if the provided status code falls within the
 * range typically associated with client (4xx) or server (5xx) error responses,
 * thus identifying whether the status code represents an error.
 *
 * @param {number} statusCode - The HTTP status code to be evaluated.
 * @returns {boolean} Returns `true` if the status code is an error code (between 400 and 599 inclusive); otherwise, returns `false`.
 */
export function isErrorStatusCode (statusCode) {
  if (typeof statusCode !== 'number') {
    return false
  }

  return statusCode >= 400 && statusCode < 600
}
