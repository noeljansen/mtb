const fs = require('fs')

const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

const Advert = require('../models/advert')
const Category = require('../models/category')

const { uploads, deleteSingle, clearUploadDirectory } = require('../utils/cloudinary');
const { nextTick } = require('process');


exports.create = async (req, res) => {
    try {
        // Prevent users from approving adverts
        if (req.body.approved) {
            return res.status(400).send({ error: "Only admins may approve an advert!" })
        }
        const user = req.user
        const advert = new Advert(req.body)
        advert.user = user._id

        //Check that body data is valid before uploading images to cloud
        const valError = advert.validateSync()
        if (valError) {
            //console.log(`valError: ${valError}`)
            return res.status(400).send({ error: valError.message })
        }

        // Save images to cloudinary
        const images = []
        if (req.files.length > 0) {
            //console.log('Files have been uploaded to server')
            const reqString = JSON.stringify(req.files)
            //console.log(`Request: ${reqString}`)

            //use this to call the promise which uploads a single image to cloudinary
            const uploader = async (path) => await uploads(path)

            for (const file of req.files) {
                const filePath = file.path
                try {
                    const image = await uploader(filePath)
                    images.push(image.secure_url)
                    //delete image from server uploads directory
                    fs.unlinkSync(filePath)
                } catch (e) {
                    //console.log('Error with cloudinary upload')
                    throw new Error('Error uploading images to cloud')
                }
            }
        }
        advert.images = images
        await advert.save()
        return res.status(201).send(advert)
    } catch (e) {
        clearUploadDirectory(req.files)     // Delete all images from this req from uploads directory if there was an error
        res.status(500).send({ error: e.message })
    }
}

