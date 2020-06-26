// Use this for automated testing of the database
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const User = require('../../src/models/user')
const Category = require('../../src/models/category')
const Advert = require('../../src/models/advert')

//Setup users
const normalUserId = new mongoose.Types.ObjectId()
const normalUser = {
    _id: normalUserId,
    name: 'Peter',
    level: 0,
    email: 'peter@peter.com',
    password: 'Peter123!',
    phone: '0451345899',
    postcode: '6019',
    tokens: [{
        token: jwt.sign({ _id: normalUserId }, process.env.JWT_SECRET)
    }]
}

const adminUserId = new mongoose.Types.ObjectId()
const adminUser = {
    _id: adminUserId,
    name: 'John',
    level: 1,
    phone: '0451834557',
    postcode: '6014',
    email: 'john@john.com',
    password: 'John123!',
    tokens: [{
        token: jwt.sign({ _id: adminUserId }, process.env.JWT_SECRET)
    }]
}

const superAdminUserId = new mongoose.Types.ObjectId()
const superAdminUser = {
    _id: superAdminUserId,
    name: 'Gary',
    level: 2,
    phone: '0451834557',
    postcode: '6014',
    email: 'gary@gary.com',
    password: 'Gary123!',
    tokens: [{
        token: jwt.sign({ _id: superAdminUserId }, process.env.JWT_SECRET)
    }]
}

// Setup Categories
const catRoad = {
    _id: new mongoose.Types.ObjectId(),
    name: "Road"
}

const catMtb = {
    _id: new mongoose.Types.ObjectId(),
    name: "MTB"
}

const catAccessories = {
    _id: new mongoose.Types.ObjectId(),
    name: "Accessories"
}


// Setup Adverts
const adMtb = {
    _id: new mongoose.Types.ObjectId(),
    user: normalUser._id,
    category: catMtb._id,
    title: "MTB Advert",
    description: "This is a MTB advert",
    price: 45.0,

}

const adRoad = {
    _id: new mongoose.Types.ObjectId(),
    user: adminUser._id,
    category: catRoad._id,
    title: "Road Advert",
    description: "This is a Road advert",
    price: 15.0,
}


//Clear Database and add the initial test data
const setupDatabase = async () => {

    await Advert.deleteMany()
    await User.deleteMany()
    await Category.deleteMany()

    await new User(normalUser).save()
    await new User(adminUser).save()
    await new User(superAdminUser).save()

    await new Category(catMtb).save()
    await Category.crudUpdate()
    await new Category(catRoad).save()
    await Category.crudUpdate()
    await new Category(catAccessories).save()
    await Category.crudUpdate()

    await new Advert(adMtb).save()
    await new Advert(adRoad).save()
}

const tearDown = async () => {
    await Category.deleteMany({}).exec()
}

module.exports = {
    normalUserId,
    normalUser,
    adminUserId,
    adminUser,
    superAdminUserId,
    superAdminUser,
    catRoad,
    catMtb,
    catAccessories,
    adMtb,
    adRoad,
    setupDatabase,
    tearDown
}