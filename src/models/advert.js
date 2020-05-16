const mongoose = require('mongoose')
const validator = require('validator')
const Filter = require('bad-words')

const filter = new Filter()

/* 
 Advert Schema

 Future improvements:
    - Store images on Cloud Storage such as AWS and store a URL to the photos instead of binary data (this will be cheaper and provide better performance)
*/

const advertSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        validate(value) {
            if (filter.isProfane(value)) {
                throw new Error('Title cannot contain any profanity!')
            }
        }
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 750,
        validate(value) {
            if (filter.isProfane(value)) {
                throw new Error('Description cannot contain any profanit!')
            }
        }
    },
    images: {
        type: [Buffer],
        required: false,    //Change to true
        validate(value) {
            if (value.length > 5) {
                throw new Error('Only 5 images allowed per advert!')
            }
        }
    },

    approved: {             //Only Admins will be able to modify this
        type: Boolean,
        //required: true,
        default: false
    },
    active: {               //User can modify this.
        type: Boolean,
        // required: true,
        default: true
    }

},
    {
        timestamps: true
    })

const Advert = mongoose.model('Advert', advertSchema)
module.exports = Advert