import chai from 'chai'
import chaiHttp from 'chai-http'

chai.use(chaiHttp)

export const mochaHooks = {
  afterAll () {
    console.info('Finished execution of e2e tests')
    process.exit(0)
  }
}
