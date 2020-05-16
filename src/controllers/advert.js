const mongoose = require('mongoose')

const Advert = require('../models/advert')
const Category = require('../models/category')

exports.create = async (req, res) => {
    try {
        // Prevent users from approving adverts
        if (req.body.approved) {
            return res.status(400).send({ error: "Only admins may approve an advert!" })
        }
        const user = req.user
        const advert = new Advert(req.body)
        advert.user = user._id

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
For now a user can update the advert and the update does not need to be approved.

To do: - Set approved to false when an update is made and only action the updates once approved (i.e. keep advert up until this has happened)
*/

exports.update = async (req, res) => {
    try {
        //First make sure that the advert being modified belongs to the logged in user
        const advert = req.advert
        const user = req.user

        if (advert.user != user._id) {
            res.status(400).send({ error: 'User not authorized!' })
        }

        //Updates the client is attempting to make
        const updates = Object.keys(req.body)
        //Updates all users may make
        const allowedUpdates = ['category', 'title', 'description', 'images', 'active']
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
        const category = await Category.findById(req.body.category)
        if (!category) {
            return res.status(400).send({
                error: 'Invalid Category!'
            })
        }

        //This should be in a try catch block as the update might fail due to errors thrown by mongoose. It will be good to return these errors to the user.
        try {
            updates.forEach(update => {
                advert[update] = req.body[update]
            })
            await advert.save()
        } catch (e) {
            res.status(400).send({ error: e.message })
        }

    } catch (e) {
        res.status(500).send({ error: e.message })
    }
}