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
        res.status(500).send({ error: e.message })
    }
}