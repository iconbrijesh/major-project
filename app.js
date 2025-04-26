if (process.env.NODE_ENV != "production") {
  require('dotenv').config();
}
const express = require("express");
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");






// use ejs-locals for all ejs templates:
app.engine('ejs', ejsMate);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));


// const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => { console.log("mongoDb connected") })
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
};

const store = MongoStore.create({
  mongoUrl:dbUrl,
  crypto: {
    secret:process.env.SECRET,
  },
  touchAfter:24*3600
})
store.on("error", ()=>{
  console.log("Error in mongo session store", error);
})

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    maxAge: 3 * 24 * 60 * 60 * 1000,
    httpOnly: true
  },
};




app.use(session(sessionOptions));
app.use(flash()); //routes require kar rahe hai ussye phale require karna hai

app.use(passport.initialize());
app.use(passport.session());
//use static authenticate model in localStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;

  next();
});
app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
    email: "fakestudent@gmail.com",
    username: "sigma-student",
  });
  const registeredUser = await User.register(fakeUser, "helloworld");
  res.send(registeredUser);
});

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


// app.all(/.*/, (req, res, next) => {
//   next(new ExpressError(404, "Page Not Found"));
// });
// app.all(/^.*$/, (req, res, next) => {
//   next(new ExpressError(404, "Page Not Found"));
// });

//error handling middleware
app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong" } = err;
  res.status(status).render("error.ejs", { message });
});


app.listen(8080, () => {
  console.log(`app is listening on port ${8080}`);
});