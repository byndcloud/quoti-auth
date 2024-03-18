module.exports.parseAxiosError = function (error) {
  let errorMessage = `Error Message: \n  ${error.message}\n\n`

  if (error?.request) {
    errorMessage += `Request: \n  ${error.request.method.toUpperCase()} ${
      error.request.url
    }\n\n`

    if (error?.request?.data) {
      errorMessage += `Request Data: \n  ${JSON.stringify(
        error.request.data,
        null,
        2
      )}\n\n`
    }
  }

  if (error?.response) {
    errorMessage += `Response: \n  ${error.response.status} ${error.response.statusText}\n\n`

    if (error?.response?.data) {
      errorMessage += `Response Data: \n  ${JSON.stringify(
        error.response.data,
        null,
        2
      )}\n\n`
    }
  }

  return errorMessage
}

module.exports.validateLogLevel = function ({ logger, logLevel } = {}) {
  const validLogLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly']
  if (validLogLevels.indexOf(logLevel) === -1) {
    throw new Error('Invalid errorLogLevel level at QuotiAuth setup')
  }

  const isFunctionOfLogger = logger[logLevel] instanceof Function
  if (!isFunctionOfLogger) {
    throw new Error(
      'Invalid logger/logLevel at QuotiAuth setup because it does not have the errorLogLevel method implemented at logger'
    )
  }
}
