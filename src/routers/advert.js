const express = require('express')
const multer = require('multer')


const { userAuth } = require('../middleware/auth')
const { advertById, advertUserAuth } = require('../middleware/advert')

const { create, display, displayAll, update, deleteImage, addImages } = require('../controllers/advert')

const router = new express.Router()

//Middleware
router.param('advertId', advertById)

//Multer for image uploads - Note other form fields are added to the Req body
// First save the image to local storage. It will be uploaded from here to cloudinary and then deleted
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {     //check for .doc or .docx with REGEX
            return cb(new Error('Please upload a jpg, jpeg, or png file'))
        }
        cb(undefined, true)
    }
})


//Routes

router.post('/ads', userAuth, upload.array('images', 5), create)

router.get('/ads/:advertId', display)
router.get('/ads', displayAll)

router.put('/ads/:advertId', userAuth, update)

//To do
router.delete('/ads/:advertId/:imageId', userAuth, advertUserAuth, deleteImage)     //Delete Single Image
//router.delete(/ads/:advertId/:images, userAuth, deleteAllImage)   //Delete All Images - Future Functionality
//router.put(/ads/:advertId/images, userAuth, addImages)            //Upload Images

module.exports = router