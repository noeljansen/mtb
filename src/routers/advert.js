const express = require('express')


const { userAuth } = require('../middleware/auth')
const { advertById } = require('../middleware/advert')

const { create, display, displayAll, update } = require('../controllers/advert')

const router = new express.Router()

//Middleware
router.param('advertId', advertById)

//Routes

router.post('/ads', userAuth, create)

router.get('/ads/:advertId', display)
router.get('/ads', displayAll)

router.put('/ads/:advertId', userAuth, update)

module.exports = router