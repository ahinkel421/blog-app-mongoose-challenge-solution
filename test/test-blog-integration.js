const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogPostData() {
	console.info('seeding blog post data');
	const seedData = [];

	for(let i = 1; i <= 10; i++) {
		seedData.push(generateBlogPostData());
	}
	return BlogPost.insertMany(seedData);
}

function generateBlogPostData() {
	return {
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		},
		title: faker.random.word(),
		content: faker.random.words(),
		created: faker.date.past()
	}
}

function tearDownDb() {
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('blogPost API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedBlogPostData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	})

	describe('GET endpoint', function() {
		it('should return all existing blog posts', function() {

			let res;
			return chai.request(app)
			.get('/posts')
			.then(function(_res) {
				res = _res;
				res.should.have.status(200);
				res.body.posts.should.have.length.of.at.least(1);
				return BlogPost.count();
			});
		});
		it('should return blog posts with right fields', function() {

			let resBlogPost;
			return chai.request(app)
			.get('/posts')
			.then(function(res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.posts.should.be.a('array');
				res.body.posts.should.have.length.of.at.least(1);

				res.body.posts.forEach(function(post) {
					post.should.be.a('object');
					post.should.include.keys('id', 'author', 'title', 'content', 'created');
				});
				resBlogPost = res.body.posts[0];
				return BlogPost.findById(resBlogPost.id);
			})
			.then(function(post) {
				resBlogPost.id.should.equal(post.id);
				resBlogPost.author.should.contain(post.author.firstName);
				resBlogPost.author.should.contain(post.author.lastName);
				resBlogPost.title.should.equal(post.title);
				resBlogPost.content.should.equal(post.content);
			});
		});
	});

	describe('POST endpoint', function() {
		it('should add a new blog post', function() {

			const newBlogPost = generateBlogPostData();

			return chai.request(app)
			.post('/posts')
			.send(newBlogPost)
			.then(function(res) {
				res.should.have.status(201);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.should.include.keys('id', 'author', 'title', 'content', 'created');
				res.body.title.should.equal(newBlogPost.title);
				res.body.content.should.equal(newBlogPost.content);
				return BlogPost.findById(res.body.id);
			})
			.then(function(post) {
				post.author.firstName.should.equal(newBlogPost.author.firstName);
				post.author.lastName.should.equal(newBlogPost.author.lastName);
				post.title.should.equal(newBlogPost.title);
				post.content.should.equal(newBlogPost.content);
			});
		});
	});

	describe('PUT endpoint', function() {
		it('should update the blog post fields you send over', function() {
			const updateData = {
				title: 'updated title',
				content: 'this new content is awesome, right?'
			};

			return BlogPost
			.findOne()
			.then(function(post) {
				updateData.id = post.id;
				//making request...
				return chai.request(app)
				.put(`/posts/${post.id}`)
				.send(updateData);
			})
			//...return updated post... 
			.then(function(res) {
				res.should.have.status(201);
				return BlogPost.findById(updateData.id);
			})
			//...then inspect and make sure it reflects the data we sent over.
			.then(function(post) {
				post.title.should.equal(updateData.title);
				post.content.should.equal(updateData.content);
			});
		});
	});

	describe('DELETE endpoint', function() {
		it('should delete a blog post by id', function() {
			let post;

			return BlogPost
			.findOne()
			.then(function(_post) {
				post = _post;
				return chai.request(app).delete(`/posts/${post.id}`);
			})
			.then(function(res) {
				res.should.have.status(204);
				return BlogPost.findById(post.id);
			})
			.then(function(_post) {
				should.not.exist(_post);
			});
		});
	});
});


