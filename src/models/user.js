const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

/*
User Schema:    
    - Level: 0 = normal user, 1 = admin, 2 = super-admin
    - Email must be unique
    - Postcode can only be decimal number for now
    - Tokens[] allow the user to be logged in on multiple devices
    - Phone must be mobile phone number (Aus type)
*/
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: Number,
        required: true,

    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid!')
            }
        }
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isMobilePhone(value, 'en-AU')) {
                throw new Error('Mobile Phone number must be an Australian number!')
            }
        }
    },
    postcode: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isPostalCode(value, 'AU')) {
                throw new Error('Post code must be a valid Australian post code!')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        trim: true
    },
    tokens: [{
        token: {
            type: String,
            required: true,
        }
    }],
    profilePic: {
        type: Buffer
    }
},
    { timestamps: true }

)

// #### User Methods ####
userSchema.methods.createAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

//Hide private user information and profile pic (reduce response size) from the Client
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    //delete userObject.level   - Investigate whether this is a security risk
    delete userObject.password
    delete userObject.tokens
    delete userObject.profilePic

    return userObject
}

// #### User Static Functions ###
//Static functions should not be arrow functions

//Authenticate email and password. Return authenticated user
userSchema.statics.authenticate = async function (email, password) {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error('Email or password incorrect!')
    }

    const valPassword = await bcrypt.compare(password, user.password)
    if (!valPassword) {
        throw new Error('Email or password incorrect!')
    }
    return user
}

// ##### User Middleware ####

//Hash plaintext password
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})


// #### Export ###
const User = mongoose.model('User', userSchema)
module.exports = User