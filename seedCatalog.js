// This script seeds the backend catalog with the static items from the frontend order page.
// Place this file in your backend directory and run it with: node seedCatalog.js

require('dotenv').config();
const mongoose = require('mongoose');
const Catalog = require('./models/Catalog');

const staticItems = [
  { name: "Arizona Fake ID", price: 120, img: "assets/Card1.jpg", category: "USA" },
  { name: "Connecticut Fake ID", price: 130, img: "assets/Card2.jpg", category: "USA" },
  { name: "Delaware Fake ID", price: 125, img: "assets/Card3.png", category: "USA" },
  { name: "Florida Fake ID", price: 140, img: "assets/Card4.jpg", category: "USA" },
  { name: "Illinois Fake ID", price: 135, img: "assets/Card5.jpg", category: "USA" },
  { name: "Indiana Fake ID", price: 120, img: "assets/Card6.jpg", category: "USA" },
  { name: "Louisiana Fake ID", price: 130, img: "assets/Card7.jpg", category: "USA" },
  { name: "Michigan Fake ID", price: 125, img: "assets/Card8.jpg", category: "USA" },
  { name: "North Carolina Fake ID", price: 140, img: "assets/Card9.jpg", category: "USA" },
  { name: "New Jersey Fake ID", price: 135, img: "assets/Card10.jpg", category: "USA" },
  { name: "New Mexico Fake ID", price: 120, img: "assets/Card11.jpg", category: "USA" },
  { name: "New South Carolina Fake ID", price: 130, img: "assets/Card12.jpg", category: "USA" },
  { name: "North Dakota Fake ID", price: 125, img: "assets/Card13.png", category: "USA" },
  { name: "Ohio Fake ID", price: 140, img: "assets/Card14.png", category: "USA" },
  { name: "Old South Carolina Fake ID", price: 135, img: "assets/Card15.jpg", category: "USA" },
  { name: "Pennsylvania Fake ID", price: 120, img: "assets/Card16.jpg", category: "USA" },
  { name: "Rhode Island Fake ID", price: 130, img: "assets/Card17.jpg", category: "USA" },
  { name: "South Carolina Fake ID", price: 125, img: "assets/Card18.png", category: "USA" },
  { name: "Tennessee Fake ID", price: 140, img: "assets/Card19.jpg", category: "USA" },
  { name: "Utah Fake ID", price: 135, img: "assets/Card20.jpg", category: "USA" },
  { name: "Washington Fake ID", price: 120, img: "assets/Card21.jpg", category: "USA" },
  { name: "Wyoming Fake ID", price: 130, img: "assets/Card22.jpg", category: "USA" },
  { name: "Alabama Fake ID", price: 120, img: "assets/Card23.jpg", category: "USA" },
  { name: "Alaska Fake ID", price: 130, img: "assets/Card24.jpg", category: "USA" },
  { name: "Arkansas Fake ID", price: 125, img: "assets/Card25.jpg", category: "USA" },
  { name: "California Fake ID", price: 140, img: "assets/Card26.png", category: "USA" },
  { name: "Colorado Fake ID", price: 135, img: "assets/Card27.jpg", category: "USA" },
  { name: "Georgia Fake ID", price: 120, img: "assets/Card28.jpg", category: "USA" },
  { name: "Hawaii Fake ID", price: 130, img: "assets/Card29.jpg", category: "USA" },
  { name: "Idaho Fake ID", price: 125, img: "assets/Card30.png", category: "USA" },
  { name: "Iowa Fake ID", price: 140, img: "assets/Card31.jpg", category: "USA" },
  { name: "Kansas Fake ID", price: 135, img: "assets/Card32.jpg", category: "USA" },
  { name: "Kentucky Fake ID", price: 120, img: "assets/Card33.jpg", category: "USA" },
  { name: "Maine Fake ID", price: 130, img: "assets/Card34.jpg", category: "USA" }
];

async function seedCatalog() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  for (const item of staticItems) {
    // Avoid duplicates by name+price+img
    const exists = await Catalog.findOne({ name: item.name, price: item.price, img: item.img });
    if (!exists) {
      await Catalog.create(item);
      console.log('Inserted:', item.name);
    } else {
      console.log('Already exists:', item.name);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seedCatalog().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
