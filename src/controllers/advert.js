const fs = require('fs')

const mongoose = require('mongoose')

const Advert = require('../models/advert')
const Category = require('../models/category')

const { uploads, deleteSingle } = require('../utils/cloudinary')


/* 
Create

To do: - Only upload the photos after validation has passed!
*/
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
            console.log(`valError: ${valError}`)
            return res.status(400).send({ error: valError.message })
        }

        // Save images to cloudinary
        const images = []
        if (req.files.length > 0) {
            console.log('Files have been uploaded to server')
            const reqString = JSON.stringify(req.files)
            console.log(`Request: ${reqString}`)

            //use this to call the promise which uploads a single image to cloudinary
            const uploader = async (path) => await uploads(path)

            for (const file of req.files) {
                const filePath = file.path
                try {
                    const image = await uploader(filePath)
                    //imageString = JSON.stringify(image)
                    //console.log(`imageString: ${imageString}`)
                    images.push(image.secure_url)
                    //delete image from server uploads directory
                    fs.unlinkSync(filePath)
                } catch (e) {
                    console.log('Error with cloudinary upload')
                    throw new Error('Error uploading images to cloud')
                }
            }
        }
        advert.images = images
        await advert.save()
        return res.status(201).send(advert)
    } catch (e) {
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
For now a user can update their own advert and the update does not need to be approved.

To do: - 
 - Set approved to false when an update is made and only action the updates once approved (i.e. keep advert up until this has happened)
*/

exports.update = async (req, res) => {
    try {
        //First make sure that the advert being modified belongs to the logged in user
        const advert = req.advert
        console.log(`advert.user: ${advert.user}`)
        const user = req.user
        console.log(`user._id: ${user._id}`)



        if (!advert.user.equals(user._id)) {
            console.log('User not valid')
            return res.status(400).send({ error: 'User not authorized!' })

        }

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
            updates.forEach(update => {
                advert[update] = req.body[update]
            })
            await advert.save()
            return res.status(200).send(advert)
        } catch (e) {
            return res.status(400).send({ error: e.message })
        }

    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}

/* 
 Delete Image

 To do: 
    - Make sure image belongs to the advert 
    - Remove image from cloudinary
    - Remove image from advert document
 */
exports.deleteImage = async (req, res) => {

    try {
        // Make sure that the image belongs to the advert
        const image = req.params.imageId
        const advert = req.advert
        var foundIndex = null

        console.log(`image: ${image}`)

        advert.images.forEach((img, i) => {
            if (advert.getImagePublicKey(i) == image)
                foundIndex = i
            console.log(`advert.getImagePublicKey(i): ${advert.getImagePublicKey(i)}`)
        })
        if (foundIndex == null)
            return res.status(404).send({ error: 'Image does not belong to advert' })

        // Image belongs to the advert
        const imagePublicId = 'mtb/ads/' + image
        console.log(`imagePublicId: ${imagePublicId}`)

        try {
            // Delete the image from cloud storage
            const deleteImage = await deleteSingle(imagePublicId)
            console.log(`deleteImage: ${deleteImage}`)
            // Remove the image from the Advert document
            advert.images.splice(foundIndex, 1)
            await advert.save()
            return res.status(200).send()
        } catch (error) {
            console.log(`error: ${error}`)
            return res.status(404).send({ error })
        }


    } catch (e) {
        return res.status(500).send({ error: e.message })
    }
}

exports.addImages = async (req, res) => {
    try {

    } catch (e) {

    }
}