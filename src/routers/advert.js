const express = require('express')
const multer = require('multer')


const { userAuth } = require('../middleware/auth')
const { advertById, advertUserAuth } = require('../middleware/advert')
const { categoryById } = require('../middleware/category')

const { create, display, displayAll, update, deleteImage, addImages, deleteAdvert, listFromCategory } = require('../controllers/advert')

const router = new express.Router()

//Middleware
router.param('advertId', advertById)
router.param('categoryId', categoryById)


/* 
 multer is used to handle the image uploads.

 It is middleware that uploads the user's files to the '/uploads' directory and saves the file path(s) to the request, along with the rest of the form data.
 The images are uploaded to cloudinary from the uploads folder. 
 Once the upload is complete, or if there are errors with the uploads, the files are deleted from the uploads directory.
 
*/
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


// Routes

router.post('/ads', userAuth, upload.array('images', 5), create)

router.get('/ads/:advertId', display)
router.get('/ads', displayAll)

router.put('/ads/:advertId', userAuth, advertUserAuth, update)
router.delete('/ads/:advertId', userAuth, advertUserAuth, deleteAdvert)

// Image Routes
router.delete('/ads/:advertId/:imageId', userAuth, advertUserAuth, deleteImage)     //Delete Single Image
router.put('/ads/:advertId/images', userAuth, upload.array('images', 5), advertUserAuth, addImages)     //Upload Images

// List Adverts based on Category
router.get('/c/id/:categoryId', listFromCategory)
// The below routes are better SEO
router.get('/c/:grandparent/:parent/:child', listFromCategory)
router.get('/c/:parent/:child', listFromCategory)
router.get('/c/:child', listFromCategory)

module.exports = router