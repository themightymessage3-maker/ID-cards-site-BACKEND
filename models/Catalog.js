const mongoose = require('mongoose');

const CatalogSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, default: 0 },
  img: { type: String, trim: true, default: '' },
  category: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Catalog', CatalogSchema);
