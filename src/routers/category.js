
const express = require('express')

const { create, display, displayAll, displayById, displayTree, update, deleteCategory } = require('../controllers/category')
const { categoryById } = require('../middleware/category')
const { userAuth, isAdmin } = require('../middleware/auth')

const router = new express.Router()

console.log('In Category Router')

router.param('categoryId', categoryById)

router.post('/categories/create', userAuth, isAdmin, create)

router.get('/categories/tree', displayTree)

router.get('/categories/:categoryId', displayById)
router.get('/categories/', displayAll)


// Get via acestors routes all use the same method. Perhaps there is a better way to set this up?
router.get('/categories/c/:grandparent/:parent/:child', display)
router.get('/categories/c/:parent/:child', display)
router.get('/categories/c/:child', display)

router.put('/categories/:categoryId', userAuth, isAdmin, update)

router.delete('/categories/:categoryId', userAuth, isAdmin, deleteCategory) //If any other categories, have this as a parent, it will replace the parent categoriey with special category, undefined


module.exports = router