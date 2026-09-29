const express = require("express");
const cors = require("cors");
const path = require("path");
const placesRouter = require("./route/places");
const categoryRouter = require("./route/category");
const allCategoriesRouter = require("./route/allcategory");

const app = express();
const PORT = process.env.PORT || 3000;

app.enable("trust proxy");
app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(express.static(path.join(__dirname, "Website UI")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Website UI", "index.html"));
});

app.get("/docs/places", (req, res) => {
  res.sendFile(path.join(__dirname, "Website UI", "places.html"));
});

app.get("/docs/allcategory", (req, res) => {
  res.sendFile(path.join(__dirname, "Website UI", "allcategory.html"));
});

app.get("/docs/budaya", (req, res) => {
  res.sendFile(path.join(__dirname, "Website UI", "budaya.html"));
});

app.get("/docs/taman-hiburan", (req, res) => {
  res.sendFile(path.join(__dirname, "Website UI", "taman-hiburan.html"));
});

app.get("/docs/wisata-alam", (req, res) => {
  res.sendFile(path.join(__dirname, "Website UI", "wisata-alam.html"));
});

app.get("/docs/wisata-bahari", (req, res) => {
  res.sendFile(path.join(__dirname, "Website UI", "wisata-bahari.html"));
});

app.get("/docs/wisata-religi", (req, res) => {
  res.sendFile(path.join(__dirname, "Website UI", "wisata-religi.html"));
});

app.use("/places", placesRouter);
app.use("/category", categoryRouter);
app.use("/allcategory", allCategoriesRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server is running on http://localhost:${PORT}`);
});
