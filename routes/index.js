var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var db = require('monk')('127.0.0.1:27017/node-blog');


router.get('/', function(req, res, next) {
  var db = req.db;
  var posts = db.get('posts');
  posts.find({}, {}, function(err, posts) {
    res.render('index', {
      "posts": posts
    });
  });
});

module.exports = router;
