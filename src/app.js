const express = require('express')

require('./db/mongoose')
const userRouter = require('./routers/user')

const app = express()

//recgonize incoming requests as JSON objects
app.use(express.json())

//Routes
app.use('/api', userRouter)

module.exports = app
