var express = require('express');
var router = express.Router();
const userModel = require('./users')
const postModel = require('./posts')
const passport = require('passport');
const flash = require('connect-flash')
const localStretegy = require('passport-local')
const upload = require('./multer')
const pfpupload = require('./multer2')
const bannerUpload = require('./multer3')
const axios = require('axios')
const fs=require('fs')
passport.use(new localStretegy(userModel.authenticate()));
require('dotenv').config({ path: './api_key.env' });


// middleware that is specific to this router ,for maintaining the logs
const timeLog = (req, res, next) => {
  // console.log('Time: ', Date.now())
  let a=new Date()
  let b= a.toTimeString();
  console.log(`timestamp: ${b}`);
  fs.appendFileSync("logs.txt",`timestamp m1:${b} and req type is ${req.method} and headers are ${req.header}\n\n`)
  next()
}
router.use(timeLog)

router.get('/', function (req, res, next) {
  res.render('index',{ error: req.flash('error') });
});

router.get('/add_posts', isloggedIn,function (req, res, next) {
  res.render('add_posts');
});

// also write sucess flash message
router.get('/login', function (req, res, next) {
  res.render('login', { error: req.flash('error') });//using flash message for error in login
});


// feed router fatch images dynamically from unsplash api 
// with dynamic searching
router.get('/feed', isloggedIn, async (req, res) => {
  const query = req.query.query || 'unique'
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
      params: {
        query: query, // dynamic search query for images
        per_page: 30, // Number of images to fetch
      },
    });

    const images = response.data.results.map(image => ({
      url: image.urls.regular,
      name: image.alt_description || 'No description available',
    }));

    res.render('feed', { images });
  } catch (error) {
    console.error('Error fetching images from Unsplash API:', error);
    res.status(500).send('Server Error');
  }
});

router.get('/profile', isloggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
    //finding the user and printing it on profile page dynamically:
    //you just have to define once here other data of user will be in this automatically just use what you passed in render and the variable like you passed variable as user so then you have to use <%=user.username%> <%=user.password%> etc.

    // below populate is used because o/p is id or something that you dont want, after using populate it will store real data of post
    .populate('posts')
    .populate('dp')
    .populate('banner')
    .exec();

  res.render('profile', { user });//passing variable user as above declared that contains username    

});

router.get('/show/allpost', isloggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })

    .populate('posts')

  res.render('show', { user });//passing variable user as above declared that contains username    

});

// we are using passport so you have to define validations like this:
// const validatePassword = (password) => {
//   if (password.length < 5) {
//       return false;
//   }
//   return true;
// };

router.post('/register', function (req, res, next) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname
  })
  userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true // Enable failure flash messages
      })(req, res, next);
    }).catch(function (err) {
  // Handle registration errors here
  req.flash('error', 'Registration failed: ' + err.message); // Flash error message
  res.redirect('/'); // Redirect to registration page on failure
});
});

router.post('/login', passport.authenticate('local', {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function (req, res, next) {
  res.redirect('/')
});

router.post('/upload', isloggedIn, upload.single('file'), async function (req, res, next) {
  if (!req.file) {
    return res.status(400).send("NO FILES CHOOSEN")
  }
  const user = await userModel.findOne({ username: req.session.passport.user })

  // post sending to profile page 
  const post = await postModel.create({
    image: req.file.filename,
    imagetext: req.body.filecaption,
    imagedesc: req.body.filedesc,
    user: user._id
  })
  //  res.send("file uploaded sucessfully")

  // sending post id to user
  user.posts.push(post._id)
  await user.save();
  res.redirect("/show/allpost")
});

router.post('/pfpupload', isloggedIn, pfpupload, async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file selected');
    }

    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      throw new Error('User not found');
    }

    user.dp = req.file.filename;
    await user.save();

    console.log('Profile picture uploaded successfully:', req.file.filename);
    res.redirect('/profile');
  } catch (err) {
    console.error('Profile picture upload error:', err.message);
    res.status(400).send({ msg: err.message });
  }
});

router.post('/bannerupload', isloggedIn, bannerUpload, async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file selected');
    }

    // Handle banner image upload logic here (e.g., saving to database)
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      throw new Error('User not found');
    }

    user.banner = req.file.filename;
    await user.save();

    console.log('Banner image uploaded successfully:', req.file.filename);
    res.redirect('/profile'); // Redirect to profile or another page after upload
  } catch (err) {
    console.error('Banner image upload error:', err.message);
    res.status(400).send({ msg: err.message });
  }
});

router.get('/logout', isloggedIn, function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


// router for deleting post from the show.ejs file means from all user's pins
router.post('/delete/:id', isloggedIn, async (req, res) => {
  try {
    const postId = req.params.id;
    const user = await userModel.findOne({ username: req.session.passport.user });

    // Remove the post from the user's posts array
    user.posts.pull(postId);
    await user.save();

    // Delete the post from the database
    await postModel.findByIdAndDelete(postId);

    res.redirect('/show/allpost');
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).send('Server Error');
  }
});


function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}


module.exports = router;
