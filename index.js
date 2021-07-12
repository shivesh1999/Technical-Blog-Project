//Intialize Express 
const express=require('express');
const app = express();
var methodoverride=require('method-override');
app.use(methodoverride('_method'))
//Seting up views folder of static content
const path = require('path');
app.set('views',path.join(__dirname,'views'));
//Setting the view engine
app.set('view engine','ejs')
app.use('/assets',express.static('assets'));
const User = require('./models/user');
const Post = require('./models/posts');
const comments = require('./models/comments');
//Database connetcion
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/auth', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Database Connected")
});
app.use(express.urlencoded({extended: true }));
const bcrypt=require('bcrypt')
const session=require('express-session');
const user = require('./models/user');
const posts = require('./models/posts');
const { SlowBuffer } = require('buffer');
const flash = require('connect-flash');

app.use(session({secret:'user feeds',
saveUninitialized: true,
resave: true}))
app.use(flash());
app.use((req,res,next)=>{
    res.locals.success=req.flash('success');
    next();
})
const requireLogin=(req,res,next)=>{
    if(!req.session.user_id)
    {
       return res.redirect('/login')
    }
    next();
}
app.listen(8080,()=>{
    console.log("Port 8080 : Activated");
})
app.get('/', async (req, res)=>
{
    const posts = await Post.find({})
    req.flash('notify', 'Success!!');
    res.render('index.ejs', { post : posts });
})
app.get('/login', (req, res)=>
{
    res.render('login.ejs');
})
app.post('/login', async (req, res)=>
{
    const { email, password} = req.body;
    try{
    const user= await User.findOne({ email });
    const validPassword = await bcrypt.compare(password,user.password);
    if(validPassword)
    {
        req.session.user_id=user._id;
        req.session.firstname=user.firstname;
        req.session.lastname=user.lastname;
        req.session.fullname=user.firstname+" "+user.lastname;
        req.session.email=user.email;
        req.session.dateofbirth=user.day+"/"+user.month+"/"+user.year;
        req.session.gender=user.gender;
        res.redirect('/feeds')
    }
    else
    {
        req.flash('success','Invalid username or password.');
        res.redirect('/login')
    }
    }
    catch(err)
    {
        req.flash('success','Invalid username or password.');
        res.redirect('/login')
    } 
})
app.get('/signup',(req,res)=>{
    res.render('signup.ejs')
})
app.post('/signup', async (req,res)=>{
    const {firstname,lastname,email,password,day,month,year,gender}= req.body;
    const hash=await bcrypt.hash(password,12);
    const user=new User({
        firstname,lastname,email,password:hash,day,month,year,gender
    })
    await user.save();
    req.flash('success','Sucessfully created your Account.');
    res.redirect('/login');
})
app.get('/feeds',requireLogin,async (req,res)=>{
    const posts = await Post.find({})
    res.render('feeds.ejs',{ name : req.session.firstname, post : posts})
})
app.get('/logout',(req,res)=>{
    req.session.user_id=null;
    res.redirect('/')
})
app.post('/post',requireLogin, async (req,res)=>{
    const {topic,content}=req.body;
    const Id = req.session.user_id;
    const Name = req.session.firstname;
    const post= new Post({
        topic,content,name:Name,userid:Id
    })
    await post.save();
    req.flash('success','Post Successfull');
    res.redirect('/feeds')
})
app.get('/profile',requireLogin, async (req,res)=>{
    const id = req.session.user_id;
    const currentuser = await User.find({ email :  req.session.email});
    const posts  = await Post.find({userid : id});
    res.render('profile.ejs',{ name : req.session.firstname, post : posts, user : currentuser});
})
app.delete('/profile/:id',async (req,res)=>{
    const {id}=req.params;
    const deletedProduct=await Post.findByIdAndDelete(id);
    res.redirect('/profile')
})
app.get('/profile/:id/edit', async (req,res)=>{
    const {id}=req.params;
    const reqpost = await Post.findById(id);
    res.render('edit.ejs',{ post: reqpost });
})
app.put('/profile/:id/edit', async (req,res)=>{
    const {id}=req.params;
    const post= await Post.findByIdAndUpdate(id,req.body)
    res.redirect('/profile')
})
app.get('/post/:id',requireLogin, async(req,res) => {
    const {id}= req.params;
    const post = await Post.findById(id);
    const allcomments= await comments.find({postid:id})
    res.render('post.ejs',{name : req.session.firstname, post : post,comments: allcomments });
})
app.get('/post/:id/upvote',requireLogin,async(req,res)=>{
    const {id}= req.params;
    const post = await Post.findByIdAndUpdate(id,{ $inc: {upvote: 1 }})
    await post.save();
    const allcomments= await comments.find({postid:id})
    res.render('post.ejs',{name : req.session.firstname, post : post,comments: allcomments });
})
app.get('/post/:id/downvote',requireLogin,async(req,res)=>{
    const {id}= req.params;
    const post = await Post.findByIdAndUpdate(id,{ $inc: {downvote: 1 }})
    await post.save();
    const allcomments= await comments.find({postid:id})
    res.render('post.ejs',{name : req.session.firstname, post : post,comments: allcomments });
})
app.post('/post/:id/comment',requireLogin,async (req,res)=>{
    const {comment}=req.body;
    const {id}= req.params;
    const userid=req.session.user_id;
    const postid=id;
    const name=req.session.firstname;
    const newcomment= new comments ({
        userid,postid,comment,name
    })
    await newcomment.save();
    const post = await Post.findById(id);
    const allcomments= await comments.find({postid:id})
    res.render('post.ejs',{name : req.session.firstname, post : post , comments: allcomments});
})
app.get('/profile/about',requireLogin, async (req,res)=>{
    res.render('about.ejs',{name : req.session.fullname,dateofbirth: req.session.dateofbirth,gender: req.session.gender,email:req.session.email})
})