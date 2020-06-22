const request = require('supertest')

const app = require('../src/app')
const User = require('../src/models/advert')

const { catRoad, adMtb, superAdminUser, adminUser, normalUser, setupDatabase, catMtb } = require('./fixtures/db')
const Advert = require('../src/models/advert')

beforeEach(setupDatabase)

test('Read All Adverts', async () => {
    // This should only display the Advert Title and Category object
    const response = await request(app).get('/api/ads').send({
    }).expect(200)

    expect(response.body[0]).toMatchObject({
        title: adMtb.title,
        category: expect.anything()     // Checks that this is not null
    })
})

test('Read Advert', async () => {
    const response = await request(app).get(`/api/ads/${adMtb._id}`).send().expect(200)
})

test('Create Advert with Images', async () => {
    const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${normalUser.tokens[0].token}`)
        .field('category', `${catRoad._id}`)
        .field('title', "New Road Bike Ad")
        .field('description', "This is the advert description")
        .field('price', 45.78)
        .attach('images', 'tests/fixtures/images/mtb_1.jpg')
        .expect(201)

    // Assert that image was uploaded to cloudinary
    const advert = response.body
    expect(advert.images[0]).toEqual(
        expect.stringContaining('ttps://res.cloudinary.com/')
    )

    // Note: At this stage images in the cloudinary test folder need to be manualy deleted of running tests.
})

test('Attempt to create Advert without logged in user', async () => {
    const response = await request(app)
        .post('/api/ads')
        .field('category', `${catRoad._id}`)
        .field('title', "New Road Bike Ad")
        .field('description', "This is the advert description")
        .field('price', 45.78)
        .attach('images', 'tests/fixtures/images/mtb_1.jpg')
        .expect(401)
})

test('Modify existing advert', async () => {
    const response = await request(app)
        .put(`/api/ads/${adMtb._id}`)
        .set('Authorization', `Bearer ${normalUser.tokens[0].token}`)
        .send({
            category: catRoad._id,
            title: 'New Road Bike Category',
            price: 20.54
        }).expect(200)

    // Assert that the changes have been made
    const advert = await Advert.findById(adMtb._id)
    expect(advert).toMatchObject({
        category: catRoad._id,
        title: 'New Road Bike Category',
        price: 20.54
    })
})

test('Delete existing advert', async () => {
    const response = await request(app)
        .delete(`/api/ads/${adMtb._id}`)
        .set('Authorization', `Bearer ${normalUser.tokens[0].token}`)
        .send().expect(200)
})

test('Read All MTB Category Adverts based on id', async () => {
    // This should only display the Advert Title and Category object
    const response = await request(app).get(`/api/c/id/${catMtb._id}`).send({
    })
        .expect(200)

    // Assert that the correct ad is returned
    expect(response.body[0]).toMatchObject({
        title: adMtb.title,
        category: expect.anything()     // Checks that this is not null
    })
})

test('Read All MTB Category Adverts based on ancestor path', async () => {
    // This should only display the Advert Title and Category object
    const response = await request(app).get(`/api/c/mtb`).send({
    })
        .expect(200)

    // Assert that the correct ad is returned
    expect(response.body[0]).toMatchObject({
        title: adMtb.title,
        category: expect.anything()     // Checks that this is not null
    })
})

