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
let justText = multer();


mongoose.connect('mongodb://127.0.0.1/dates');

let User = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    gender: String,
    age: Number,
    region: String,
    profilePic: {type: String, default: ''},
    backgroundPic: {type: String, default: ''},
    profilePics: [String],
    backgroundPics: [String],
    bio: String
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


let backgroundStorage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, 'public/images/backgroundImages')

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

let backgroundUpload = multer({storage: backgroundStorage,
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
// app.use(bodyParser.json());
//app.use(bodyParser.urlencoded());


app.use(express.static('public'));

app.post('/update-profile', upload.single('profilePic'), (req,res) =>{
    if(req.body.name == "" || req.body.name == null){
        console.log(`NO SIRRR`);
    }

    UserModel.findOneAndUpdate({name: req.body.name}, {$set:{profilePic: req.file.originalname},$push:{profilePics: req.file.originalname}}, (err, foundUser)=>{
        if(err){
            console.log(`There was an error ${err}`)
            console.log(`^^^^^^^|||||| ${foundUser}`)
            res.send(foundUser)

        }
        //foundUser.profilePics.push(req.file.originalname)
       
        

    })

})

app.post('/get-all-users', justText.none(), (req, res) =>{
    let personToExclude = req.body.name;
    //console.log(`WOWOWOWOWOW ${Object.keys(req.body)}`)
    if(personToExclude){
        UserModel.find({}, (err, allUsers)=>{
            let ans = allUsers.filter((ele)=>{
                return ele.name != personToExclude

            })

            res.send(ans)
        })


    }

    //res.send({msg: 'there is an error'})

});


app.post('/get-user', justText.none(), (req,res)=> {
    console.log(`FIREREREREREEEEEEEEE ${Object.keys(req)} `)
//console.log(`REQUEST FROM THE COMPONENT DID MOUNT ${Object.values(req.headers)}`)
UserModel.findOne({name: req.body.name}, (err,foundUser)=>{
if(err){
    console.log(err);

}

console.log(`WE HAVE THE USER ${foundUser}`);
res.send(foundUser)
})

});

app.post('/register', justText.none(),(req,res)=>{
    //console.log(`hit the route ${Object.keys(req.body)}`)
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
                   region:region,
                   
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

app.post('/login', justText.none(), (req, res)=>{
    console.log(`This is the request email ${Object.keys(req)}`)
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
                    res.send({token: token, foundUser: foundUser})

                })


        })



    })



})

app.post('/main-profile', upload.single('profile-file'), (req, res)=>{
    console.log(`LADEE LADEE DAH ${Object.keys(req.body)}`)
    let ans = req.file.originalname;
    UserModel.findOneAndUpdate({name: req.body.name}, {$set:{profilePic: ans}}, {new: true}, (err, foundUser)=>{
        if(err){
            console.log(err)
        }
        console.log(`This should be the profilePic ${foundUser.profilePic}`)
        res.send(foundUser)
    })

//console.log(`MAIN PROFILE ${Object.keys(req.body)}`)

//console.log(`This is the rtesponse from the server ${Object.keys(req)}`)
//res.send(req.file)
//res.setHeader('Content-Type', 'multipart/form-data')


//console.log(`This should be the file name ${ans}`)



})

app.post('/update-profile', upload.single('profile-pic'), (req, res)=>{
console.log(`This isfrom the update Profile ${Object.keys(req.body)}` )
if(!req.file){
    console.log('There was an errror on the backend')

}

    


})


app.post('/main-background-image', backgroundUpload.single('main-background-image'), (req, res) =>{
console.log(`FROM NEW NEW OOOOH ${req.file.originalname}`);
let backgroundPic = req.file.originalname;
let name = req.body.userName;
UserModel.findOneAndUpdate({name: name},{$set:{backgroundPic: backgroundPic}}, {new:true}, (err, foundUser)=>{
    if(err){
        console.log(err)

    }

    console.log(`This is the foundUser ${foundUser}`)
   res.send(foundUser)

})



})

app.post('/set-bio', justText.none(), (req, res) =>{
   
   let name = req.body.name;
   let bioData = req.body.bioInfo;
   
   if(name == '' || name == undefined){
       console.log('The body is empty')
       res.send({msg: 'There was an error, there was no body'})

   }
   UserModel.findOneAndUpdate({name:name}, {$set:{bio: bioData}}, {new: true}, (err, foundUser) =>{
    if(err){
        console.log(err)

    }

    
    res.send(foundUser)


   })


})


app.listen(4677, ()=> console.log(`The server is listining on 4677`))