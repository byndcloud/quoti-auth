# Quoti Auth
Quoti Auth é uma biblioteca que te ajuda a implementar as APIs de Autenticação e Autorização do Quoti dentro do seu projeto.
Ele é basicamente um middleware de express que fará as verificações e injetará informações do usuário em `req.user` 

## Instalação

Você pode usar o gerenciador de pacotes NPM para fazer a instação usando o terminal:
```bash
npm install quoti-auth
```

## Inicializando o Quoti Auth
```javascript
const { quotiAuth } = require('quoti-auth')

quotiAuth.setup({
    orgSlug: 'someOrgSlug',
    apiKey: 'some-api-key',
    logger: console 
})
```

## Usando

Injetando dados do usuário em `req.user`:
```javascript
app.post('/', QuotiAuth.middleware(), async (req, res) => {
  console.log('User:', req.user.name)
  res.send('OK!')
})
```
Na prática, esse middleware fará a autenticação com a API do Quoti usando o [Authorization Header](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Authorization) que já estaria contido no seu `req.headers`.
Este header pode ser:
 - Authorization: Bearer TOKEN
 - Authorization: BearerStatic TOKEN


## Checando permissões do usuário
Neste exemplo, o middleware vai checar se o usuário tem a permissão `posts.filter`. Caso ele não tenha, o Quoti Auth vai retornar um erro 401 no endpoint:
```javascript
app.post('/', QuotiAuth.middleware([['posts.filter']]), async (req, res) => {
  res.send(`OK! O usuário ${req.user.name} tem a permissão 'posts.filter'`)
})
```

## Configuraçẽs Avançadas
### Substituindo a função getUserData
```javascript
const { quotiAuth } = require('quoti-auth')

// Esta função será chamada passando o token do usuário que você está consultando para retornar os dados do usuário.
async getUserData (token) {
  const url = process.env['api_url'] || 'https://api.quoti.cloud/api/v1/'
  const headers = {
    ApiKey: 'some-api-key'
  }
  const { data } = await axios.post(`${url}${this.orgSlug}/auth/login/getuser`, { token }, { headers })
  
  // O retorno dessa função será injetado em req.user
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

## Licença
[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
