require("dotenv").config({ override: true });
const app= require("./app");
console.log(process.env.MONGO_URI);
const connectDB=require("./config/db.js");
connectDB();

const PORT= process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`App is listening on port:${PORT}`);
});