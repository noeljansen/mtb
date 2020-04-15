
const express = require('express')

const { create, display, modify, deleteCategory } = require('../controllers/category')
const { categoryById } = require('../middleware/category')
const { userAuth, isAdmin } = require('../middleware/auth')

const router = new express.Router()

router.param('categoryId', categoryById)

router.post('/categories/create', userAuth, isAdmin, create)

// Get Routes all use the same method. Perhaps there is a better way to set this up?
router.get('/categories/:grandparent/:parent/:child', display)
router.get('/categories/:parent/:child', display)
router.get('/categories/:child', display)

router.put('/categories/:categoryId', userAuth, isAdmin, modify) //
router.delete('/categories/:categoryId', userAuth, isAdmin, deleteCategory) //If any other categories, have this as a parent, it will replace the parent categoriey with special category, undefined


module.exports = router