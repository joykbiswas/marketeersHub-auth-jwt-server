
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000;


// MIDDLEWARE
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cqpfzla.mongodb.net/?retryWrites=true&w=majority`;

// const uri = "mongodb+srv://<digitalMarket>:<aM2uxaKmpQ2fpYBW>@cluster0.cqpfzla.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const jobsCollection = client.db('JobsDB').collection('jobs');
const applyJobsCollection = client.db('JobsDB').collection('apply');
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // create
    app.post('/Jobs', async(req, res) =>{
      const newJobs=req.body;
      console.log(newJobs);
      const result = await jobsCollection.insertOne(newJobs)
      res.send(result);
    })

    // read data
    app.get('/jobs', async(req,res) =>{
      console.log(req.query.email);
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

      }
    }
    const result = await jobsCollection.updateOne(filter, job, options)
    res.send(result)
  })

  // fide job & apply 
  app.get('/jobs/:id', async(req,res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await jobsCollection.findOne(query);
    res.send(result)
  })

  //new data save
  app.post('/apply',async(req,res) =>{
    const apply =req.body;
    console.log(apply);
    const result = await applyJobsCollection.insertOne(apply);
    res.send(result)
  })

  // apply data loaded
  app.get('/apply', async(req,res) =>{
    // console.log(req.query.email);
    let query = {}
    if(req.query?.email){
      query = {email: req.query?.email}
    }
    // console.log(query);
    const result = await applyJobsCollection.find(query).toArray();
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

