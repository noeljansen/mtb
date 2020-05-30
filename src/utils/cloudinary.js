const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})


//This wraps the cloudinary uploader in a promise, which allows us to upload multiple images and then send a response to the client
exports.uploads = (filePath) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            filePath,
            { folder: "mtb/ads" },
            function (error, image) {
                if (error) {
                    return reject('Error uploading image to cloud!')
                }
                console.log('Image uploaded to the server')
                resolve(image)
            }
        )
    })
}

//This wraps the cloudinary destroy in a promise
exports.deleteSingle = (publicKey) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(
            publicKey,
            (error, result) => {
                if (error || result.result != "ok") {
                    console.log(`Delete Error: ${result.result}`)
                    return reject(result.result)
                }
                console.log('Image deleted from server')
                return resolve(result.result)
            }
        )
    })
}