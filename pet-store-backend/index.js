require("dotenv").config(); // load .env variables
const express = require("express");
const connectDB = require("./db"); // import db connection
const Product = require("./models/Product");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const protect = require("./middleware/auth");

const app = express();

connectDB(); // connect to MongoDB

app.use(express.json()); // Allow Express to read JSON bodies

//Route
app.get("/", (req, res) => {
  res.json({ message: "Hello Pet Store!" });
});

//Product route
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products from DB
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/products", protect, async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const newProduct = await Product.create({ name, price, category });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error adding product:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/products/:id", protect, async (req, res) => {
  try {
    const { id } = req.params; // get the product ID from the URL
    const { name, price, category } = req.body;

    const updateProduct = await Product.findByIdAndUpdate(
      id,
      { name, price, category },
      { new: true } // return the updated document
    );

    if (!updateProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(updateProduct);
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

app.delete("/products/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully", deletedProduct });
  } catch (error) {
    console.error("Error deleting product:", message.error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    //Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    //Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //Save user
    const newUser = await User.create({ email, password: hashedPassword });

    res.status(201).json({
      _id: newUser._id,
      email: newUser.email,
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    //Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    //Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    //Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error, message);
    res.status(500).json({ message: "Server Error" });
  }
});

//Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
