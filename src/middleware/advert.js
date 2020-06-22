const Advert = require('../models/advert')

exports.advertById = async (req, res, next, id) => {
    try {
        const advert = await Advert.findById(id)
        if (!advert) {
            return res.status(404).send({
                error: 'Advert not found!'
            })
        }
        req.advert = advert
        next()
    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}

/* 
This can only be called after userAuth and advertByID MiddleWare

This also allows admins to be authorized

*/
exports.advertUserAuth = async (req, res, next) => {
    try {
        const user = req.user
        const advert = req.advert
        if (!user || !advert) {
            return res.status(404).send({
                error: 'Advert or user not found!'
            })
        }
        //Give admins authorization
        if (user.level > 0) {
            return next()
        } else if (!advert.user.equals(user._id)) {
            return res.status(400).send({ error: 'User not authorized!' })
        }

        next()

    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}