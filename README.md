# Quoti Auth
Quoti Auth é uma biblioteca que te ajuda a implementar as APIs de Autenticação e Autorização do Quoti dentro do seu projeto.

Ele é basicamente um middleware de express que fará as verificações e injetará informações do usuário em
`req.user` 

## Instalação

Você pode usar o gerenciador de pacotes NPM para fazer a instação usando o terminal:
```bash
npm install quoti-auth
```

## Inicializando o Quoti Auth
```javascript
import { quotiAuth } from 'quoti-auth'

quotiAuth.setup({
    orgSlug: 'someOrgSlug',
    apiKey: 'some-api-key',
    getUserData: null, // Esta função será chamada passando o token do usuário para que você está consultado para retornar os dados do usuário. Caso não seja definida, ela irá usar a API padrão do Quoti. 
    logger: console 
})
```

## Usando

Injetando dados do usuário em `req.user`:
```javascript
app.post('/', QuotiAuth.middleware(), async (req, res) => {
  console.log('User:', req.user?.name)
  res.send('OK!')
})
```

## Checando permissões do usuário
Neste exemplo, o middleware vai checar se o usuário tem a permissão `posts.filter`. Caso ele não tenha, o Quoti Auth vai retornar uma exception no seu endpoint:
```javascript
app.post('/', QuotiAuth.middleware([['posts.filter']]), async (req, res) => {
  res.send(`OK! O usuário ${req.user.name} tem a permissão 'posts.filter'`)
})
```


## Licença
[APACHE LICENSE 2.0](https://www.apache.org/licenses/LICENSE-2.0)
