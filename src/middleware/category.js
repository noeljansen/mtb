const Category = require('../models/category')
exports.categoryById = async (req, res, next, id) => {
    try {
        //console.log('In categoryById Middleware')
        const category = await Category.findById(id)
        if (!category) {
            return res.status(404).send({
                error: 'Category does not exist!'
            })
        }
        //console.log(`Middleware category: ${category}`)
        req.category = category
        next()
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}

