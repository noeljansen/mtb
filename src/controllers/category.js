const Category = require('../models/category')

exports.create = async (req, res) => {
    try {
        const category = new Category(req.body)

        //Store name as Lower Case in path. Remove Space Character from name when putting it in the path and replace with '-' - this is needed for the URLs
        var pathName = category.name.toLowerCase()
        var pos = category.name.indexOf(' ')
        if (pos > -1) {
            var newName
            while (pos > -1) {
                newName = pathName.replace(' ', '-')
                pathName = newName
                pos = pathName.indexOf(' ')
            }
        }

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
- If a category's parent changes, then this affects all children's path's
- Need to validate:
    - Category depth of this as well as of children
    - All children path's will must be unique
- Need to modify all children categories
*/
exports.modify = async (req, res) => {
    try {
        if (req.parent === undefined || req.parent === null) {
            //If the new category has no parent, then no validation is required

        } else if (req.parent) {
            //Need to validate!
        }
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

