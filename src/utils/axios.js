const qs = require('qs')
const https = require('https')
const Axios = require('axios').default
const timeout15Min = 15 * 60 * 1000

function fixConfig (config) {
  if (Axios.defaults.agent === config.agent) {
    delete config.agent
  }
  if (Axios.defaults.httpAgent === config.httpAgent) {
    delete config.httpAgent
  }
  if (Axios.defaults.httpsAgent === config.httpsAgent) {
    delete config.httpsAgent
  }

  delete config.maxContentLength
  delete config.maxBodyLength
}

function axiosRetryInterceptor (axiosInstance) {
  return function (err) {
    const config = err.config
    // If config does not exist or the retry option is not set, reject
    if (!config?.retry) {
      return Promise.reject(err)
    }
    // Set the variable for keeping track of the retry count
    config.__retryCount = config.__retryCount || 0

    // Check if we've maxed out the total number of retries
    if (config.__retryCount >= config.retry) {
    // Reject with the error
      return Promise.reject(err)
    }

    // Increase the retry count
    config.__retryCount += 1
    const defaultDelay = 2000 // 2s

    // Create new promise to handle exponential backoff
    return new Promise(function (resolve) {
      setTimeout(function () {
        fixConfig(config)

        resolve(axiosInstance.request(config))
      }, config.retryDelay || defaultDelay)
    })
  }
}

const QuotiApi = Axios.create({
  timeout: timeout15Min,
  keepAlive: true,
  timeoutErrorMessage: 'QuotiTimeoutError',
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    timeout: timeout15Min,
    keepAlive: true
  }),
  paramsSerializer: params => {
    return qs.stringify(params, { encodeValuesOnly: true })
  }
})

QuotiApi.interceptors.response.use(undefined, axiosRetryInterceptor(QuotiApi))

module.exports = QuotiApi
