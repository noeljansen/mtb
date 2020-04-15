const express = require('express')

const { signup, signin, signout, signoutAll, display, update, remove, getUser, deleteUser } = require('../controllers/user')
const { userAuth, isAdmin } = require('../middleware/auth')

const router = new express.Router()

router.post('/users/signup', signup)
router.post('/users/signin', signin)
router.post('/users/signout', userAuth, signout)
router.post('/users/signoutall', userAuth, signoutAll)

router.get('/users/profile', userAuth, display) //this is for the user to view their own profile

router.put('/users/profile', userAuth, update) // this is for the user to modify their own profile

router.delete('/users/profile', userAuth, remove)

//Admin only routes
router.get('/users/:id', userAuth, isAdmin, getUser) //can only get other user details if their level is less than the requestor
router.delete('/users/:id', userAuth, isAdmin, deleteUser)
module.exports = router