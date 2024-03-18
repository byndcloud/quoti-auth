import express from 'express'
const app = express()
const port = 3000
import { QuotiAuth } from '../src/quotiauth.js'

const apiKey = process.env.API_KEY || 'apiKey'

const quotiAuth = new QuotiAuth('beyond', apiKey, undefined, undefined, 'debug')

app.get('/unauthenticated', (req, res) => {
  res.send('It works!')
})

app.get('/authenticated', quotiAuth.middleware(), (req, res) => {
  res.send('It works!')
})

app.get('/authenticated/permissions', quotiAuth.middleware(['testing.permissions']), (req, res) => {
  res.send('It works!')
})

app.listen(port, () => {
  console.info(`Testing server app listening on port ${port}`)
})

export default app
