const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {blogPost} = require('../models');

const {app, runServer, closeServer} = require('../server');
const 