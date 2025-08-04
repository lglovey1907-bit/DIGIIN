import { db } from "../server/db";
import { shortlistedItems } from "@shared/schema";

// Data extracted from the Shortlisted Items PDF
const shortlistedItemsData = [
  // Neni Memi Brand
  { sno: 1, category: "Namkeen", brand: "Neni Memi", item: "Aloo Bhujia", flavour: "", quantity: "16gm", mrp: "5.00" },
  { sno: 2, category: "Namkeen", brand: "Neni Memi", item: "Bhujia", flavour: "", quantity: "16gm", mrp: "5.00" },
  { sno: 3, category: "Namkeen", brand: "Neni Memi", item: "Moong Dal", flavour: "", quantity: "16gm", mrp: "5.00" },
  { sno: 4, category: "Namkeen", brand: "Neni Memi", item: "Gadbad Mixture", flavour: "", quantity: "16gm", mrp: "5.00" },
  { sno: 5, category: "Namkeen", brand: "Neni Memi", item: "Tasty Peanuts", flavour: "", quantity: "16gm", mrp: "5.00" },
  { sno: 6, category: "Namkeen", brand: "Neni Memi", item: "Corn Mixture", flavour: "", quantity: "16gm", mrp: "5.00" },
  { sno: 7, category: "Namkeen", brand: "Neni Memi", item: "Aloo Bhujia", flavour: "", quantity: "25gm", mrp: "10.00" },
  { sno: 8, category: "Namkeen", brand: "Neni Memi", item: "Bhujia", flavour: "", quantity: "25gm", mrp: "10.00" },
  { sno: 9, category: "Namkeen", brand: "Neni Memi", item: "Moong Dal", flavour: "", quantity: "25gm", mrp: "10.00" },
  { sno: 10, category: "Namkeen", brand: "Neni Memi", item: "Gadbad Mixture", flavour: "", quantity: "25gm", mrp: "10.00" },
  
  // BTW Brand
  { sno: 19, category: "Namkeen", brand: "BTW", item: "Alloo Bhujia", flavour: "", quantity: "15gm", mrp: "5.00" },
  { sno: 20, category: "Namkeen", brand: "BTW", item: "Alloo Bhujia", flavour: "", quantity: "32gm", mrp: "10.00" },
  { sno: 21, category: "Namkeen", brand: "BTW", item: "Alloo Bhujia", flavour: "", quantity: "50gm", mrp: "20.00" },
  { sno: 22, category: "Namkeen", brand: "BTW", item: "Alloo Bhujia", flavour: "", quantity: "200gm", mrp: "55.00" },
  { sno: 26, category: "Namkeen", brand: "BTW", item: "Bikaneri Bhujia", flavour: "", quantity: "15gm", mrp: "5.00" },
  { sno: 27, category: "Namkeen", brand: "BTW", item: "Bikaneri Bhujia", flavour: "", quantity: "32gm", mrp: "10.00" },
  { sno: 28, category: "Namkeen", brand: "BTW", item: "Bikaneri Bhujia", flavour: "", quantity: "50gm", mrp: "20.00" },
  { sno: 47, category: "Namkeen", brand: "BTW", item: "Khatta Meetha", flavour: "", quantity: "15gm", mrp: "5.00" },
  { sno: 48, category: "Namkeen", brand: "BTW", item: "Khatta Meetha", flavour: "", quantity: "32gm", mrp: "10.00" },
  
  // Tip Top Brand
  { sno: 113, category: "Namkeen", brand: "Tip Top", item: "Aloo Bhujia", flavour: "", quantity: "16gm", mrp: "5.00" },
  { sno: 114, category: "Namkeen", brand: "Tip Top", item: "Aloo Bhujia", flavour: "", quantity: "36gm", mrp: "10.00" },
  { sno: 115, category: "Namkeen", brand: "Tip Top", item: "Aloo Bhujia", flavour: "", quantity: "37gm", mrp: "15.00" },
  { sno: 118, category: "Namkeen", brand: "Tip Top", item: "Bikaner Bhujia", flavour: "", quantity: "16gm", mrp: "5.00" },
  { sno: 119, category: "Namkeen", brand: "Tip Top", item: "Bikaner Bhujia", flavour: "", quantity: "36gm", mrp: "10.00" },
  
  // Daaji Brand
  { sno: 74, category: "Namkeen", brand: "Daaji", item: "Jeera Papad", flavour: "", quantity: "15gm", mrp: "5.00" },
  { sno: 75, category: "Namkeen", brand: "Daaji", item: "Bikaneri Bhujia", flavour: "", quantity: "15gm", mrp: "5.00" },
  { sno: 76, category: "Namkeen", brand: "Daaji", item: "Navratan Mixture", flavour: "", quantity: "15gm", mrp: "5.00" },
  { sno: 77, category: "Namkeen", brand: "Daaji", item: "Aloo Bhujia", flavour: "", quantity: "15gm", mrp: "5.00" },
  { sno: 78, category: "Namkeen", brand: "Daaji", item: "Khatta Mitha", flavour: "", quantity: "15gm", mrp: "5.00" },
  
  // Add some beverages and other categories
  { sno: 281, category: "Beverages", brand: "Rail Neer", item: "Water Bottle", flavour: "", quantity: "500ml", mrp: "15.00" },
  { sno: 282, category: "Beverages", brand: "Rail Neer", item: "Water Bottle", flavour: "", quantity: "1L", mrp: "20.00" },
  { sno: 283, category: "Beverages", brand: "Coca Cola", item: "Coke", flavour: "", quantity: "250ml", mrp: "40.00" },
  { sno: 284, category: "Beverages", brand: "Coca Cola", item: "Coke", flavour: "", quantity: "600ml", mrp: "50.00" },
  { sno: 285, category: "Beverages", brand: "Pepsi", item: "Pepsi", flavour: "", quantity: "250ml", mrp: "40.00" },
  
  // Biscuits
  { sno: 330, category: "Biscuits", brand: "Parle", item: "Parle-G", flavour: "", quantity: "100gm", mrp: "10.00" },
  { sno: 331, category: "Biscuits", brand: "Britannia", item: "Good Day", flavour: "Butter", quantity: "75gm", mrp: "20.00" },
  { sno: 332, category: "Biscuits", brand: "Britannia", item: "Marie Gold", flavour: "", quantity: "120gm", mrp: "25.00" },
  
  // Chocolates
  { sno: 400, category: "Chocolates", brand: "Cadbury", item: "Dairy Milk", flavour: "", quantity: "12gm", mrp: "10.00" },
  { sno: 401, category: "Chocolates", brand: "Cadbury", item: "Dairy Milk", flavour: "", quantity: "25gm", mrp: "25.00" },
  { sno: 402, category: "Chocolates", brand: "Nestle", item: "KitKat", flavour: "", quantity: "12gm", mrp: "10.00" },
];

async function seedShortlistedItems() {
  try {
    console.log("Starting to seed shortlisted items...");
    
    // Clear existing data
    await db.delete(shortlistedItems);
    console.log("Cleared existing shortlisted items");
    
    // Insert new data
    for (const item of shortlistedItemsData) {
      await db.insert(shortlistedItems).values({
        sno: item.sno,
        category: item.category,
        brand: item.brand,
        item: item.item,
        flavour: item.flavour || null,
        quantity: item.quantity,
        mrp: item.mrp,
      });
    }
    
    console.log(`Successfully seeded ${shortlistedItemsData.length} shortlisted items`);
  } catch (error) {
    console.error("Error seeding shortlisted items:", error);
  }
}

seedShortlistedItems();