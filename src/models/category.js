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
        unique: false,
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

// #### Category Static Functions ####

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


/* 
 crudUpdate()

 This function needs to be called after a document is saved, updated, or deleted.
 The mongoose mpath plugin only runs after a document has had a crud operation. The category tree is then changed.

 This function is used to populate the following properties of all documents:
    - ancestors
    - immediateChildrenIds
    - immediateChildrenNames
    - allChildrenIds
    - allChildrenNames

 Note:   Currently this function is called manually after a crudUpdate. It CANNOT be implemented with a save post hook, as the function itself calls save(), creating an endless loop
         While this is not an efficient / elegant solution, in reality Category updates will not happen very often and will only be perforned by a superadmin
*/

categorySchema.statics.crudUpdate = async function () {
    const categories = await Category.find()
    // This only needs to be called if there are more than one categories. If it is called with only one category, it creates errors with Mpath!
    if (categories.length == 1) {
        //console.log('First Category Made')
        const cat = categories[0]
        // PJ - Create Blank Array first!
        const noAncestors = []
        noAncestors.push(toNameString(cat.name))
        cat.ancestors = noAncestors
        await cat.save()
        return
    }

    for (const cat of categories) {
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
        const immediateChildren = await cat.getImmediateChildren()  //mpath function
        const iChildrenNames = []
        const iChildrenIds = []

        immediateChildren.forEach(child => {
            iChildrenNames.push(child.name)
            iChildrenIds.push(child._id)
        })

        cat.immediateChildrenNames = iChildrenNames
        cat.immediateChildrenIds = iChildrenIds

        //update all children (Ids and Names)
        const allChildren = await cat.getAllChildren()  //mpath function
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


// #### Category Middleware ####

//Delete category's adverts before the user is deleted
categorySchema.pre('remove', async function (next) {
    const category = this
    await Advert.deleteMany({ parent: category._id })
    next()
})

const Category = mongoose.model('Category', categorySchema)
module.exports = Category
