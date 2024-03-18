# Quoti Auth
Quoti Auth is a library that helps you implement Quoti's Authentication and Authorization APIs within your project.
It is essentially an express middleware that will perform checks and inject user information into `req.user`.

## Installation

You can use the NPM package manager to install it using the terminal:
```bash
npm install quoti-auth
```

## Initializing Quoti Auth

In this section, we initialize Quoti Auth by calling the `quotiAuth.setup` function. This function takes an object with two properties: `orgSlug` and `apiKey`.

```javascript
const { quotiAuth } = require('quoti-auth')

quotiAuth.setup({
    orgSlug: 'someOrgSlug',
    apiKey: 'some-api-key',
})
```

- `orgSlug`: This is a unique string identifier for your organization. It serves as the path of your organization within the Quoti system.
- `apiKey`: This is a unique key for your organization. It acts as a private key, providing your organization with access to the Quoti API. It's important to keep this key secure as it can be used to perform any action that your organization has permissions for.

## Usage

Injecting user data into `req.user`:
```javascript
app.post('/', QuotiAuth.middleware(), async (req, res) => {
  console.debug('UserName:', req.user.name)
  res.send('OK!')
})
```
In practice, this middleware will authenticate with the Quoti API using the [Authorization Header](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Authorization) that would already be contained in your `req.headers`.
This header can be:
 - Authorization: Bearer TOKEN
 - Authorization: BearerStatic TOKEN

## Checking user permissions
### Basic usage
In this example, the middleware will check if the user has the `posts.filter` permission. If they do not, Quoti Auth will return a 403 error at the endpoint:
```javascript
app.post('/', QuotiAuth.middleware([['posts.filter']]), async (req, res) => {
  res.send(`OK! The user ${req.user.name} has the 'posts.filter' permission`)
})
```

### Check if satisfies multiple permissions

The middleware checks if the user has all of the specified permissions in the array. If the user doesn't have all these permissions, Quoti Auth will respond with a 403 error at the endpoint. Here's how it looks:

```javascript
app.post('/', QuotiAuth.middleware([['people.list', 'person.list']]), async (req, res) => {
  res.send(`Success! The user ${req.user.name} has both 'people.list' and 'person.list' permissions.`)
})
```


### Check for some given permissions

The middleware can check if the user has at least one of the specified permissions in the array. If the user doesn't have any of these permissions, Quoti Auth will respond with a 403 error at the endpoint. Here's how it looks:

```javascript
app.post('/', QuotiAuth.middleware([['people.list'], ['person.list']]), async (req, res) => {
  res.send(`Success! The user ${req.user.name} has either 'people.list' or 'person.list' permission.`)
})
```

In both cases, if the user has the necessary permissions, the endpoint will return a success message.


## QuotiAuth.setup function parameters

The `quotiAuth.setup` function in [`src/quotiauth.js`](https://github.com/byndcloud/quoti-auth/blob/develop/src/quotiauth.js "src/quotiauth.js") takes an object with the following properties:

- `orgSlug` (String): The organization slug. This is a unique identifier for your organization.
- `apiKey` (String): The Quoti API key. This is used to authenticate your application with the Quoti API.
- `getUserData` (Function, optional): A function that returns user data. If provided, this function will be used instead of the default `getUserData` method in the `QuotiAuth` class.
- `logger` (Object, optional): A Winston logger. If not provided, `console` will be used as the logger.
- `errorLogLevel` (String, optional): The log level for errors. If not provided, 'error' will be used as the default log level.

## Advanced Settings
### Replacing the getUserData function

Customizing this function can be useful if you want to modify what will be injected into req.user, or even if you want to call a custom endpoint or service instead of calling the standard API used by QuotiAuth

```javascript
const { quotiAuth } = require('quoti-auth')

// This function will be called, passing the user's token that you are querying to return the user's data
async getUserData (token) {
  const url = process.env['api_url'] || 'https://api.quoti.cloud/api/v1/'
  const headers = {
    ApiKey: 'some-api-key'
  }
  const { data } = await axios.post(`${url}${this.orgSlug}/auth/login/getuser`, { token }, { headers })
  
  // The return of this function will be injected into req.user.
  return data.user
}

quotiAuth.setup({
    orgSlug: 'someOrgSlug',
    apiKey: 'some-api-key',
    getUserData: getUserData,
    logger: console,
    errorLogLevel: 'error'
})
```