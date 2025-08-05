import { db } from '../server/db';
import { shortlistedItems } from '../shared/schema';
import { nanoid } from 'nanoid';

// Add Appy Fizz items to the database
const appyFizzItems = [
  { sno: 1884, category: "Aerated Drinks", brand: "Parle Agro", item: "Aerated Drinks", flavour: "Appy Fizz", quantity: "250ml", mrp: 25.00 },
  { sno: 1885, category: "Aerated Drinks", brand: "Parle Agro", item: "Aerated Drinks", flavour: "Appy Fizz", quantity: "500ml", mrp: 45.00 },
  { sno: 1886, category: "Aerated Drinks", brand: "Parle Agro", item: "Aerated Drinks", flavour: "Appy Fizz Apple", quantity: "250ml", mrp: 25.00 },
  { sno: 1887, category: "Aerated Drinks", brand: "Parle Agro", item: "Aerated Drinks", flavour: "Appy Fizz Sparkling Apple", quantity: "600ml", mrp: 50.00 },
];

async function addAppyFizz() {
  try {
    console.log('Adding Appy Fizz items to database...');
    
    // Add the items with unique IDs
    const itemsWithIds = appyFizzItems.map(item => ({
      ...item,
      id: nanoid()
    }));
    
    await db.insert(shortlistedItems).values(itemsWithIds);
    
    console.log(`Successfully added ${itemsWithIds.length} Appy Fizz items`);
    itemsWithIds.forEach(item => {
      console.log(`- S.No ${item.sno}: ${item.brand} ${item.flavour} (${item.quantity}) - ₹${item.mrp}`);
    });
  } catch (error) {
    console.error('Error adding Appy Fizz items:', error);
  }
}

addAppyFizz();