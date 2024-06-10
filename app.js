if(process.NODE_ENV!="production"){
    require("dotenv").config();
}

const express=require("express");
const app=express();
const User=require("./models/user.js");
const mongoose=require("mongoose");
const session=require("express-session");
const mongodb=require("mongodb");
const dburl=process.env.ATLASDB_URL;

let port=8080;

const flash=require("connect-flash");
app.use(flash());
app.set("view engine","ejs");
const path=require("path");
app.set("views",path.join(__dirname,"/views"));

app.use(express.urlencoded({extended:true}));
app.use(express.json());
// const multer=require('multer');
// const upload=multer({dest:""})

const ejsMate=require("ejs-mate");
app.engine("ejs",ejsMate);

app.use(express.static("public"));
app.use(express.static(path.join(__dirname,"public/css")));
app.use(express.static(path.join(__dirname,"public/js")));


const passport=require("passport");
const localStrategy=require("passport-local");
const MongoStore=require("connect-mongo");
const store=MongoStore.create({
    mongoUrl:dburl,
    crypto:{
        secret:"mySuperSecretCode",
    },
    touchAfter:24*3600,
});
const sessionOptions={
    store,
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
      expires:Date.now()*7*24*60*60*1000,
      maxAge:7*24*60*60*1000,
    }
  };

app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    console.log(res.locals.currUser);
    next();
});


main()
.then((res)=>{
    console.log("connection with database formed successfully");
})
.catch(err => console.log(err));

async function main() {
//   await mongoose.connect('mongodb://127.0.0.1:27017/fmc');
  await mongoose.connect(dburl);
};


app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
});

app.post("/signup",async(req,res)=>{
   try{
    let{username,email,password}=req.body;
    const newUser=new User({email,username});
    const registeredUser=await User.register(newUser,password);
    req.login(registeredUser,(err)=>{
        if(err){
            return next(err);
        }
        res.redirect("/home");
    });
   }catch(err){
    res.send("some error occured"+err);
   }

});
app.get("/home",(req,res)=>{
    res.render("home.ejs");
});

app.get("/login",(req,res)=>{
    res.render("users/login.ejs");
});

app.post("/login",passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),(req,res)=>{
    res.redirect("/home");
});

app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        res.redirect("/home");
    });
});


// app.use((req,res)=>{
//     console.log("request received");
// });
app.use((err,req,res,next)=>{
    console.log(err);
});
app.listen(port,()=>{
    console.log(`app is listening on port ${port}`);
});