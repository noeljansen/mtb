const Advert = require('../models/advert')

exports.advertById = async (req, res, next, id) => {
    try {
        console.log('Starting AdvertByID Middleware')
        const advert = await Advert.findById(id)
        if (!advert) {
            return res.status(404).send({
                error: 'Advert not found!'
            })
        }
        req.advert = advert
        console.log('Finishing AdvertByID Middleware')
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
        console.log('Starting advertUserAuth Middleware ')
        const user = req.user
        const advert = req.advert
        if (!user || !advert) {
            return res.status(404).send({
                error: 'Advert or user not found!'
            })
        }
        //Give admins authorization
        if (user.level > 0) {
            console.log('First next() in advertUserAuth Middleware')
            return next()
        } else if (!advert.user.equals(user._id)) {
            console.log('User not valid')
            return res.status(400).send({ error: 'User not authorized!' })
        }
        console.log('Finished advertUserAuth Middleware ')
        next()

    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}