const request = require('supertest')
const mongoose = require('mongoose')

const app = require('../src/app')
const User = require('../src/models/user')

const { catMtb, catRoadId, catRoad, superAdminUser, adminUser, normalUser, setupDatabase, tearDown } = require('./fixtures/db')

beforeEach(setupDatabase)


afterEach((done) => {
    // This is needed to delete the index from the collection. Otherwise Jest causes errors with mpath.
    mongoose.connection.collections.categories.drop(() => {
        done()
    })
})

test('Category Setup Test', (done) => {
    done()
})



