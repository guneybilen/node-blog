var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path')
// var mkdirp = require('mkdirp');


var storage = multer.diskStorage({
    
    destination: function (req, file, cb) {
        var dest = 'public/images/uploads/';
        //   mkdirp.sync(dest);
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
  }
});

var upload = multer({ storage: storage }).single('mainimage');

var mongo = require('mongodb');
var db = require('monk')('localhost/node-blog');

router.get('/show/:id', function(req, res, next) {
    var posts = db.get('posts');
    posts.findById(req.params.id, function(err, post) {
        res.render('show', {
            "post": post
        });
    });
});

router.get('/add', function(req, res, next) {
    var categories = db.get('categories');

    categories.find({}, {}, function(err, categories) {
        res.render('addpost', {
            "title": "Add Post",
            "categories": categories
        });
    });
});

router.post('/add', function(req, res, next) {
    upload(req, res, function (err) {
        // Get form values
        var title       = req.body.title;
        var category    = req.body.category;
        var body        = req.body.body;
        var author      = req.body.author;
        var date        = new Date();

        // Form validation
        req.checkBody('title', 'Title field is required').notEmpty();
        req.checkBody('body', 'Body field is required');

        var errors = req.validationErrors();

         if (err) {
          // An error occurred when uploading
        //   res.render('index', {
        //       'errors': err
        //   });
          console.log(err);
        }
        
        else if (errors) {
            console.log('+++++++++++++++++ ', errors);
          res.render('addpost', {
            errors: errors,
            "title": title,
            "body": body
          });
        } 
        
        else {
          var posts = db.get('posts');

          // Submit to database
          posts.insert({
             "title": title,
             "body": body,
             "category": category,
             "date": date,
             "author": author,
             "mainimage": req.file.filename
          }, function(err, post) {
             if (err) {
                res.send('There was an issue submitting the post');
             } else {
                req.flash('success', 'Post Submitted');
                res.location('/');
                res.redirect('/');
             }
          });

        }
    });
});


router.post('/addcomment', function(req, res, next) {
    // Get form values
    var name        = req.body.name;
    var email       = req.body.email;
    var body        = req.body.body;
    var postid      = req.body.postid;
    var commentdate = new Date();

    // Form validation
    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Email is incorrectly formatted').isEmail();
    req.checkBody('body', 'Body field is required').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        var posts = db.get('posts');
        posts.findById(postid, function(err, post) {
            res.render('show', {
                "errors": errors,
                "post": post
            });
        });
    } else {
        var comment = {
            "name": name,
            "email": email,
            "body": body,
            "commentdate": commentdate
        };

        var posts = db.get('posts');

        posts.update({
                "_id": postid
            },
            {
                $push:{
                    "comments": comment
                }
            },
            function(err, doc) {
                if(err) {
                    throw err
                } else {
                    req.flash('success', 'Comment added');
                    res.location('/posts/show/' + postid);
                    res.redirect('/posts/show/' + postid);
                }
            }
          );
      }
});

module.exports = router;
