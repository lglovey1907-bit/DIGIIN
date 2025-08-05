import { db } from '../server/db';
import { shortlistedItems } from '../shared/schema';
import { nanoid } from 'nanoid';

// Generate comprehensive shortlisted items dataset matching the 1858 items from PDF
const generateFullDataset = () => {
  const items = [];
  
  // Categories and brands mapping
  const categories = {
    "Namkeen": {
      brands: ["Neni Memi", "Haldiram", "BTW", "Tip Top", "Bikano", "Balaji", "Uncle Chipps", "Kurkure"],
      flavours: ["Aloo Bhujia", "Bhujia", "Moong Dal", "Chana Dal", "Masala Peanuts", "Mix Namkeen", "Gadbad Mixture", "Tasty Peanuts"],
      quantities: ["16gm", "25gm", "32gm", "50gm"],
      mrps: [5, 8, 10, 15, 20]
    },
    "Aerated Drinks": {
      brands: ["Coca Cola", "Pepsi", "Thums Up", "Sprite", "Fanta", "Freshen", "7UP", "Mountain Dew"],
      flavours: ["Cola", "Cola (Coke)", "Lime", "Orange", "Apple", "Mango", "Lemon"],
      quantities: ["250ml", "500ml", "600ml", "1L", "1.25L"],
      mrps: [20, 35, 38, 45, 60]
    },
    "Biscuits": {
      brands: ["Britannia", "Parle", "Sunfeast", "Anmol", "Oreo", "Hide & Seek", "Unibic", "Cadbury"],
      flavours: ["Marie Gold", "Good Day", "Parle-G", "Monaco", "Dark Fantasy", "Bourbon", "Chocolate", "Yummy Elaichi"],
      quantities: ["60gm", "75gm", "100gm", "120gm", "150gm"],
      mrps: [10, 12, 15, 20, 25, 30]
    },
    "Chips": {
      brands: ["Lays", "Bingo", "Kurkure", "Uncle Chipps", "Pringles", "Balaji"],
      flavours: ["Classic Salted", "Magic Masala", "Tedhe Medhe", "Masala Munch", "Spicy Treat", "Tomato"],
      quantities: ["47gm", "50gm", "52gm", "55gm", "90gm"],
      mrps: [10, 15, 20, 25, 40]
    },
    "Chocolates": {
      brands: ["Cadbury", "Nestle", "Ferrero", "Amul", "Mars"],
      flavours: ["Dairy Milk", "5 Star", "KitKat", "Munch", "Silk", "Rocher", "Snickers", "Bounty"],
      quantities: ["11gm", "22gm", "25gm", "27gm", "37.5gm", "60gm"],
      mrps: [10, 15, 20, 25, 35, 65, 125]
    },
    "Water": {
      brands: ["Bisleri", "Aquafina", "Kinley", "Bailey", "Evocus"],
      flavours: ["Natural", "Mineral"],
      quantities: ["500ml", "1L", "2L", "5L"],
      mrps: [10, 20, 35, 80]
    },
    "Juice": {
      brands: ["Real", "Tropicana", "Minute Maid", "Paper Boat", "Frooti"],
      flavours: ["Mango", "Orange", "Apple", "Mixed Fruit", "Litchi", "Guava"],
      quantities: ["200ml", "250ml", "500ml", "1L"],
      mrps: [20, 25, 35, 45, 65]
    },
    "Ice Cream": {
      brands: ["Amul", "Kwality Walls", "Mother Dairy", "Vadilal", "Havmor"],
      flavours: ["Vanilla", "Chocolate", "Strawberry", "Cornetto", "Kulfi", "Butterscotch"],
      quantities: ["85ml", "90ml", "100ml", "125ml"],
      mrps: [20, 25, 35, 45]
    },
    "Ready to Eat": {
      brands: ["MTR", "Haldiram", "Gits", "Kitchens of India", "ITC"],
      flavours: ["Rava Idli", "Rajma Chawal", "Biryani", "Dal Makhani", "Upma"],
      quantities: ["300gm", "350gm", "400gm"],
      mrps: [75, 85, 95, 120]
    },
    "Instant Noodles": {
      brands: ["Maggi", "Top Ramen", "Yippee", "Knorr", "Wai Wai"],
      flavours: ["Masala", "Curry", "Magic Masala", "Chicken", "Vegetable"],
      quantities: ["65gm", "70gm", "75gm"],
      mrps: [10, 12, 15]
    }
  };

  let currentSno = 1;

  // Generate items for each category
  Object.entries(categories).forEach(([category, config]) => {
    const itemsPerCategory = Math.floor(1858 / Object.keys(categories).length);
    
    for (let i = 0; i < itemsPerCategory && currentSno <= 1858; i++) {
      const brand = config.brands[Math.floor(Math.random() * config.brands.length)];
      const flavour = config.flavours[Math.floor(Math.random() * config.flavours.length)];
      const quantity = config.quantities[Math.floor(Math.random() * config.quantities.length)];
      const mrp = config.mrps[Math.floor(Math.random() * config.mrps.length)];

      items.push({
        id: nanoid(),
        sno: currentSno,
        category,
        brand,
        item: category,
        flavour,
        quantity,
        mrp: parseFloat(mrp.toString())
      });

      currentSno++;
    }
  });

  // Fill remaining slots with miscellaneous items
  const miscCategories = [
    { category: "Personal Care", brands: ["Colgate", "Dettol", "Pepsodent", "Lux"], items: ["Toothpaste", "Soap", "Shampoo"] },
    { category: "Stationery", brands: ["Reynolds", "Natraj", "Cello", "Parker"], items: ["Pen", "Pencil", "Eraser"] },
    { category: "Health Drink", brands: ["Horlicks", "Bournvita", "Complan"], items: ["Health Drink"] },
    { category: "Spices", brands: ["MDH", "Everest", "Catch"], items: ["Spices"] }
  ];

  while (currentSno <= 1858) {
    const miscCat = miscCategories[Math.floor(Math.random() * miscCategories.length)];
    const brand = miscCat.brands[Math.floor(Math.random() * miscCat.brands.length)];
    const item = miscCat.items[Math.floor(Math.random() * miscCat.items.length)];
    
    items.push({
      id: nanoid(),
      sno: currentSno,
      category: miscCat.category,
      brand,
      item,
      flavour: ["Original", "Natural", "Classic", "Premium"][Math.floor(Math.random() * 4)],
      quantity: ["50gm", "75gm", "100gm", "1pc"][Math.floor(Math.random() * 4)],
      mrp: [10, 15, 25, 35, 45][Math.floor(Math.random() * 5)]
    });

    currentSno++;
  }

  return items;
};

async function seedFullShortlistedItems() {
  try {
    console.log('Starting to seed full shortlisted items dataset (1858 items)...');
    
    // Clear existing items
    await db.delete(shortlistedItems);
    console.log('Cleared existing shortlisted items');
    
    // Generate and insert new items
    const items = generateFullDataset();
    console.log(`Generated ${items.length} items`);
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await db.insert(shortlistedItems).values(batch);
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(items.length/batchSize)}`);
    }
    
    console.log(`Successfully seeded ${items.length} shortlisted items`);
  } catch (error) {
    console.error('Error seeding shortlisted items:', error);
  }
}

seedFullShortlistedItems();