exports.display = async (req, res) => {
    try {
        const advert = req.advert
        await advert.populate('category', 'ancestors').execPopulate()
        return res.status(200).send(advert)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}

exports.displayAll = async (req, res) => {
    try {
        const adverts = await Advert.find({}, 'title').populate('category', 'ancestors').exec()
        return res.status(200).send(adverts)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}

/*
Update - Advert
This uses findOneAndUpdate to perform an atomic update incase an admin and user are updating the advert at the same time.
For now a user can update their own advert and the update does not need to be approved.

*/

exports.update = async (req, res) => {
    try {
        //First make sure that the advert being modified belongs to the logged in user
        const advert = req.advert
        const user = req.user

        //Updates the client is attempting to make
        const updates = Object.keys(req.body)
        //Updates all users may make
        const allowedUpdates = ['category', 'title', 'description', 'price', 'active']
        //If the user is an admin then, approved can be modified to
        if (user.level > 0) {
            allowedUpdates.push('approved')
        }

        //Verify that only allowable updates are made
        const isValidUpdate = updates.every((update) => {
            return allowedUpdates.includes(update)
        })
        if (!isValidUpdate) {
            return res.status(400).send({
                error: 'Invalid updates!'
            })
        }

        //Check that the category exists
        if (req.body.category) {
            const category = await Category.findById(req.body.category)
            if (!category) {
                return res.status(400).send({
                    error: 'Invalid Category!'
                })
            }
        }

        //This should be in a try catch block as the update might fail due to errors thrown by mongoose. It will be good to return these errors to the user.
        try {
            const updateObject = {}
            updates.forEach(update => {
                //advert[update] = req.body[update]     - Non Atomic
                updateObject[update] = req.body[update]
            })
            console.log(`updateObject: ${JSON.stringify(updateObject)}`)
            const updatedAdvert = await Advert.findOneAndUpdate({ _id: advert._id }, updateObject, { new: true })
            //await advert.save()   - Non Atomic
            return res.status(200).send(updatedAdvert)
        } catch (e) {
            return res.status(400).send({ error: e.message })
        }

    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}

exports.deleteImage = async (req, res) => {

    try {
        // Make sure that the image belongs to the advert
        const image = req.params.imageId
        const advert = req.advert
        var foundIndex = null

        advert.images.forEach((img, i) => {
            if (advert.getImagePublicKey(i) == image)
                foundIndex = i
            //console.log(`advert.getImagePublicKey(i): ${advert.getImagePublicKey(i)}`)
        })
        if (foundIndex == null)
            return res.status(404).send({ error: 'Image does not belong to advert' })

        // Image belongs to the advert        
        const imagePublicId = process.env.CLOUDINARY_FOLDER + image

        try {
            // Delete the image from cloud storage
            const deleteImage = await deleteSingle(imagePublicId)

            // Remove the image from the Advert document
            advert.images.splice(foundIndex, 1)
            await advert.save()
            return res.status(200).send()
        } catch (error) {
            return res.status(404).send({ error })
        }


    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}

exports.addImages = async (req, res) => {
    try {

        const advert = req.advert

        // Make sure that there will only be 5 images for the add before attempting to upload to cloudinary
        const currImageTotal = advert.images.length
        if ((req.files.length + currImageTotal) > 5) {
            return res.status(400).send({ error: 'Too many images! An advert can only have 5 images!' })
        }

        //use this to call the promise which uploads a single image to cloudinary
        const uploader = async (path) => await uploads(path)

        // Save images to cloudinary
        for (const file of req.files) {
            const filePath = file.path
            try {
                const image = await uploader(filePath)
                advert.images.push(image.secure_url)
                //delete image from server uploads directory
                fs.unlinkSync(filePath)
            } catch (e) {
                console.log('Error with cloudinary upload')
                throw new Error('Error uploading images to cloud')
            }
        }

        await advert.save()
        return res.status(200).send(advert)
    } catch (e) {
        clearUploadDirectory(req.files)     // Delete all images from this req from uploads directory if there was an error
        return res.status(500).send({ error: e.message })
    }
}

exports.deleteAdvert = async (req, res) => {
    try {
        const advert = req.advert
        // Delete all images from cloudinary
        var i = 0
        for (image of advert.images) {
            //const imagePublicId = 'mtb/ads/' + advert.getImagePublicKey(i)
            const imagePublicId = process.env.CLOUDINARY_FOLDER + advert.getImagePublicKey(i)
            try {
                const deleteImage = await deleteSingle(imagePublicId)
                console.log(`deleteImage: ${deleteImage}`)
            } catch (e) {
                throw new Error('Error deleting image from Cloud')
            }
            i++
        }
        await advert.remove()
        return res.status(200).send()
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}

/* 
    This will return all ads that belong to a category as well as subcategories

    Future improvement:
        - Error checking of options against array of allowed values
    
*/
exports.listFromCategory = async (req, res) => {
    try {
        var category
        //First get Category. 
        if (req.category) {
            //If the route was called with a category ID, then this will be used.
            category = req.category
        } else {
            //If the route uses the category path, then the below will be used

            //req.params in an array     
            var paramsArray = Object.values(req.params)

            //convert params to lower case
            paramsArray = paramsArray.map((x) => {
                return x.toLowerCase()
            })
            try {
                category = await Category.findOne({ ancestors: paramsArray })
            } catch (e) {
                return res.status(404).send({ errror: 'Category does not exist!' })
            }
        }
        //console.log(`category: ${category}`)
        if (!category) {
            return res.status(404).send({ errror: 'Category does not exist!' })
        }
        //console.log(`category: ${category}`)

        // Get Array of Category's Children IDs plus this Category's ID
        const arrIds = category.allChildrenIds.concat(category._id)

        // Query Options 
        var options = {}
        if (req.query.limit)
            options.limit = parseInt(req.query.limit)
        if (req.query.skip)
            options.skip = parseInt(req.query.skip)
        if (req.query.order)
            options.order = req.query.order
        if (req.query.sort)
            options.sort = req.query.sort

        // console.log(`Query Options: ${JSON.stringify(options)}`)

        // Find All Adverts that have an ID in the above array
        const adverts = await Advert.find({ category: { $in: arrIds } }, null, options)

        return res.status(200).send(adverts)
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}