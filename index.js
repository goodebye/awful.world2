const bodyParser = require('body-parser');
const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const mn = require('./magic_numbers.json');
let ss;

if (process.env.mode != "PRODUCTION") {
    ss = require('./secretstuff.json');
} 

const port = process.env.PORT || 3001;

if (process.env.mode == "PRODUCTION") { 
    mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ds231245.mlab.com:31245/awfulworld`, {authMechanism: 'ScramSHA1'}).then(
        () => {},
        err => {  console.log(err);  }
    )
}
else {
    mongoose.connect("mongodb://localhost/aw");
}

mongoose.Promise = global.Promise;

// models
const Post = require('./models/post')(mongoose);
const User = require('./models/user');
const Invite = require('./models/invite')(mongoose);

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({ secret: 'trulybad' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.engine('handlebars', exphbs({defaultLayout: false}));
app.set('view engine', 'handlebars');

const adminUsername = process.env.ADMIN_USER || ss.adminUsername;
const adminPassword = process.env.ADMIN_PASS || ss.adminPassword; 

User.register(new User({ username : adminUsername, email: 'test@test.com'}), adminPassword, (err, user) => {
    if (err) {
	console.log(err);
    }
});
 

app.get('/', function(req, res) {
    if (req.isAuthenticated())  {
        if (!req.query.page) req.query.page = 1;
        Post.paginate({published: true}, { sort: { updatedAt: -1 }, page: req.query.page, limit: mn.postsPerPage }).then(function (response) {
            let nextPage = (response.pages > 1 && response.pages > response.page) ? parseInt(response.page) + 1 : null;
            let prevPage = (response.page > 1) ? response.page - 1 : null;

            res.render('home', { posts: response.docs, prevPage: prevPage, nextPage: nextPage, user: req.user });
        }).catch(function(err) { console.log(err) });;
    }
    else {
        let error;

        if (req.query.nicetry) {
            error = "you aren't allowed to do that!! not logged in!!!"
        }
        res.render('landing', { error: error });
    }
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/', failureFlash: true }), (req, res, next) => {
    req.session.save((err) => {

        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

app.get('/settings', isLoggedIn, function(req, res) {
    Post.find({user_id: req.user._id, published: false}, function(err, posts) {
      res.render('settings', {user: req.user, drafts: posts});
    });
});

app.post('/invite/register', (req, res) => {
    if (req.body.invite_id) {
        Invite.findById(req.body.invite_id, function(err, invite) {
            if (!err && invite && invite.active) {
                User.register(new User({ username : req.body.username, inviteId: invite._id}), req.body.password, (err, user) => {
                    if (err) {
                      return res.render('home', { error : err.message });
                    }

                    invite.active = false;
                    invite.save((req, res) => { return });

                    User.findOne({_id: userId}, (err, user) => {
                    });

                    passport.authenticate('local')(req, res, () => {
                        req.session.save((err) => {
                            if (err) {
                                return next(err);
                            }
                            res.redirect('/');
                        });
                    });
                });
            }
            else {
                res.redirect('/');
            }
        })
    }
    else {
        res.redirect('/');
    }
});

app.get('/logout', isLoggedIn, (req, res, next) => {
    req.logout();
    req.session.save((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

app.get('/post', isLoggedIn, function(req, res) {
    if (req.user) {
      const newPost = new Post({ user_id: req.user._id, username: req.user.username });
      
      newPost.save((err) => {
        if (err) {
          console.log(err.message);
          return;
        }
        res.redirect(`/post/${newPost._id}`);
      });
    }
    else {
      res.redirect('/?nicetry=1');
    }
});

app.get('/post/:post_id', isLoggedIn, function(req, res) {
   Post.findById(req.params.post_id, function(err, post) {
     if (err) {
       return res.redirect('/40fucking4');
     }
     if (post.user_id == req.user._id) {
        res.render('create-post', { post });
     }
     else {
         // TODO: make this case, in which the user tries to edit someone else's post, better
        res.redirect('/?nicetry=1?whatthefuck=2');
     }
   });
});

app.post('/post/:post_id', isLoggedIn, function(req, res) {
   Post.findById(req.params.post_id, function(err, post) {
     if (err) {
        return req.redirect 
     }
     if (post.user_id == req.user._id) {
        Post.update({_id: post._id}, { $set: { post: req.body.post, published: req.body.published, title: req.body.title }}, (err, raw) => {
          if (err) {
            console.log(err);
            return;
          }

          if (JSON.parse(req.body.published)) {
            res.redirect('/');
          }
          else {
            res.redirect('/settings');
          }
        });
     }
     else {
         // TODO: make this case, in which the user tries to edit someone else's post, better
        res.redirect('/?nicetry=1?whatthefuck=2');
     }
   });
});


app.get('/40fucking4', function(req, res) {
    res.render('notfound');
});

app.post('/invite/create', isLoggedIn, function(req, res) {
    console.log("\n"+req.user._id)
    if (req.user.remainingInvites > 0) {
        console.log("creating invite!");

        const invite = new Invite({ userId: req.user._id });
        
        invite.save(function(err, invite) {
            if (err) return console.error(err);
            else {
                console.log("did it");
                User.update({_id: req.user._id}, { $push: { invites: invite}, $inc: { remainingInvites: -1}}, function(err, user) {
                    if (err) {
                        return res.redirect('/40fucking4');
                    }
                    res.redirect('/settings');
                });
           }
        });
    }
    else {
        res.redirect('/settings', {error: "out of invites!" });
    }
});

app.get('/invite/:invite_id', function(req, res) {
    Invite.findOne({_id: req.params.invite_id}).exec(function  (err, invite) {
        if (!err && invite) {
            if (req.user) { res.redirect('/');
            }
            else {
                res.render('signup', {invite_id:  req.params.invite_id}); 
            }
        }
        else {
            res.redirect('/40fucking4');
        }
    });
});

app.get('/edit-profile', isLoggedIn, function(req, res) {
    res.render('edit-profile', { user: req.user });    
});

app.post('/edit-profile', isLoggedIn, function(req, res) {
    console.log("profile attempt: ", req.body.profile);
    User.update({_id: req.user._id}, { $set: { profile: req.body.profile }}, function(err, user) {
        if (user) {
            console.log("profile!!!: " + req.user._id);
            res.redirect(`/${req.user.username}`);
        }
        else {
            res.redirect('/40fucking4');
        }
    });
});

app.post('/edit-profile/update', isLoggedIn, function(req, res) {
    console.log("it's me bitch");
    console.log(req.body.profilePreview);
  User.update({_id: req.user._id}, { $set: { profilePreview: req.body.profilePreview }}, function(err, user) {
      res.sendStatus(200);
   });

});

app.get('/:username', isLoggedIn, function(req, res) {
    User.findOne({username: req.params.username}).exec(function (err, user) {
        if (!err && user) {
            Post.find({username: user.username}).sort({updatedAt: '-1'}).limit(mn.postsPerPage).exec(function (err, posts) {
                if (!err) {
                    let canEdit = (req.user._id.equals( user._id)) ? true : false;
                    user.profile = req.query.preview ? user.profilePreview : user.profile
                    console.log(user.profile);
                    res.render('profile', {posts: posts, user: user, canEdit: canEdit});
                }
                else {
                    console.log("wtf!!!!")
                }
             });
        }
        else {
            res.redirect('/40fucking4');
        }
    });
});


app.get('/:username/:_id', isLoggedIn, function(req, res) {
    Post.findOne({_id: req.params._id}).exec(function (err, post) {
        if (!err) {
            res.render('view-post', post);
        }
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    
    res.redirect('/?nicetry=1');
}

app.listen(port, function() {
    console.log("and we're off!");
});
