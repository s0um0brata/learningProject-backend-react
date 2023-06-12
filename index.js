const express = require("express");
const cors = require("cors");
const Jwt = require("jsonwebtoken");
const jwtKey = "Deepisagoodbo$y";
require("./db/config");
const User = require("./db/User");
const Product = require("./db/Product");

const app = express();
app.use(express.json());
app.use(cors());

// POST request to register the user
app.post("/register", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      res.send({ result: "Something went wrong.Please try again!" });
    }
    res.send({ result, auth: token });
  });
});

// POST request to fetch signed up user from the database for login for the same user.
app.post("/login", async (req, res) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          res.send({ result: "Something went wrong.Please try again!" });
        }
        res.send({ user, auth: token });
      });
    } else {
      res.send({ result: "No User Found!" });
    }
  } else {
    res.send({ result: "No user Found!" });
  }
});

// POST request to add a product
app.post("/add-product", verifyToken, async (req, res) => {
  let product = new Product(req.body);
  let result = await product.save();
  res.send(result);
});

//GET request to fetch product data from database
app.get("/products", verifyToken, async (req, res) => {
  let products = await Product.find();
  if (products.length > 0) {
    res.send(products);
  } else {
    res.send({ result: "No products found!" });
  }
});

// DELETE request to delete single product from database
app.delete("/product/:id", verifyToken, async (req, res) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  res.send(result);
});

// GET request to update product data
app.get("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    res.send(result);
  } else {
    res.send({ result: "No Records Found" });
  }
});

// PUT Request to update product in database
app.put("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  res.send(result);
});

// GET request to search product
app.get("/search/:key",verifyToken, async (req, res) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
      { price: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

function verifyToken(req, res, next){
  let token = req.headers['authorization']
  if(token){
    token = token.split(' ')[1]
    Jwt.verify(token, jwtKey, (err, valid)=>{
      if(err){
        res.status(401).send({result:"Please provide valid token"})
      }else{
        next();
      }
    })
  }else{
    res.status(403).send({result:"Please add token with header"});
  }
}

app.listen(5000);
