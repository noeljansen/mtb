/*
 
Category Model setup with M-path: https://www.npmjs.com/package/mongoose-mpath
*/

const mongoose = require('mongoose')
const MpathPlugin = require('mongoose-mpath')

const { toNameString } = require('../utils/strings')


const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        maxlength: 50,
        required: true,
        trim: true
    },
    // parent: { - This is created automatically by mpath and must NOT be defined
    //     type: mongoose.Schema.Types.ObjectId,
    //     required: false,
    //     default: undefined     
    // },
    // path: { 
    //      - This is created automatically by mpath and must NOT be defined
    //      - Ancestory path of the category e.g. grandparentId#parentId#thisId] using ids separated by #   //     
    //        
    //     type: String
    // },
    ancestors: {  //This will be the path with the IDs swapped for the category names 
        type: [String],
        unique: true,
        required: false,//First need to save with MPath and afterwards generate the URL - Not efficient, but OK for now,
        validate(value) {
            //Validate Category Depth - This will be hardcoded to 3 i.e Grandparent -> Parent -> Child
            if (value.length > 3) throw new Error('Category has to many parents! Categories may only be 3 levels deep!')
        }
    }
    , immediateChildrenIds: {
        type: [mongoose.Schema.Types.ObjectId]
    },
    immediateChildrenNames: {
        type: [String]
    },
    allChildrenIds: {
        type: [mongoose.Schema.Types.ObjectId]
    },
    allChildrenNames: {
        type: [String]
    }

}, {
    timestamps: true
})

//mpath - using default options for now
categorySchema.plugin(MpathPlugin)

// #### Category Methods ####

//  #### Category Static Functions ####

//Validate that parent exists
categorySchema.statics.validateParent = async function (parentId) {
    if (parentId) {
        //Find and validate parent ID if it is there. Mongoose's validator will make sure it is a valid ObjectID.
        const parentCategory = await Category.findById(parentId)
        if (!parentCategory) {
            return false
        }
    }
    return true
}

// This Method needs to be called after we have saved a document as this means that mpath would have run on all documents. This will then update the fields: ancestors, immediateChildren, allChildren
categorySchema.statics.crudUpdate = async function () {
    // console.log(' ########## In CRUD Update ##########')

    const categories = await Category.find()
    // This only needs to be called if there are more than one categories. If it is called with only one category, it creates errors with Mpath!
    if (categories.length == 1) {
        //console.log('First Category Made')
        const cat = categories[0]
        cat.ancestors.push(toNameString(cat.name))
        await cat.save()
        return
    }

    for (const cat of categories) {
        ///console.log(`Category Name: ${cat.name}`)

        //update ancestors from path. This will get all the IDs, find the respective Category and add the name to the path
        var ancestors = []
        if (cat.path.length > 0) {
            const ancestorIds = cat.path.split('#')
            //console.log(`ancestorIds: ${ancestorIds}`)
            for (id of ancestorIds) {
                const ancestor = await Category.findById(id)
                if (!ancestor) {
                    //console.log('Invalid ID in Path')
                    throw new Error("Invalid ID in path!")
                } else {
                    ancestors.push(toNameString(ancestor.name))
                }
            }
        }
        //console.log(`ancestors: ${ancestors}`)
        cat.ancestors = ancestors

        //update immediate children (Ids and Names)
        const immediateChildren = await cat.getImmediateChildren()
        const iChildrenNames = []
        const iChildrenIds = []

        immediateChildren.forEach(child => {
            iChildrenNames.push(child.name)
            iChildrenIds.push(child._id)
        })

        cat.immediateChildrenNames = iChildrenNames
        cat.immediateChildrenIds = iChildrenIds

        //update all children (Ids and Names)
        const allChildren = await cat.getAllChildren()
        const childrenNames = []
        const childrenIds = []

        allChildren.forEach(child => {
            childrenNames.push(child.name)
            childrenIds.push(child._id)
        })

        cat.allChildrenNames = childrenNames
        cat.allChildrenIds = childrenIds
        // console.log(`Category about to be saved in CRUD Update: ${JSON.stringify(cat)}`)
        await cat.save()
    }


}


const Category = mongoose.model('Category', categorySchema)
module.exports = Category
