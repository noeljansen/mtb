const mongoose = require('mongoose')
const fs = require('fs')
const writeJsonFile = require('write-json-file');

const Category = require('../models/category')

exports.create = async (req, res) => {
    try {
        const category = new Category(req.body)

        const parentId = req.body.parent

        if (parentId != undefined) {
            //Find and validate parent ID if it is there. Mongoose's validator will make sure it is a valid ObjectID.
            const parentCategory = await Category.findById(parentId)
            if (!parentCategory) {
                return res.status(400).send({
                    error: 'Parent Category invalid!'
                })
            }

            if (parentCategory.ancestors.length > 2) {
                return res.status(400).send({
                    error: 'Category has to many parents! Categories may only be 3 levels deep!'
                })
            }
        }
        await category.save()
        await Category.crudUpdate()     //updates the category Tree

        //return updated Category with Tree information
        const updatedCat = await Category.findById(category._id)

        return res.status(201).send(updatedCat)
    } catch (e) {
        console.trace()
        console.log(e.message)
        res.status(500).send({ error: e.message })
    }
}

exports.display = async (req, res) => {
    // This works with different amounts of parameters (1 to 3)
    try {
        //req.params in an array     
        var paramsArray = Object.values(req.params)

        //convert params to lower case
        paramsArray = paramsArray.map((x) => {
            return x.toLowerCase()
        })

        //find category based on path
        const category = await Category.findOne({ ancestors: paramsArray })

        return res.status(200).send(category)
    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}

exports.displayById = async (req, res) => {
    try {
        //already has category attached to req due to Middleware
        const category = req.category
        return res.status(200).send(category)
    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}

exports.displayAll = async (req, res) => {
    try {
        const categories = await Category.find()
        return res.status(200).send(categories)
    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}

/* 
 Display Tree - Displays the category tree structure. This can be used to get an overview of the categoryies and to build the menus

 Future improvements:
    - Add a warnings property if there are any potential errors!
*/

exports.displayTree = async (req, res) => {
    try {
        // Call MPath Function getChildrenTree
        const categoryTree = await Category.getChildrenTree({
            fields: 'name ancestors',
            options: {
                lean: true
            }
        })
        await writeJsonFile('CategoryTree.json', categoryTree)
        return res.status(200).send(categoryTree)
    } catch (e) {
        console.log(`Error: ${e}`)
        return res.status(500).send({ error: e.message })
    }
}

exports.update = async (req, res) => {

    /* 
    Note :Both Parent Category and  Name must be sent

    Future Improvements:
        - Check that their are no duplicates in the ancestor array
        - Check that the maximum level a category can have is 3.        
    
    */

    try {
        const category = req.category
        updatedParent = req.body.parent
        updatedName = req.body.name
        if (!updatedName) {
            return res.status(500).send({ error: 'Category Name must be supplied!' })
        }

        const parentFound = await Category.validateParent(updatedParent)
        if (!parentFound) {
            return res.status(500).send({ error: 'Parent not valid!' })
        }
        category.parent = updatedParent
        category.name = updatedName
        await category.save()

        //update the whole category tree
        await Category.crudUpdate()     //updates the category Tree

        return res.status(200).send()

    } catch (e) {
        console.log(e)
        return res.status(500).send({ error: e.message })
    }
}

/* 
This deletes a category.

On delete the sub categories are reparented to the parent of the category that is deleted. If there is no parent, then the sub  categories become level 1 categories

*/
exports.deleteCategory = async (req, res) => {
    try {
        //
        const category = req.category
        await category.remove()
        await Category.crudUpdate()     //updates the category Tree
        return res.status(200).send()
    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}

