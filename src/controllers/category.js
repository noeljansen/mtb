const mongoose = require('mongoose')

const Category = require('../models/category')
const { toNameString } = require('../utils/strings')

exports.create = async (req, res) => {
    try {
        const category = new Category(req.body)

        //Store name as Lower Case in path. Remove Space Character from name when putting it in the path and replace with '-' - this is needed for the URLs
        var pathName = toNameString(category.name)

        category.path.push(pathName)

        const parentId = req.body.parent
        if (parentId != undefined) {
            //Find and validate parent ID if it is there. Mongoose's validator will make sure it is a valid ObjectID.
            const parentCategory = await Category.findById(parentId)
            if (!parentCategory) {
                return res.status(400).send({
                    error: 'Parent Category invalid!'
                })
            }
            // //Generate path array - The depth of the category is validated in the Category schema. 
            const updatedPath = parentCategory.path.concat(category.path)

            //Check that path is unique. The unique 'validator / index' did not work for the array
            const foundArray = await Category.findOne({ path: updatedPath })
            console.log(`foundArray: ${foundArray}`)
            if (foundArray) {
                return res.status(400).send({
                    error: `The category ${updatedPath} already exists!`
                })
            }

            category.path = updatedPath
        }

        await category.save()
        console.log(`Category Created: ${category}`)

        //Need to update Parent Children
        console.log('About to update Parent Children')
        await category.updateParentChildren()

        return res.status(201).send(category)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}

exports.display = async (req, res) => {
    // This works with different amounts of parameters
    try {
        //req.params in an array     
        var paramsArray = Object.values(req.params)

        //convert params to lower case
        paramsArray = paramsArray.map((x) => {
            return x.toLowerCase()
        })

        //find category based on path
        const category = await Category.findOne({ path: paramsArray })

        return res.status(200).send(category)
    } catch (e) {

        return res.status(500).send({ error: e.message })
    }
}

/*
Modify : To be completed.

Only fields than can be updated by the user are the name and parent.
- First get the category to updated
- Then get the new category data (name, parent)
- If there is a new parent
    - Make sure that the depth will be 3 or length by concating the path and the longest child path - Need to do this
- Make sure that there is not an item on the same ancestory level with the same name (or new name) - This will ensure uniquesness of the path and children paths
- Return any potential conflicts

If that is OK, then start the updating...

- All Parents / Grandparents 's children array needs to be updated
- All children's / GrandChildrens paths' need to be updated
 


If the above doesn't work, could look at storing it as a 3D array / JSON object

*/
exports.modify = async (req, res) => {

    // Verfiy the updates that the client is attempting to make
    const updates = Object.keys(req.body)   //put this in a utils function
    //Updates the client may make - name, parent
    const permittedUpdates = ['name', 'parent']

    const isValidUpdate = updates.every((update) => {
        return permittedUpdates.includes(update)
    })
    if (!isValidUpdate) {
        return res.status(400).send({
            error: 'Invalid updates!'
        })
    }

    //tested

    try {

        const category = req.category
        console.log(`Category to be updated: ${category}`)

        //Check if the name has been updated, if it has then we need to get the new path name
        const name = req.body.name
        var pathName = toNameString(category.name)
        var nameUpdate
        if ((!name) || (name === category.name)) {
            nameUpdate = false
            console.log('Name not updated')
        } else {
            nameUpdate = true
            pathName = toNameString(name)
            console.log(`Name to be updated to: ${pathName}`)
        }

        //First check if there is a parent update
        if (updates.includes('parent')) {
            const newParentID = req.body.parent
            console.log(`New Parent ID: ${newParentID}`)

            //Check if there is a parent, or if it is being changed to a high level category, i.e. parent is null

            //The category is a highlevel category, i.e. has no parent:
            if (!newParentID) {
                //Only need to check that name is unique
                console.log('New High Level Category')

                //Use Mongoose Query to find all Categories that have no children
                const highLevelCategories = await Category.find({ path: { $size: 1 } })
                console.log(`highLevelCategories: ${highLevelCategories}`)

                highLevelCategories.forEach(cat => {
                    console.log('High Level Category')
                    if (cat.path[0] === pathName) {
                        return res.status(400).send({
                            error: `Category already exists: '${pathName}'!`
                        })
                    }
                })
            }

            //tested

            //If there is a parent:
            else if (newParentID) {
                //Validate that the parentID exists
                if (!mongoose.isValidObjectId(newParentID))
                    return res.status(400).send({
                        error: 'Invalid Parent Category!'
                    })

                //Check if the new ParentID is actually the category's id
                if (newParentID == category._id)
                    return res.status(400).send({
                        error: 'Invalid Parent Category. Category parent cannot be itself!'
                    })

                const newParent = await Category.findById(newParentID)
                if (!newParent) {
                    return res.status(404).send({
                        error: 'Invalid Parent Category!'
                    })
                }

                //tested

                //Validate the path length. This is set to 3
                const pathLength = newParent.path.length + category.path.length
                if (pathLength > 3) {
                    return res.status(400).send({
                        error: `The new parent results in a category path that is too long: ${newParent.path.join(" -> ")} -> ${category.path.join(" -> ")}`
                    })
                }

                //Validate the name or new name . This must be unique when in the required format
                newParent.children.forEach(async childID => {
                    const child = await Category.findById(childID[0])     //The children array is 3 dimensional
                    if (child.path[child.path.length - 1] === pathName) {
                        return res.status(400).send({
                            error: `Category already exists: ${newParent.path.join(" -> ")} -> ${child.path[child.path.length - 1]}!`
                        })
                    }
                })

            }
        } else if (updates.includes('name')) {
            //There is only a name update, so only a name change            

            //First check if it is a high level category
            const parentId = category.parent
            if (!parentId) {
                //Get all high level Categories - This should be a static method on Category
                Category.find({ path: { $size: 1 } }, (err, data) => {
                    if (err) {
                        return res.status(500).send({
                            error: `Error: ${err}`
                        })
                    }
                    data.forEach(cat => {
                        if (cat.path[0] === pathName) {
                            return res.status(400).send({
                                error: `Category already exists: ${pathName}!`
                            })
                        }
                    })
                })
            } else {
                //Parent is another category
                const parent = await Category.findById(category.parentId)
                //Get all children - This should be a function. Might be more efficient to use a query to get an array of children who's parent field matches the parentID?
                parent.children.forEach(async childID => {
                    const child = await Category.findById(childID[0])
                    if (child.path[child.path.length - 1] === pathName) {
                        return res.status(400).send({
                            error: `Category already exists: ${newParent.path.join(" -> ")} -> ${child.path[child.path.length - 1]}!`
                        })
                    }
                })

            }
        }

        //All validation has been completed. Now the updating can begin.
        //First update this category
        //Then update the parent's & grandparent's children array
        //Then update the children's path (their parent remains the same)
        //Then update grandchildren's path

        console.log('Finished')
        res.send(req.category)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}

//To be completed
exports.deleteCategory = async (req, res) => {
    try {
        //
        const category = req.category
        const children = category.getChildren() //Need to test this
        //Find all Children
    } catch (e) {
        //
    }
}

