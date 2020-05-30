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
    }, price: {
        type: Number,
        required: true,
        min: 0
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
        type: [String],
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


//Returns the Cloudinary Public Key of the Image stored at the given index in the Images property. If there are no images, it will return null
advertSchema.methods.getImagePublicKey = function getImagePublicKey(index) {
    const advert = this
    if (advert.images.length == 0) {
        return null
    }
    const iString = advert.images[index]
    return iString.substring(iString.lastIndexOf('/') + 1, iString.lastIndexOf('.'))

}

const Advert = mongoose.model('Advert', advertSchema)
module.exports = Advert