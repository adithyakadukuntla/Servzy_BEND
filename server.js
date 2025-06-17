const exp = require("express")
const connectDB = require("./db/db")
require('dotenv').config()
const cors = require('cors')
const authRoutes = require('./routes/auth')
const driverRoutes = require('./routes/Driver')
const userRoutes = require('./routes/UserRoutes')
const photoRoutes = require('./routes/photoRoutes')
const bookRoutes = require('./routes/BookingRoutes')
const app = exp()


app.use(exp.json())
app.use(cors())

// connection to backend ..

connectDB()



app.get('/',async(req,res)=>{
    res.send({message:"Get first route"})
})



app.use('/auth', authRoutes);
app.use('/driver', driverRoutes);
app.use('/user',userRoutes);
app.use('/pshoot',photoRoutes);
app.use('/book',bookRoutes);


const port  = process.env.PORT || 4500
app.listen( port ,()=>{
    console.log(`Server is running on port ${port}`)
})

