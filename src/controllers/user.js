const User = require('../models/user')

exports.signup = async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        console.log('User Saved, getting Auth Token next...')
        const token = await user.createAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
}

exports.signin = async (req, res) => {
    try {
        //console.log(req)
        const user = await User.authenticate(req.body.email, req.body.password)
        const token = await user.createAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
}

/*
Signout from current device only!    
Signout will only run if the authUser middleware runs. This would have added the user object to the request
Remember that token is an object with property token, so need to access token.token
*/
exports.signout = async (req, res) => {
    try {
        //remove current JWT
        const tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        req.user.tokens = tokens
        await req.user.save()
        res.status(200).send()
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
}

exports.signoutAll = async (req, res) => {
    try {
        //remove all JWTs
        req.user.tokens = []
        await req.user.save()
        res.status(200).send()
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
}

exports.display = async (req, res) => {
    try {
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}

exports.update = async (req, res) => {
    try {
        // Updates the client is attempting to make
        const updates = Object.keys(req.body)
        //Updates the client may make - Email will need to be verified
        const permittedUpdates = ['name', 'phone', 'postcode']

        const isValidUpdate = updates.every((update) => {
            return permittedUpdates.includes(update)
        })

        if (!isValidUpdate) {
            return res.status(400).send({
                error: 'Invalid updates!'
            })
        }

        try {
            updates.forEach(update => {
                req.user[update] = req.body[update]
            })
            await req.user.save()

            res.send(req.user)
        } catch (e) {
            res.status(400).send({ error: e.message })
        }

    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}

exports.remove = async (req, res) => {
    try {
        await req.user.remove()
        res.status(200).send()
    } catch (e) {
        res.status(400).send({ error: e.message })
    }
}

// ### Admin Methods ### //
//Get user information - This is for admins only

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send({ error: 'User does not exist!' })
        }
        //Prevent admin from seeing other admins or super admins details
        if (req.user.level <= user.level) {
            return res.status(401).send({ error: 'Unauthorised!' })
        }
        return res.status(200).send(user)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}

/* 
To do: Delete all ads that belong to user
*/

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).send({ error: 'User does not exist!' })
        }
        //Prevent admin from seeing other admins or super admins details
        if (req.user.level <= user.level) {
            return res.status(401).send({ error: 'Unauthorised!' })
        }
        await user.remove()
        return res.status(200).send()
    } catch (e) {
        res.status(500).send(e)
    }
}
