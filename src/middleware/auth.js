const jwt = require('jsonwebtoken')
const User = require('../models/user')

//This checks that the user is authenticated with a JWT
exports.userAuth = async (req, res, next) => {
    try {
        //extract JWT from Authorization header
        const token = req.header('Authorization').replace('Bearer ', '')

        //Decoded Token has user id as well as token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findOne({ _id: decodedToken._id, 'tokens.token': token })

        if (!user) {
            throw new Error(e)
        }
        //Add the token used for authentication to the req so that we know which client is authenticated
        req.token = token
        //Add the user object to the request, so that it can be accessed by router
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({ error: 'User not authenticated. Please sign in!' })
    }
}

exports.isAdmin = (req, res, next) => {
    if (req.user.level > 0) {
        next()
    } else {
        res.status(401).send({ error: 'User not authorised!' })
    }
}

