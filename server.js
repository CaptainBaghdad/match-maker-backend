let express = require('express');
let bodyParser = require('body-parser');
let cors = require('cors');
let mongoose = require('mongoose');
let bcrypt = require('bcrypt');
let rounds = 10;
let jwt = require('json-web-token');
let SECRET = process.env.SECRET;
let multer = require('multer');
let path = require('path');
let app = express();


mongoose.connect('mongodb://127.0.0.1/dates');

let User = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    gender: String,
    age: Number,
    region: String
})

let UserModel = mongoose.model('user', User);
let storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, 'public/images')

    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

let upload = multer({storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true)
    },
    limits:{
        fileSize: 1024 ** 1024
    }



});
//middleware
//app.use(express.static(__dirname + '/public'))
app.use(cors());
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/register', (req,res)=>{
    console.log(`hit the route ${Object.keys(req.body)}`)
    if(req.body.name != ''){
        let name = req.body.name;
        let email = req.body.email;
        let password = req.body.password;
        let gender = req.body.gender;
        let age = req.body.age;
        let region = req.body.region;
        
        bcrypt.genSalt(rounds, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash) {
                // Store hash in your password DB.
               if(err){
                   console.log(err)

               }
               new UserModel({
                   name: name,
                   email: email,
                   password: hash,
                   gender: gender,
                   age: age,
                   region:region
               })
               .save((err, savedUser)=>{
                   if(err){
                       console.log(err)

                   }

                   console.log(`New response message ${savedUser}`)
                   res.send(savedUser)

               })
            });
        });

       // res.send({name: name, email: email, password: password})
    }
   

})

app.post('/login', (req, res)=>{
    console.log(`This is the request email ${req.body.email}`)
    if(req.body.email == '' || req.body.email == undefined){
        res.send({error: 'You have not provided the right credentials. Are you sure you have already registered?'})

    }

    let payload = req.body.email;
    
    UserModel.findOne({email: payload}, (err, foundUser)=>{
        console.log(`Found the user ${foundUser}`)
        if(err){
           console.log(err)

        }
        bcrypt.compare(req.body.password, foundUser.password, (err,bool)=>{
                if(err || !bool){
                    console.log(err)
                }
                jwt.encode('thisisthesecret', payload, function(err, token){
                    if(err){
                        console.log(err)

                    }
                    res.send({token: token})

                })


        })



    })



})

app.post('/main-profile', upload.single('profile-file'), (req, res)=>{


//console.log(`This is the rtesponse from the server ${Object.keys(req)}`)
//res.send(req.file)
//res.setHeader('Content-Type', 'multipart/form-data')

let ans = req.file.filename
console.log(ans)
res.send({ans: ans})

})


app.listen(4677, ()=> console.log(`The server is listining on 4677`))