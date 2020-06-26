const request = require('supertest')

const app = require('../src/app')
const User = require('../src/models/user')

const { superAdminUser, adminUser, normalUser, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

test('Signup a new user', async () => {
    const response = await request(app).post('/api/users/signup/').send({
        name: 'Good Test',
        email: 'good@good.com',
        password: 'Good123!',
        level: 0,
        phone: '0451834789',
        postcode: '6047'
    })
    // console.log(`response: ${JSON.stringify(response.body)}`)
    expect(response.status).toBe(201)

    // Assert that the user is actually saved in the database
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBe(null)

    // Assert that the response is correct by checking the response object
    expect(response.body).toMatchObject({
        user: {
            name: 'Good Test',
            email: 'good@good.com'
        },
        token: user.tokens[0].token
    })

    // Assert that password hasing is functioning correctly
    expect(user.password).not.toBe('Good123!')
})

test('Sign In existing User', async () => {
    const response = await request(app).post('/api/users/signin').send({
        email: normalUser.email,
        password: normalUser.password
    }).expect(200)
})

test('Attempt Sign-in with incorrect login details', async () => {
    const response = await request(app).post('/api/users/signin').send({
        email: normalUser.email,
        password: 'Password123!'
    }).expect(400)
})

test('Sign-out a user', async () => {
    const response = await request(app)
        .post('/api/users/signout')
        .set('Authorization', `Bearer ${normalUser.tokens[0].token}`)
        .send()
        .expect(200)

    // Assert that the token has been removed from the user
    const user = await User.findById(normalUser._id)
    expect(user.tokens.length).toBe(0)
})

test('Sign-out a user from all devices', async () => {
    const response = await request(app)
        .post('/api/users/signoutall')
        .set('Authorization', `Bearer ${normalUser.tokens[0].token}`)
        .send()
        .expect(200)

    // Assert that all tokens have been removed from the user
    const user = await User.findById(normalUser._id)
    expect(user.tokens.length).toBe(0)
})

test('Get logged in users profile', async () => {
    const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${normalUser.tokens[0].token}`)
        .send()
        .expect(200)

    //Assert User data displayed is correct
    const user = response.body
    expect(user).toMatchObject({
        name: normalUser.name,
        email: normalUser.email,
        phone: normalUser.phone
    })
})

test('Attempt to get user profile when not logged in', async () => {
    const response = await request(app).get('/api/users/profile').send().expect(401)
})

test('Update user information', async () => {
    const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${normalUser.tokens[0].token}`)
        .send({
            name: 'New Name',
            phone: '0451834557'
        })
    console.log(`User Update Response: ${JSON.stringify(response.body)}`)
    expect(response.status).toBe(200)
})

test('User can delete their own profile', async () => {
    const response = await request(app)
        .delete('/api/users/profile')
        .set('Authorization', `Bearer ${normalUser.tokens[0].token}`)
        .send()
    expect(response.status).toBe(200)

    //Assert that user is deleted
    const user = await User.findById(normalUser._id)
    expect(user).toBe(null)
})

test('Attempt to delete user profile when not logged in', async () => {
    const response = await request(app)
        .delete('/api/users/profile')
        .send()
    expect(response.status).toBe(401)
})


test('Only admin can view other user profile', async () => {
    const response = await request(app).get(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${normalUser.tokens[0].token}`)
        .send(
        ).expect(401)
})

test('Admin can view other user profile', async () => {
    const response = await request(app).get(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${superAdminUser.tokens[0].token}`)
        .send(
        ).expect(200)
})

test('Admin can delete other user profile', async () => {
    const response = await request(app).delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${superAdminUser.tokens[0].token}`)
        .send(
        ).expect(200)

    //Assert user is deleted
    const user = await User.findById(adminUser._id)
    expect(user).toBe(null)
})


