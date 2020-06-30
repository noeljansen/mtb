const express = require('express')

const { create, display, displayAll, displayById, displayTree, update, deleteCategory } = require('../controllers/category')
const { categoryById } = require('../middleware/category')
const { userAuth, isSuperAdmin } = require('../middleware/auth')

const router = new express.Router()

// Middleware
router.param('categoryId', categoryById)

//Routes
//To do - Add Merge Route and Function which will merge a category with an existing category and then delete the first category

router.post('/categories/create', userAuth, isSuperAdmin, create)
//This needs to be listed before the route for /categories/:categoryId'
router.get('/categories/tree', displayTree)

router.get('/categories/id/:categoryId', displayById)
router.get('/categories/', displayAll)

// Get via acestors for better SEO
router.get('/categories/:grandparent/:parent/:child', display)
router.get('/categories/:parent/:child', display)
router.get('/categories/:child', display)

router.put('/categories/:categoryId', userAuth, isSuperAdmin, update)

router.delete('/categories/:categoryId', userAuth, isSuperAdmin, deleteCategory) //If any other categories, have this as a parent, it will replace the parent categoriey with special category, undefined


module.exports = router