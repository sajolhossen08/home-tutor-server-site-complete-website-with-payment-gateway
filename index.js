const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
require('dotenv').config();
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5050;
var app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('clientProjects'));
app.use(fileUpload());

app.get('/', (req, res)=>{
    res.send("Assalamu Alaikum")
});



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i6omw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    console.log('Connection err', err)
  const adminCollection = client.db(process.env.DB_NAME).collection("admin");
  const clientCollection = client.db(process.env.DB_NAME).collection('clients');
  const serviceCollection = client.db(process.env.DB_NAME).collection('services');
  const clientCommentsCollection = client.db(process.env.DB_NAME).collection('clientComments');

//   start
  app.post('/addAdmin', (req, res)=>{
    const admin = req.body;
    console.log(admin);
    adminCollection.insertOne(admin)
    .then(result =>{
        console.log(result);
        res.send(result);
    });
})

app.get('/admin', (req, res)=>{
    const queryEmail = req.query.email;
    adminCollection.find({email: queryEmail})
    .toArray((err, documents) =>{
        res.send(documents);
    });
})

app.get('/clients', (req, res) =>{
    clientCollection.find({})
    .toArray( (err, documents) =>{
        res.send(documents); 
    })
})

app.patch('/clients/:id', (req, res) =>{
    const id = req.params.id;

    clientCollection.updateOne({_id: ObjectId(id)},
    {
        $set: {action: req.body.action,actionBG: req.body.actionBG, actionColor: req.body.actionColor}
    })
    .then(result => {
        res.send(result.modifiedCount > 0);
    })
})

app.post('/addServices', (req, res)=>{
    const comment = req.body;
    serviceCollection.insertOne(comment)
    .then(result => {
        res.send(result.insertedCount > 0);
    })
})

app.get('/services', (req, res) =>{
    serviceCollection.find({})
    .toArray( (err, documents) =>{
        res.send(documents); 
    })
})

app.get('/services/:id', (req, res) =>{
    const id = req.params.id;
    serviceCollection.findOne({_id: ObjectId(id)})
    .then(document => {
        // console.log(document);  
        res.send(document);
    })
})

app.post('/addClientProject', (req, res)=>{
    const customerEmail = req.body.customerEmail;
    const action = req.body.action;  
    const actionBG = req.body.actionBG;  
    const actionColor = req.body.actionColor;  
    const name = req.body.name;  
    const price = req.body.price;  
    const email = req.body.email;  
    const projectTitle = req.body.projectTitle;  
    const projectDetails = req.body.projectDetails;
    const file = req.files.file;

    const filePath = `${__dirname}/clientProjects/${file.name}`;
        file.mv(filePath, (err) => {
            if(err){
                console.log(err);
                res.status(500).send({msg: 'Failed to upload image'});
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');

            const image = {
                contentType: file.mimetype,
                size: file.size,
                img: Buffer(encImg, 'base64')
            };

            clientCollection.insertOne({customerEmail,name,email,action,actionBG,actionColor,projectTitle,projectDetails,price,image})
            .then(result => {
                fs.remove(filePath, error => {
                    if(error){
                        console.log(error);
                    }
                    res.send(result.insertedCount > 0);
                })
            })
        })
    })

app.get('/clients/email', (req, res) =>{
    const queryEmail = req.query.checkedEmail;
    clientCollection.find({customerEmail: queryEmail})
    .toArray( (err, documents) =>{
    res.send(documents); 
    })
})


app.post('/clientComments', (req, res)=>{
    const comment = req.body;
    // console.log(comment);
    clientCommentsCollection.insertOne(comment)
    .then(result => {
        res.send(result.insertedCount > 0);
    })
})

app.get('/clientComments', (req, res) =>{
    clientCommentsCollection.find({})
    .toArray( (err, documents) =>{
    // console.log(documents);
    res.send(documents); 
    })
})
  
  console.log('Database connected')
});





app.listen(port)