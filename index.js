
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 5000;


// MIDDLEWARE
app.use(cors({
  origin:[
    'http://localhost:5173',
    'https://joyportfolip.surge.sh',
    // 'https://marketeershub-af5e4.web.app',
    // 'https://marketeershub-af5e4.firebaseapp.com'

  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cqpfzla.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middleware
const logger = (req, res,next) =>{
  console.log('log info:',req.method, req.url);
  next()
}

const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  // console.log('token in the middleWare', token);
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user = decoded;
    next();
  })
 
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const jobsCollection = client.db('JobsDB').collection('jobs');
const applyJobsCollection = client.db('JobsDB').collection('apply');

    
  //auth related api
  app.post('/jwt',logger, async(req, res) =>{
    const user = req.body
    // console.log('user for token', user);
    const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
      expiresIn:'1h'})
      res.cookie('token',token, {
        httpOnly:true,
        secure:true,
        sameSite:"none"
      })
      .send({success : true})

  })

  app.post('/logout', async(req, res) =>{
    const user =req.body;
    console.log("logging out", user);
    res.clearCookie('token',{maxAge: 0}).send({success: true})
  })


  //server related api

    // create
    app.post('/Jobs', async(req, res) =>{
      const newJobs=req.body;
      // console.log(newJobs);
      const result = await jobsCollection.insertOne(newJobs)
      res.send(result);
    })

    // read data
    app.get('/jobs', async(req,res) =>{
      // console.log(req.query.email);
      let query = {}
      if(req.query.email){
        query = {email: req.query.email}
      }
      // const cursor= 
      const result = await jobsCollection.find(query).toArray()
      res.send(result)
  })

  // update 
  app.put('/jobs/:id', async(req,res) =>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const options = {upsert: true};
    const updatedJob = req.body;

    const job ={
      $set:{
        email: updatedJob.email,
        category: updatedJob.category,
        jobTitle: updatedJob.jobTitle,
        deadline: updatedJob.deadline,
        maximumPrice: updatedJob.maximumPrice,
        minimumPrice: updatedJob.minimumPrice,
        description: updatedJob.description,
      }
    }
    const result = await jobsCollection.updateOne(filter, job, options)
    res.send(result)
  })

  //new data save
  app.post('/apply',async(req,res) =>{
    const apply =req.body;
    // console.log(apply);
    const result = await applyJobsCollection.insertOne(apply);
    res.send(result)
  })

 
  // apply data loaded for user
  app.get('/apply',logger, verifyToken, async(req,res) =>{
    
    if(req.user.email !== req.query.email){
      return res.status(403).send({message: 'forbidden access'})
    }
    let query = {}
    if(req.query?.email){
      query = {userEmail: req.query?.email}
    }
    console.log('query user',query);
    const result = await applyJobsCollection.find(query).toArray();
    res.send(result)
  })

  


  // buyer side(bid request)
  app.get('/apply_buyer',logger, verifyToken, async(req,res) =>{
    
    if(req.user.email !== req.query.email){
      return res.status(403).send({message: 'forbidden access'})
    }
    let query = {}
    if(req.query?.email){
      query = {email: req.query?.email}
    }
    // console.log(query);
    const result = await applyJobsCollection.find(query).toArray();
    res.send(result)
  })

  app.patch('/apply_buyer/:id', async(req,res) =>{
    const id =req.params.id;
    const filter = {_id: new ObjectId(id)};
    const updateJob = req.body;
    const updateDoc = {
      $set: {
        status: updateJob.status
      }
    }
    const result =await applyJobsCollection.updateOne(filter, updateDoc)
    res.send(result)
  })


  // delete
  app.delete('/jobs/:id', async(req, res) =>{
    const id = req.params.id;
    const query ={_id: new ObjectId(id)}
    const result =await jobsCollection.deleteOne(query);
    res.send(result) 
  })




  // fide job & apply 
  app.get('/jobs/:id', async(req,res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await jobsCollection.findOne(query);
    res.send(result)
  })
  
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res) =>{
    res.send('marketeersHub is a digitalMarket Place')
})


app.listen(port, () =>{
    console.log(`marketeersHub server is running on port: ${port}`);
})


//vercel
// https://marketeers-hub-auth-jwt-server.vercel.app
// marketeers-hub-auth-jwt-server.vercel.app
