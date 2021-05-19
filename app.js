require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs")
const mongoose=require("mongoose");
const session=require("express-session");
const app=express();
const passport=require("passport"),LocalStrategy = require("passport-local").Strategy;
const passportLocalMongoose=require("passport-local-mongoose");


app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  {passReqToCallback:true},
  function(username,password,done){
    User.findOne({username:username},function(err,user){
      if(err){return done(err);}
      if(!user){return done(null,false);}
      if(!user.verifyPassword(password)){return done(null,false);}
      return done(null,user);
    })
  }
));


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true, useUnifiedTopology: true});

const userSchema=new mongoose.Schema({
  username:String,
  password:String,
  tipText:[]
});
userSchema.plugin(passportLocalMongoose);

const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});
app.post("/login",passport.authenticate("local",{successRedirect:"/tips",failureRedirect:"/login"}));
/*.post(function(req,res){
  const newUser=new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(newUser, function(err) {
    if (err) {
      console.log(err);
    }else{
      passport.authenticate("local",{successRedirect:"/",failureRedirect:"/login"});
      /*passport.authenticate("local",function(err,newUser,info){
        if(err){return next(err);}
        if(!newUser){return res.redirect("/login");}
        req.logIn(newUser,function(err){
          if(err){return next(err);}
          return res.redirect("/tips");
        })
      })*/
//passport.authenticate("local")(req,res,function(){
        //res.redirect("/tips");
      //})
    //}
  //});

//})

app.route("/register")
.get(function(req,res){
  res.render("register");
})
.post(function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/tips");
      });
    }
  });
})

app.get("/tips",function(req,res){
  //if(req.isAuthenticated()){
    User.find({"tipText":{$ne:null}},function(err,foundTips){
      if(err){
        console.log(err);
      }else{
        if(foundTips){
          res.render("tips",{tips:foundTips});
        }
      }
    })
})

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.render("login")
  }
})
app.post("/submit",function(req,res){
  const tip=req.body.tip
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.tipText.push(tip);
        foundUser.save(function(){
          res.redirect("/tips");
        })
      }
    }
  })
});

app.listen(3000,function(){
  console.log("Server starded on port 3000");
})
