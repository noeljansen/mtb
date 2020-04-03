const express = require('express')

const { signup, signin, signout, signoutAll, display, update } = require('../controllers/user')
const { userAuth } = require('../middleware/auth')

const router = new express.Router()

router.post('/users/signup', signup)
router.post('/users/signin', signin)
router.post('/users/signout', userAuth, signout)
router.post('/users/signoutall', userAuth, signoutAll)

router.get('/users/profile', userAuth, display)

router.patch('/users/profile', userAuth, update)

module.exports = router