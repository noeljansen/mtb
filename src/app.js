const express = require('express')

require('./db/mongoose')
const userRouter = require('./routers/user')
const categoryRouter = require('./routers/category')
const advertRouter = require('./routers/advert')

const app = express()

//recgonize incoming requests and send outgoing responses as JSON objects
app.use(express.json())


//Routes
app.use('/api', userRouter)
app.use('/api', categoryRouter)
app.use('/api', advertRouter)

module.exports = app
