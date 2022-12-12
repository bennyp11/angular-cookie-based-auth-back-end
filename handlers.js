const uuid = require('uuid')

const users = {
    "benny@p.com": "password1",
    "user2": "password2"
}

class Session {
    constructor(email, expiresAt) {
        this.email = email
        this.expiresAt = expiresAt
    }

    isExpired() {
        this.expiresAt < (new Date())
    }
}

const sessions = {}

const loginHandler = (req, res) => {
    // get users credentials from the JSON body
    const { email, password } = req.body
    if (!email) {
        // If the email isn't present, return an HTTP unauthorized code
        res.status(401).end()
        return
    }

    // validate the password against our data
    // if invalid, send an unauthorized code
    const expectedPassword = users[email]
    if (!expectedPassword || expectedPassword !== password) {
        res.status(401).end()
        return
    }

    // generate a random UUID as the session token
    const sessionToken = uuid.v4()

    // set the expiry time as 120s after the current time
    const now = new Date()
    const expiresAt = new Date(+now + 120 * 1000)

    // create a session containing information about the user and expiry time
    const session = new Session(email, expiresAt)
    // add the session information to the sessions map
    sessions[sessionToken] = session

    // In the response, set a cookie on the client with the name "session_cookie"
    // and the value as the UUID we generated. We also set the expiry time
    res.cookie("session_token", {sessionToken: sessionToken, email: email}, { expires: expiresAt })
    res.setHeader('Content-Type', 'application/json') //setheader to prevent invalid HTTP token error
    res.status(200)
    res.end()
}

const welcomeHandler = (req, res) => {
    // if this request doesn't have any cookies, that means it isn't
    // authenticated. Return an error code.
    if (!req.cookies) {
        res.status(401).end()
        return
    }

    // We can obtain the session token from the requests cookies, which come with every request
    const sessionToken = req.cookies['session_token']
    if (!sessionToken) {
        // If the cookie is not set, return an unauthorized status
        res.status(401).end()
        return
    }

    // We then get the session of the user from our session map
    // that we set in the signinHandler
    userSession = sessions[sessionToken]
    if (!userSession) {
        // If the session token is not present in session map, return an unauthorized error
        res.status(401).end()
        return
    }
    // if the session has expired, return an unauthorized error, and delete the 
    // session from our map
    if (userSession.isExpired()) {
        delete sessions[sessionToken]
        res.status(401).end()
        return
    }

    // If all checks have passed, we can consider the user authenticated and
    // send a welcome message
    res.send(`Welcome  ${userSession.email}!`).end()
}

const refreshHandler = (req, res) => {
    // (BEGIN) The code from this point is the same as the first part of the welcomeHandler
    if (!req.cookies) {
        console.log('no cookies!')
        res.status(401).end()
        return
    }
    const receivedCookie = req.cookies;
    const sessionToken = receivedCookie.session_token.sessionToken;
    const email = receivedCookie.session_token.email;
    if (!sessionToken || !email) {
        console.log('COOKIE INCOMPLETE')
        res.status(401).end()
        return
    }

    userSession = sessions[sessionToken]
    if (!userSession) {
        console.log('NO USER SESSION')
        res.status(401).end()
        return
    }
    if (userSession.isExpired()) {
        console.log('EXPIRED USER SESSION')
        delete sessions[sessionToken]
        res.status(401).end()
        return
    }
    // (END) The code until this point is the same as the first part of the welcomeHandler

    // create a new session token
    const newSessionToken = uuid.v4()

    // renew the expiry time
    const now = new Date()
    const expiresAt = new Date(+now + 120 * 1000)
    const session = new Session(userSession.email, expiresAt)

    // add the new session to our map, and delete the old session
    sessions[newSessionToken] = session
    delete sessions[sessionToken]

    // set the session token to the new value we generated, with a
    // renewed expiration time
    res.cookie("session_token", {sessionToken: newSessionToken, email: email}, { expires: expiresAt })
    res.setHeader('Content-Type', 'application/json') //setheader to prevent invalid HTTP token error
    res.end()
}

const logoutHandler = (req, res) => {
    if (!req.cookies) {
        console.log('NO COOKIE')
        res.status(401).end()
        return
    }

    const receivedCookie = req.cookies
    //const sessionToken = receivedCookie.session_token.sessionToken
    const sessionToken = receivedCookie.session_token.sessionToken
    if (!sessionToken) {
        console.log('NO SESSION TOKEN')
        res.status(401).end()
        return
    }

    delete sessions[sessionToken]

    res.cookie()
    res.setHeader('Content-Type', 'application/json') //setheader to prevent invalid HTTP token error
    res.end()
}

module.exports = {
    loginHandler,
    welcomeHandler,
    refreshHandler,
    logoutHandler
}