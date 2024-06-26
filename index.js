const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();

const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
  'http://localhost:5173',
  'https://career-maker-9a29c.web.app',
  'https://career-maker-9a29c.firebaseapp.com'
],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const verify = (req,res,next)=>{
    const token = req?.cookies?.token;
    //   console.log('token in m',token);
    if(!token)
    {
        return res.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
        if(err)
        {
            return res.status(401).send({message: 'unauthorized access'})
        }
        req.user = decoded;
        console.log("jjj",req.user.email);
        next();
    })
    // next();
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gwyyl9m.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //  await client.connect();

        const serviceCollection = client.db('careerDB').collection('services');
        const bookingCollection = client.db('careerDB').collection('bookings');
        const awardCollection = client.db('careerDB').collection('awards');
        //    app.get('/services',async(req,res)=>{
        //     const cursor = serviceCollection.find();
        //     const result = await cursor.toArray();
        //     res.send(result);
        //    })


        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });

        })

        app.post('/logout',async(req,res)=>{
            const user = req.body;
            res.clearCookie('token',{maxAge:0}).send({success:true})
        })


        app.get('/services', async (req, res) => {
            console.log(req.query);
            let query = {};
            if (req.query?.email) {
                query = { service_provider_email: req.query.email }
            }

            // const result = await serviceCollection().find(query).toArray();
            // res.send(result);
            const cursor = serviceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.findOne(query);
            res.send(result);
        })

        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        })

        app.put('/services/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedProduct = req.body;
            console.log(updatedProduct);
            const updated = {
                $set: {
                    service_name: updatedProduct.service_name,
                    service_image: updatedProduct.service_image,
                    description: updatedProduct.description,
                    service_price: updatedProduct.service_price,
                    service_area: updatedProduct.service_area,
                    service_provider_description: updatedProduct.service_provider_description,

                }
            }

            const result = await serviceCollection.updateOne(filter, updated, options);
            res.send(result)

        })

        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })



        //    app.get('/bookings',async(req,res)=>{
        //       const result = await bookingCollection.find().toArray();
        //       res.send(result);
        //    })


        app.get('/bookings', verify, async (req, res) => {
            // console.log(req.cookies);
            console.log(req.query.email);
            console.log('cook cook', req.user);
            if(req.user.email !== req.query.email){
                return res.status(403).send({message:'forbidden'})
            }
           
            let query = {};
            if (req.query?.email) {
                query = { user_email: req.query.email }
            }

            // const result = await serviceCollection().find(query).toArray();
            // res.send(result);
            const cursor = bookingCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })




        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        app.put('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateStatus = req.body;
            console.log(updateStatus);
            const updated = {
                $set: {

                    status: updateStatus.newStatus

                }
            }
            const result = await bookingCollection.updateOne(filter, updated, options);
            res.send(result)

        })


        app.get('/works', async (req, res) => {
           
           
            let query = {};
            if (req.query?.email) {
                query = { service_provider_email: req.query.email }
            }

            // const result = await serviceCollection().find(query).toArray();
            // res.send(result);
            const cursor = bookingCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })


        app.get('/awards',async(req,res)=>{
           
            const cursor =  awardCollection.find();
            const result = await cursor.toArray();
            res.send(result);
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


app.get('/', async (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(port);
})