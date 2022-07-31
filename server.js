'use strict';
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const apiRoutes = require('./routes/api.js');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'REGION' });
let dynamodb = new AWS.DynamoDB();
const app = express();
/* const Book = new mongoose.Schema({
    title: String,
    comments: Array,
    commentcount: Number
}); */
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Index page (static HTML)
app.route('/')
    .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});
//Routing for API 
apiRoutes(app, dynamodb);
//404 Not Found Middleware
app.use(function (req, res, next) {
    res.status(404)
        .type('text')
        .send('Not Found');
});
//Start our server and tests!
app.listen(3000, function () {
    console.log("Listening on port 3000");
});
module.exports = app; //for unit/functional testing
