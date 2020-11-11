require('dotenv-safe').config()

const port = process.env.APP_PORT || 3000
const app = require('.') // koa app

app.listen(port)
