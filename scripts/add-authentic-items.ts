import { db } from '../server/db';
import { shortlistedItems } from '../shared/schema';
import { nanoid } from 'nanoid';

// Add authentic Indian snack items that are commonly found in railway stations
const authenticItems = [
  // Indian Street Food Items
  { sno: 1859, category: "Street Food", brand: "Haldiram", item: "Snacks", flavour: "Bhel Puri", quantity: "150gm", mrp: 45.00 },
  { sno: 1860, category: "Street Food", brand: "Bikano", item: "Snacks", flavour: "Bhel Puri", quantity: "100gm", mrp: 35.00 },
  { sno: 1861, category: "Street Food", brand: "Haldiram", item: "Snacks", flavour: "Sev Puri", quantity: "150gm", mrp: 50.00 },
  { sno: 1862, category: "Street Food", brand: "Bikano", item: "Snacks", flavour: "Pani Puri", quantity: "200gm", mrp: 40.00 },
  
  // Makhana Items
  { sno: 1863, category: "Dry Fruits", brand: "Farmley", item: "Makhana", flavour: "Roasted & Salted", quantity: "50gm", mrp: 85.00 },
  { sno: 1864, category: "Dry Fruits", brand: "Farmley", item: "Makhana", flavour: "Roasted & Flavoured", quantity: "20gm", mrp: 30.00 },
  { sno: 1865, category: "Dry Fruits", brand: "Nutraj", item: "Makhana", flavour: "Roasted", quantity: "100gm", mrp: 150.00 },
  { sno: 1866, category: "Dry Fruits", brand: "Tulsi", item: "Makhana", flavour: "Masala", quantity: "75gm", mrp: 120.00 },
  { sno: 1867, category: "Dry Fruits", brand: "True Elements", item: "Makhana", flavour: "Plain Roasted", quantity: "125gm", mrp: 180.00 },
  
  // Additional Popular Indian Snacks
  { sno: 1868, category: "Traditional Snacks", brand: "Haldiram", item: "Snacks", flavour: "Khatta Meetha", quantity: "200gm", mrp: 65.00 },
  { sno: 1869, category: "Traditional Snacks", brand: "Bikano", item: "Snacks", flavour: "Navratan Mix", quantity: "150gm", mrp: 55.00 },
  { sno: 1870, category: "Traditional Snacks", brand: "Haldiram", item: "Snacks", flavour: "Bhujia Sev", quantity: "180gm", mrp: 45.00 },
  { sno: 1871, category: "Traditional Snacks", brand: "Bikano", item: "Snacks", flavour: "Rajasthani Mix", quantity: "200gm", mrp: 70.00 },
  { sno: 1872, category: "Traditional Snacks", brand: "Haldiram", item: "Snacks", flavour: "Moong Dal Halwa", quantity: "250gm", mrp: 85.00 },
  
  // Chaat Items
  { sno: 1873, category: "Chaat", brand: "Haldiram", item: "Chaat", flavour: "Papdi Chaat", quantity: "120gm", mrp: 38.00 },
  { sno: 1874, category: "Chaat", brand: "Bikano", item: "Chaat", flavour: "Dahi Puri", quantity: "150gm", mrp: 42.00 },
  { sno: 1875, category: "Chaat", brand: "Haldiram", item: "Chaat", flavour: "Aloo Tikki", quantity: "180gm", mrp: 55.00 },
  
  // Regional Specialties
  { sno: 1876, category: "Regional", brand: "Haldiram", item: "Regional", flavour: "Kachori", quantity: "4pcs", mrp: 60.00 },
  { sno: 1877, category: "Regional", brand: "Bikano", item: "Regional", flavour: "Samosa", quantity: "4pcs", mrp: 50.00 },
  { sno: 1878, category: "Regional", brand: "Haldiram", item: "Regional", flavour: "Dhokla", quantity: "200gm", mrp: 45.00 },
  { sno: 1879, category: "Regional", brand: "MTR", item: "Regional", flavour: "Idli Mix", quantity: "200gm", mrp: 75.00 },
  { sno: 1880, category: "Regional", brand: "Gits", item: "Regional", flavour: "Poha Mix", quantity: "180gm", mrp: 35.00 },
  
  // Health Snacks
  { sno: 1881, category: "Health Snacks", brand: "Too Yumm", item: "Healthy Snacks", flavour: "Multigrain Chips", quantity: "60gm", mrp: 45.00 },
  { sno: 1882, category: "Health Snacks", brand: "Yoga Bar", item: "Healthy Snacks", flavour: "Millet Cookies", quantity: "100gm", mrp: 85.00 },
  { sno: 1883, category: "Health Snacks", brand: "Paper Boat", item: "Healthy Snacks", flavour: "Roasted Chana", quantity: "80gm", mrp: 25.00 },
];

async function addAuthenticItems() {
  try {
    console.log('Adding authentic Indian snack items...');
    
    // Add the authentic items with unique IDs
    const itemsWithIds = authenticItems.map(item => ({
      ...item,
      id: nanoid()
    }));
    
    await db.insert(shortlistedItems).values(itemsWithIds);
    
    console.log(`Successfully added ${itemsWithIds.length} authentic items including bhel puri and makhana`);
    console.log('Items added:');
    itemsWithIds.forEach(item => {
      if (item.flavour.toLowerCase().includes('bhel') || item.item.toLowerCase().includes('makhana')) {
        console.log(`- S.No ${item.sno}: ${item.brand} ${item.flavour} (${item.quantity}) - ₹${item.mrp}`);
      }
    });
  } catch (error) {
    console.error('Error adding authentic items:', error);
  }
}

addAuthenticItems();