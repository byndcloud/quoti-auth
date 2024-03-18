import chai from 'chai'
import app from './index.mjs'
import chaiHttp from 'chai-http'

chai.use(chaiHttp)

const { expect, request } = chai
const requester = request(app).keepOpen()

const bearerStatic = process.env.BEARER_STATIC || 'Bearer'

describe('QuotiAuth - no token tests', function () {
  it('Should call a endpoint without QuotiAuthMiddleware', async function () {
    const res = await requester.get('/unauthenticated').send()

    expect(res.status).to.equal(200)
  })

  it('Should call a endpoint with QuotiAuthMiddleware', async function () {
    const res = await requester.get('/authenticated').send()

    expect(res.status).to.equal(401)
  })

  it('Should call a endpoint with QuotiAuthMiddleware', async function () {
    const res = await requester
      .get('/authenticated')
      .set('Authentication', 'Bearer InvalidToken')
      .send()

    expect(res.status).to.equal(401)
  })
})

describe('QuotiAuth - token BearerStatic', function () {
  it('Should call a endpoint without QuotiAuthMiddleware', async function () {
    const res = await requester
      .get('/unauthenticated')
      .set('BearerStatic', bearerStatic)
      .send()

    expect(res.status).to.equal(200)
  })

  it('Should call a endpoint with QuotiAuthMiddleware', async function () {
    const res = await requester
      .get('/authenticated')
      .set('BearerStatic', bearerStatic)
      .send()

    expect(res.status).to.equal(401)
  })

  it('Should call a endpoint with QuotiAuthMiddleware', async function () {
    const res = await requester
      .get('/authenticated')
      .set('BearerStatic', bearerStatic)
      .send()

    expect(res.status).to.equal(401)
  })
})
