# MTB Classifieds Backend
This is a work in progress for the backend of a classifieds website.

The project uses:
    - Node.js
    - Express.js
    - MongoDB
    - Mongoose (with Mpath plugin)
    - Cloudinary Cloud Storage
    - Jest

There is a Postman Collection that can be used for testing. This is located in the project root directory (mtb.postman_collection.json).

The plan is to create a React front-end application which will use the data from this application.

To do list:
- User Model
    - Implement user profile pic
    - Allow user to change email address
    - Validate email address with email service such as SendGrid
- Category Model
    - Jest test still needs to be implemented
    - When a category is deleted, if it has any adverts, then they should be assigned to a special category 'uncategorized'
    - Find a more elegant solution to the CRUD update function
    - Validate that Category paths are unique (This is currently done manually due errors caused by the Mpath functions)
    - Create a function to merge a category with an existing category instead of deleting it
- Advert Model
    - Delete all images of an advert before an advert is deleted. Or add URLs of images to a list of images that are deleted once per day (e.g. CRON job)
    - Implement Image Manipulation with Cloudinary to create uniform images and reduce storage space
    - Currently the approved field is automatically set to true. There will need to be a process implemented for admins to approve new adverts and updates to existing adverts.
    - Create a history of old adverts
    - Allow user to sort images
- Automated Testing (Jest)
    - Automatically Delete All Images from Cloudinary Test folder after testing
    - Test with multiple image uploads
    - Test single image uploads and deleting
    
Future Improvements:
- Improve the Category heirachy. This may involve not using the Mpath plug-in and writing custom functions, or (drastic change) change to another database type that supports atomic updates (such as SQL)
- Implement Comments for Adverts




