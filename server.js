const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { loginHandler, welcomeHandler, refreshHandler, logoutHandler } = require('./handlers')

const app = express()
app.use(cors({
    credentials: true,
    origin: 'http://localhost:4200'
}))
app.use(bodyParser.json())
app.use(cookieParser())

app.post('/login', loginHandler)
app.get('/welcome', welcomeHandler)
app.post('/refresh', refreshHandler)
app.get('/logout', logoutHandler)

app.listen(8080)