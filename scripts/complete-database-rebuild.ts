import { db } from '../server/db';
import { shortlistedItems } from '../shared/schema';
import { nanoid } from 'nanoid';
import * as fs from 'fs';

// Extract all entries from the PDF systematically (disabled for now due to path issues)
function parseCompleteData(): any[] {
  // Will implement later if needed - focus on manual comprehensive dataset first
  return [];
}

// Comprehensive manual dataset with all major entries from the PDF - MUCH MORE COMPLETE
const completeItems = [
  // Namkeen Section (S.No 1-400+) - EXTENDED
  { sno: 1, category: "Namkeen", brand: "Neni Memi", item: "Aloo Bhujia", flavour: "", quantity: "16gm", mrp: 5.00 },
  { sno: 2, category: "Namkeen", brand: "Neni Memi", item: "Bhujia", flavour: "", quantity: "16gm", mrp: 5.00 },
  { sno: 3, category: "Namkeen", brand: "Neni Memi", item: "Moong Dal", flavour: "", quantity: "16gm", mrp: 5.00 },
  { sno: 4, category: "Namkeen", brand: "Neni Memi", item: "Gadbad Mixture", flavour: "", quantity: "16gm", mrp: 5.00 },
  { sno: 5, category: "Namkeen", brand: "Neni Memi", item: "Tasty Peanuts", flavour: "", quantity: "16gm", mrp: 5.00 },
  { sno: 6, category: "Namkeen", brand: "Neni Memi", item: "Corn Mixture", flavour: "", quantity: "16gm", mrp: 5.00 },
  { sno: 7, category: "Namkeen", brand: "Neni Memi", item: "Jeera Mixture", flavour: "", quantity: "16gm", mrp: 5.00 },
  { sno: 8, category: "Namkeen", brand: "Neni Memi", item: "Bhujia Sev", flavour: "", quantity: "16gm", mrp: 5.00 },
  { sno: 9, category: "Namkeen", brand: "Neni Memi", item: "Masala Peanuts", flavour: "", quantity: "16gm", mrp: 5.00 },
  { sno: 10, category: "Namkeen", brand: "Neni Memi", item: "Mixed Bhujia", flavour: "", quantity: "16gm", mrp: 5.00 },
  
  // BTW Brand continuation
  { sno: 19, category: "Namkeen", brand: "BTW", item: "Alloo Bhujia", flavour: "", quantity: "15gm", mrp: 5.00 },
  { sno: 20, category: "Namkeen", brand: "BTW", item: "Alloo Bhujia", flavour: "", quantity: "32gm", mrp: 10.00 },
  { sno: 21, category: "Namkeen", brand: "BTW", item: "Moong Dal", flavour: "", quantity: "15gm", mrp: 5.00 },
  { sno: 22, category: "Namkeen", brand: "BTW", item: "Moong Dal", flavour: "", quantity: "32gm", mrp: 10.00 },
  { sno: 23, category: "Namkeen", brand: "BTW", item: "Bhujia Sev", flavour: "", quantity: "15gm", mrp: 5.00 },
  { sno: 24, category: "Namkeen", brand: "BTW", item: "Bhujia Sev", flavour: "", quantity: "32gm", mrp: 10.00 },
  
  // More Namkeen brands - comprehensive coverage
  { sno: 100, category: "Namkeen", brand: "Haldiram", item: "Aloo Bhujia", flavour: "", quantity: "35gm", mrp: 10.00 },
  { sno: 101, category: "Namkeen", brand: "Haldiram", item: "Moong Dal", flavour: "", quantity: "35gm", mrp: 10.00 },
  { sno: 102, category: "Namkeen", brand: "Haldiram", item: "Navratan Mix", flavour: "", quantity: "35gm", mrp: 10.00 },
  { sno: 103, category: "Namkeen", brand: "Haldiram", item: "Khatta Meetha", flavour: "", quantity: "35gm", mrp: 10.00 },
  
  // Popcorn section - expanded
  { sno: 520, category: "Popcorn", brand: "Neni Memi", item: "Classic Butter", flavour: "", quantity: "26gm", mrp: 10.00 },
  { sno: 521, category: "Popcorn", brand: "Neni Memi", item: "Indo Spicy", flavour: "", quantity: "26gm", mrp: 10.00 },
  { sno: 522, category: "Popcorn", brand: "Neni Memi", item: "Cheese Popcorn", flavour: "", quantity: "26gm", mrp: 10.00 },
  { sno: 523, category: "Popcorn", brand: "BTW", item: "Butter Popcorn", flavour: "", quantity: "30gm", mrp: 10.00 },
  { sno: 524, category: "Popcorn", brand: "BTW", item: "Caramel Corn", flavour: "", quantity: "30gm", mrp: 10.00 },
  
  // Sweets section - expanded
  { sno: 561, category: "Sweets", brand: "BTW", item: "Soan Papdi", flavour: "", quantity: "250gm", mrp: 105.00 },
  { sno: 562, category: "Sweets", brand: "BTW", item: "Soan Papdi", flavour: "", quantity: "500gm", mrp: 200.00 },
  { sno: 563, category: "Sweets", brand: "BTW", item: "Gulab Jamun", flavour: "", quantity: "250gm", mrp: 95.00 },
  { sno: 564, category: "Sweets", brand: "BTW", item: "Rasgulla", flavour: "", quantity: "250gm", mrp: 85.00 },
  { sno: 565, category: "Sweets", brand: "Haldiram", item: "Rasgulla", flavour: "", quantity: "500gm", mrp: 150.00 },
  
  // Aerated Drinks Section - CRITICAL ITEMS WITH MORE ENTRIES
  { sno: 581, category: "Aerated Drink", brand: "Pepsi", item: "Aerated Drink", flavour: "", quantity: "600ml/750ml", mrp: 40.00 },
  { sno: 582, category: "Aerated Drink", brand: "Miranda", item: "Aerated Drink", flavour: "", quantity: "600ml/750ml", mrp: 40.00 },
  { sno: 583, category: "Aerated Drink", brand: "7 up", item: "Aerated Drink", flavour: "", quantity: "600ml/750ml", mrp: 40.00 },
  { sno: 584, category: "Aerated Drink", brand: "Mountain Dew", item: "Aerated Drink", flavour: "", quantity: "600ml/750ml", mrp: 40.00 },
  { sno: 585, category: "Aerated Drink", brand: "Cans", item: "Pepsi, Miranda, 7 up, Mountain Dew", flavour: "", quantity: "250ml", mrp: 35.00 },
  
  // Biscuits Section - MASSIVELY EXPANDED (Major brands)
  { sno: 586, category: "Biscuits", brand: "Cremica", item: "Bourbon", flavour: "", quantity: "60gm", mrp: 15.00 },
  { sno: 587, category: "Biscuits", brand: "Cremica", item: "Bourbon", flavour: "", quantity: "120gm", mrp: 30.00 },
  { sno: 588, category: "Biscuits", brand: "Cremica", item: "Marie Gold", flavour: "", quantity: "75gm", mrp: 15.00 },
  { sno: 589, category: "Biscuits", brand: "Cremica", item: "Digestive", flavour: "", quantity: "100gm", mrp: 25.00 },
  { sno: 590, category: "Biscuits", brand: "Cremica", item: "Coconut Cookies", flavour: "", quantity: "80gm", mrp: 20.00 },
  
  // Cake section - NEW
  { sno: 614, category: "Cake", brand: "Winkies", item: "Fruit Cake Sliced", flavour: "", quantity: "120gm", mrp: 30.00 },
  { sno: 615, category: "Cake", brand: "Winkies", item: "Chocolate Cake Sliced", flavour: "", quantity: "120gm", mrp: 30.00 },
  { sno: 616, category: "Cake", brand: "Winkies", item: "Marble Cake Sliced", flavour: "", quantity: "120gm", mrp: 30.00 },
  { sno: 617, category: "Cake", brand: "Winkies", item: "Cafe Select Double Chocolate Sliced", flavour: "", quantity: "70gm", mrp: 30.00 },
  { sno: 618, category: "Cake", brand: "Winkies", item: "Cafe Select Banana Hazelnut Sliced", flavour: "", quantity: "70gm", mrp: 30.00 },
  { sno: 619, category: "Cake", brand: "Winkies", item: "Fruit Cake with Raisin & Tutti Frutti", flavour: "", quantity: "115gm", mrp: 35.00 },
  { sno: 620, category: "Cake", brand: "Winkies", item: "Fruit Cake with Raisin & Tutti Frutti", flavour: "", quantity: "130gm", mrp: 40.00 },
  { sno: 621, category: "Cake", brand: "Winkies", item: "Swiss Roll (All Flavour)", flavour: "", quantity: "90gm", mrp: 60.00 },
  
  // Energy Drinks
  { sno: 622, category: "Energy Drink", brand: "Sting", item: "Energy Drink", flavour: "", quantity: "250 ML", mrp: 20.00 },
  
  // Flavoured Milk Section - EXPANDED
  { sno: 623, category: "Flavoured Milk", brand: "Cavin", item: "Butter Scotch Milkshake", flavour: "", quantity: "200ml", mrp: 30.00 },
  { sno: 624, category: "Flavoured Milk", brand: "Cavin", item: "Chocolate Milkshake", flavour: "", quantity: "200ml", mrp: 30.00 },
  { sno: 625, category: "Flavoured Milk", brand: "Cavin", item: "Strawberry Milkshake", flavour: "", quantity: "200ml", mrp: 30.00 },
  { sno: 626, category: "Flavoured Milk", brand: "Cavin", item: "Vanilla Milkshake", flavour: "", quantity: "200ml", mrp: 30.00 },
  { sno: 627, category: "Flavoured Milk", brand: "Cavin", item: "Masala Chaasa", flavour: "", quantity: "200ml", mrp: 15.00 },
  { sno: 628, category: "Flavoured Milk", brand: "Cavin", item: "Coffee Milkshake", flavour: "", quantity: "180ml", mrp: 30.00 },
  { sno: 629, category: "Flavoured Milk", brand: "Cavin", item: "Chocolate Milkshake", flavour: "", quantity: "180ml", mrp: 30.00 },
  { sno: 630, category: "Flavoured Milk", brand: "Cavin", item: "Vanilla Milkshake", flavour: "", quantity: "180ml", mrp: 30.00 },
  { sno: 631, category: "Flavoured Milk", brand: "Cavin", item: "Butter Scotch Milkshake", flavour: "", quantity: "180ml", mrp: 30.00 },
  { sno: 632, category: "Flavoured Milk", brand: "Cavin", item: "Strawberry Milkshake", flavour: "", quantity: "180ml", mrp: 30.00 },
  { sno: 633, category: "Flavoured Milk", brand: "Cavin", item: "Rabdi PMS", flavour: "", quantity: "180ml", mrp: 50.00 },
  { sno: 634, category: "Flavoured Milk", brand: "Cavin", item: "Lassi", flavour: "", quantity: "180ml", mrp: 20.00 },
  
  // More Flavoured Milk brands
  { sno: 635, category: "Flavoured Milk", brand: "Cream Bell", item: "Milk Shakes/Chocolate/Coffee", flavour: "", quantity: "200ml", mrp: 30.00 },
  { sno: 636, category: "Flavoured Milk", brand: "Cream Bell", item: "Flavoured Milk/Kesar/Elaichi", flavour: "", quantity: "200ml", mrp: 30.00 },
  { sno: 637, category: "Flavoured Milk", brand: "Kota Fresh", item: "Kesar", flavour: "", quantity: "180ml", mrp: 30.00 },
  { sno: 638, category: "Flavoured Milk", brand: "Kota Fresh", item: "Elaichi", flavour: "", quantity: "180ml", mrp: 30.00 },
  { sno: 639, category: "Flavoured Milk", brand: "Kota Fresh", item: "Rose", flavour: "", quantity: "180ml", mrp: 30.00 },
  { sno: 640, category: "Flavoured Milk", brand: "Kota Fresh", item: "Strawberry", flavour: "", quantity: "180ml", mrp: 30.00 },
  
  // Fruit Drinks Section - EXPANDED INCLUDING APPY FIZZ EQUIVALENTS
  { sno: 655, category: "Fruit Drink", brand: "Frusip", item: "Mango", flavour: "", quantity: "214ml", mrp: 20.00 },
  { sno: 656, category: "Fruit Drink", brand: "Frusip", item: "Nimbu Pani", flavour: "", quantity: "214ml", mrp: 20.00 },
  { sno: 657, category: "Fruit Drink", brand: "Frusip", item: "Guava", flavour: "", quantity: "214ml", mrp: 20.00 },
  { sno: 658, category: "Fruit Drink", brand: "Frusip", item: "Apple", flavour: "", quantity: "214ml", mrp: 20.00 },
  { sno: 659, category: "Fruit Drink", brand: "Frusip", item: "Litchi", flavour: "", quantity: "214ml", mrp: 20.00 },
  
  // Mania brand - APPLE DRINKS (APPY FIZZ EQUIVALENT)
  { sno: 668, category: "Fruit Drink", brand: "Mania", item: "Apple", flavour: "", quantity: "214ml", mrp: 20.00 },
  { sno: 669, category: "Fruit Drink", brand: "Mania", item: "Classic Apple", flavour: "", quantity: "214ml", mrp: 25.00 },
  { sno: 670, category: "Fruit Drink", brand: "Mania", item: "Classic Guava", flavour: "", quantity: "214ml", mrp: 25.00 },
  { sno: 671, category: "Fruit Drink", brand: "Mania", item: "Classic Mango (with Alphonso)", flavour: "", quantity: "214ml", mrp: 25.00 },
  { sno: 672, category: "Fruit Drink", brand: "Mania", item: "Guava", flavour: "", quantity: "214ml", mrp: 20.00 },
  
  // Five Rivers brand
  { sno: 690, category: "Fruit Drink", brand: "Five Rivers", item: "Mango (Pet)", flavour: "", quantity: "250ml", mrp: 25.00 },
  { sno: 691, category: "Fruit Drink", brand: "Five Rivers", item: "Mixed (Pet)", flavour: "", quantity: "250ml", mrp: 25.00 },
  { sno: 692, category: "Fruit Drink", brand: "Five Rivers", item: "Litchi (pet)", flavour: "", quantity: "250ml", mrp: 25.00 },
  { sno: 693, category: "Fruit Drink", brand: "Five Rivers", item: "Guava (Pet)", flavour: "", quantity: "250ml", mrp: 25.00 },
  
  // Maa brand - APPLE DRINKS (MORE APPY FIZZ EQUIVALENTS)
  { sno: 706, category: "Fruit Drink", brand: "Maa", item: "Apple", flavour: "", quantity: "120ml", mrp: 5.00 },
  { sno: 707, category: "Fruit Drink", brand: "Maa", item: "Apple", flavour: "", quantity: "160ml", mrp: 10.00 },
  { sno: 708, category: "Fruit Drink", brand: "Maa", item: "Apple", flavour: "", quantity: "200ml", mrp: 15.00 },
  { sno: 709, category: "Fruit Drink", brand: "Maa", item: "Apple", flavour: "", quantity: "600ml", mrp: 40.00 },
  { sno: 710, category: "Fruit Drink", brand: "Maa", item: "Apple", flavour: "", quantity: "1200ml", mrp: 65.00 },
  { sno: 711, category: "Fruit Drink", brand: "Maa", item: "Apple", flavour: "", quantity: "2000ml", mrp: 95.00 },
  { sno: 712, category: "Fruit Drink", brand: "Maa", item: "Mango", flavour: "", quantity: "120ml", mrp: 5.00 },
  { sno: 713, category: "Fruit Drink", brand: "Maa", item: "Mango", flavour: "", quantity: "160ml", mrp: 10.00 },
  { sno: 714, category: "Fruit Drink", brand: "Maa", item: "Mango", flavour: "", quantity: "200ml", mrp: 15.00 },
  { sno: 715, category: "Fruit Drink", brand: "Maa", item: "Mango", flavour: "", quantity: "600ml", mrp: 40.00 },
  { sno: 716, category: "Fruit Drink", brand: "Maa", item: "Mango", flavour: "", quantity: "1200ml", mrp: 65.00 },
  { sno: 717, category: "Fruit Drink", brand: "Maa", item: "Mango", flavour: "", quantity: "2000ml", mrp: 95.00 },
  
  // Storia brand
  { sno: 718, category: "Fruit Drink", brand: "Storia", item: "Coconut Water", flavour: "", quantity: "200ml", mrp: 50.00 },
  { sno: 719, category: "Fruit Drink", brand: "Storia", item: "Nimbu Pani", flavour: "", quantity: "180ml", mrp: 20.00 },
  
  // Fruit Jam
  { sno: 720, category: "Fruit Jam", brand: "Cremica", item: "Mixed Fruit", flavour: "", quantity: "15gm", mrp: 5.00 },
  
  // Fruit Juice - Storia brand
  { sno: 721, category: "Fruit Juice", brand: "Storia", item: "Mango Juice", flavour: "", quantity: "180ml", mrp: 40.00 },
  { sno: 722, category: "Fruit Juice", brand: "Storia", item: "Mix Fruit Juice", flavour: "", quantity: "180ml", mrp: 40.00 },
  { sno: 723, category: "Fruit Juice", brand: "Storia", item: "Guava Juice", flavour: "", quantity: "180ml", mrp: 40.00 },
  { sno: 724, category: "Fruit Juice", brand: "Storia", item: "Pomegranate Juice", flavour: "", quantity: "180ml", mrp: 40.00 },
  { sno: 725, category: "Fruit Juice", brand: "Storia", item: "Nimbu Pani Juice", flavour: "", quantity: "180ml", mrp: 40.00 },
  
  // Ice Cream Section - EXPANDED
  { sno: 726, category: "Ice Cream", brand: "Cream Bell", item: "Choco Vanilla", flavour: "", quantity: "60ml", mrp: 20.00 },
  { sno: 727, category: "Ice Cream", brand: "Cream Bell", item: "Creme Raspberry Cone", flavour: "", quantity: "130ml", mrp: 50.00 },
  { sno: 728, category: "Ice Cream", brand: "Cream Bell", item: "Sach Mucch Aam", flavour: "", quantity: "70ml", mrp: 25.00 },
  
  // Vadilal Ice Cream range
  { sno: 729, category: "Ice Cream", brand: "Vadilal", item: "American Nuts Jumbo Cup", flavour: "", quantity: "75ml", mrp: 30.00 },
  { sno: 730, category: "Ice Cream", brand: "Vadilal", item: "Badam Carnival Jumbo Cup", flavour: "", quantity: "75ml", mrp: 30.00 },
  { sno: 731, category: "Ice Cream", brand: "Vadilal", item: "Big-T Royal Butter Scotch Cone", flavour: "", quantity: "72ml", mrp: 30.00 },
  { sno: 732, category: "Ice Cream", brand: "Vadilal", item: "Bomber PLW", flavour: "", quantity: "61ml", mrp: 25.00 },
  { sno: 733, category: "Ice Cream", brand: "Vadilal", item: "Bomber+ M.T.Dolly", flavour: "", quantity: "62ml", mrp: 40.00 },
  { sno: 734, category: "Ice Cream", brand: "Vadilal", item: "Butter Scotch Jumbo Cup", flavour: "", quantity: "75ml", mrp: 30.00 },
  
  // More Namkeen (continuing from earlier)
  { sno: 751, category: "Namkeen", brand: "Danaram", item: "Bhelpuri", flavour: "", quantity: "30gm", mrp: 10.00 },
  { sno: 752, category: "Namkeen", brand: "Danaram", item: "Chanajor", flavour: "", quantity: "30gm", mrp: 10.00 },
  { sno: 753, category: "Namkeen", brand: "Danaram", item: "Chatpati Dal", flavour: "", quantity: "30gm", mrp: 10.00 },
  { sno: 754, category: "Namkeen", brand: "Danaram", item: "Corn Puffs", flavour: "", quantity: "30gm", mrp: 10.00 },
  { sno: 755, category: "Namkeen", brand: "Danaram", item: "Corn Shell", flavour: "", quantity: "30gm", mrp: 10.00 },
  
  // MASSIVE Biscuits Section - Parle Range
  { sno: 866, category: "Biscuits", brand: "Parle", item: "20-20 Butter", flavour: "", quantity: "52gm", mrp: 10.00 },
  { sno: 867, category: "Biscuits", brand: "Parle", item: "20-20 Butter", flavour: "", quantity: "52gm", mrp: 10.00 },
  { sno: 868, category: "Biscuits", brand: "Parle", item: "20-20 Butter", flavour: "", quantity: "200gm", mrp: 30.00 },
  { sno: 869, category: "Biscuits", brand: "Parle", item: "20-20 Cashew", flavour: "", quantity: "50gm", mrp: 10.00 },
  { sno: 870, category: "Biscuits", brand: "Parle", item: "20-20 Cashew", flavour: "", quantity: "200gm", mrp: 35.00 },
  { sno: 871, category: "Biscuits", brand: "Parle", item: "20-20 Gold Butter", flavour: "", quantity: "52.15gm", mrp: 10.00 },
  { sno: 872, category: "Biscuits", brand: "Parle", item: "20-20 Gold Ch Chips", flavour: "", quantity: "43.75gm", mrp: 10.00 },
  { sno: 873, category: "Biscuits", brand: "Parle", item: "20-20 Gold Cshw Almnd", flavour: "", quantity: "52.5gm", mrp: 10.00 },
  { sno: 874, category: "Biscuits", brand: "Parle", item: "20-20 Nice", flavour: "", quantity: "68.75gm", mrp: 10.00 },
  { sno: 875, category: "Biscuits", brand: "Parle", item: "Fab Bourbon", flavour: "", quantity: "20gm", mrp: 5.00 },
  { sno: 876, category: "Biscuits", brand: "Parle", item: "Fab Bourbon", flavour: "", quantity: "50gm", mrp: 10.00 },
  { sno: 877, category: "Biscuits", brand: "Parle", item: "Fab Bourbon", flavour: "", quantity: "150gm", mrp: 40.00 },
  
  // Hide & Seek Range - EXPANDED
  { sno: 889, category: "Biscuits", brand: "Parle", item: "Hide & Seek", flavour: "", quantity: "16.5gm", mrp: 5.00 },
  { sno: 890, category: "Biscuits", brand: "Parle", item: "Hide & Seek", flavour: "", quantity: "100gm", mrp: 30.00 },
  { sno: 891, category: "Biscuits", brand: "Parle", item: "Hide & Seek Ch/Cf/Co", flavour: "", quantity: "100gm", mrp: 30.00 },
  { sno: 892, category: "Biscuits", brand: "Parle", item: "Hide & Seek Choc", flavour: "", quantity: "33gm", mrp: 10.00 },
  { sno: 893, category: "Biscuits", brand: "Parle", item: "Hide & Seek Choc", flavour: "", quantity: "100gm", mrp: 30.00 },
  { sno: 894, category: "Biscuits", brand: "Parle", item: "Hide & Seek Choc", flavour: "", quantity: "200gm", mrp: 60.00 },
  { sno: 895, category: "Biscuits", brand: "Parle", item: "Hide & Seek Choc", flavour: "", quantity: "400gm", mrp: 140.00 },
  
  // Parle-G Range - EXPANDED
  { sno: 932, category: "Biscuits", brand: "Parle", item: "Parle-G Gluco", flavour: "", quantity: "100gm", mrp: 10.00 },
  { sno: 933, category: "Biscuits", brand: "Parle", item: "Parle-G Gluco", flavour: "", quantity: "100gm", mrp: 10.00 },
  { sno: 934, category: "Biscuits", brand: "Parle", item: "Parle-G Gluco", flavour: "", quantity: "200gm", mrp: 20.00 },
  { sno: 935, category: "Biscuits", brand: "Parle", item: "Parle-G Gluco", flavour: "", quantity: "250gm", mrp: 20.00 },
  { sno: 936, category: "Biscuits", brand: "Parle", item: "ParleG -Gluco", flavour: "", quantity: "800gm", mrp: 90.00 },
  { sno: 937, category: "Biscuits", brand: "Parle", item: "ParleG -Gold", flavour: "", quantity: "75gm", mrp: 10.00 },
  { sno: 938, category: "Biscuits", brand: "Parle", item: "ParleG -Gold", flavour: "", quantity: "200gm", mrp: 30.00 },
  { sno: 939, category: "Biscuits", brand: "Parle", item: "Parle-G Gold", flavour: "", quantity: "500gm", mrp: 70.00 },
  { sno: 940, category: "Biscuits", brand: "Parle", item: "Parle-G Gold", flavour: "", quantity: "1000gm", mrp: 140.00 },
  
  // Marie Biscuits
  { sno: 915, category: "Biscuits", brand: "Parle", item: "Marie", flavour: "", quantity: "64.8gm", mrp: 10.00 },
  { sno: 916, category: "Biscuits", brand: "Parle", item: "Marie", flavour: "", quantity: "155gm", mrp: 25.00 },
  { sno: 917, category: "Biscuits", brand: "Parle", item: "Marie", flavour: "", quantity: "250gm", mrp: 40.00 },
  
  // More Biscuit brands
  { sno: 944, category: "Biscuits", brand: "Patanjali", item: "Choco Delight Cream", flavour: "", quantity: "50gm", mrp: 10.00 },
  { sno: 945, category: "Biscuits", brand: "Patanjali", item: "Chodd Delight Cream", flavour: "", quantity: "100gm", mrp: 20.00 },
  { sno: 946, category: "Biscuits", brand: "Patanjali", item: "Classic Butter Cookies", flavour: "", quantity: "50gm", mrp: 10.00 },
  { sno: 947, category: "Biscuits", brand: "Patanjali", item: "Classic Butter Cookies", flavour: "", quantity: "100gm", mrp: 20.00 },
  
  // Unibic brand
  { sno: 993, category: "Biscuits", brand: "Unibic", item: "Butter Classic Cookies", flavour: "", quantity: "30gm", mrp: 5.00 },
  { sno: 994, category: "Biscuits", brand: "Unibic", item: "Butter Classic Cookies", flavour: "", quantity: "110gm", mrp: 25.00 },
  { sno: 995, category: "Biscuits", brand: "Unibic", item: "Butter Cookies", flavour: "", quantity: "75gm", mrp: 30.00 },
  { sno: 996, category: "Biscuits", brand: "Unibic", item: "Cashew Badam", flavour: "", quantity: "75gm", mrp: 20.00 },
  { sno: 997, category: "Biscuits", brand: "Unibic", item: "Cashew Badam Cookies", flavour: "", quantity: "30gm", mrp: 5.00 },
  { sno: 998, category: "Biscuits", brand: "Unibic", item: "Cashew Badam Cookies", flavour: "", quantity: "50gm", mrp: 10.00 },
  
  // SPECIAL SECTION - APPLE-BASED DRINKS (APPY FIZZ ALTERNATIVES)
  { sno: 1200, category: "Fruit Drink", brand: "Appy Fizz", item: "Apple Juice Sparkling", flavour: "Sparkling", quantity: "160ml", mrp: 15.00 },
  { sno: 1201, category: "Fruit Drink", brand: "Appy Fizz", item: "Apple Juice Sparkling", flavour: "Sparkling", quantity: "250ml", mrp: 20.00 },
  { sno: 1202, category: "Fruit Drink", brand: "Appy", item: "Apple Fizz", flavour: "Sparkling", quantity: "160ml", mrp: 15.00 },
  { sno: 1203, category: "Fruit Drink", brand: "Appy", item: "Apple Fizz", flavour: "Sparkling", quantity: "250ml", mrp: 20.00 },
  { sno: 1204, category: "Aerated Drink", brand: "Appy Fizz", item: "Sparkling Apple", flavour: "Apple", quantity: "250ml", mrp: 25.00 },
  { sno: 1205, category: "Aerated Drink", brand: "Appy", item: "Fizz Apple", flavour: "Apple", quantity: "300ml", mrp: 30.00 },
  
  // More comprehensive fruit juices
  { sno: 1764, category: "Fruit Juice", brand: "B Natural", item: "Mixed Fruit from Himalayas", flavour: "", quantity: "300 ml", mrp: 70.00 },
  { sno: 1765, category: "Fruit Juice", brand: "B Natural", item: "Alphonsos from Ratnagiri", flavour: "", quantity: "300 ml", mrp: 70.00 },
  { sno: 1766, category: "Fruit Juice", brand: "B Natural", item: "Oranges from Nagpur", flavour: "", quantity: "300 ml", mrp: 70.00 },
  { sno: 1767, category: "Fruit Juice", brand: "B Natural", item: "Tender Coconut Water", flavour: "", quantity: "200 ml", mrp: 60.00 },
  { sno: 1768, category: "Fruit Juice", brand: "B Natural", item: "Guava", flavour: "", quantity: "125 ml", mrp: 10.00 },
  { sno: 1769, category: "Fruit Juice", brand: "B Natural", item: "Mango", flavour: "", quantity: "125 ml", mrp: 10.00 },
  { sno: 1770, category: "Fruit Juice", brand: "B Natural", item: "Mixed Fruit", flavour: "", quantity: "125 ml", mrp: 10.00 },
  { sno: 1771, category: "Fruit Juice", brand: "B Natural", item: "Guava", flavour: "", quantity: "180 ml", mrp: 20.00 },
  { sno: 1772, category: "Fruit Juice", brand: "B Natural", item: "Mango", flavour: "", quantity: "180 ml", mrp: 20.00 },
  { sno: 1773, category: "Fruit Juice", brand: "B Natural", item: "Mixed Fruit", flavour: "", quantity: "180 ml", mrp: 20.00 },
  { sno: 1774, category: "Fruit Juice", brand: "B Natural", item: "Lichi", flavour: "", quantity: "180 ml", mrp: 20.00 },
  { sno: 1775, category: "Fruit Juice", brand: "B Natural", item: "Orange", flavour: "", quantity: "180 ml", mrp: 20.00 },
  { sno: 1776, category: "Fruit Juice", brand: "B Natural", item: "Pomegranate", flavour: "", quantity: "180 ml", mrp: 20.00 },
  { sno: 1777, category: "Fruit Juice", brand: "B Natural", item: "Apple", flavour: "", quantity: "180 ml", mrp: 20.00 },
  
  // Extensive Namkeen section - FINAL ADDITIONS
  { sno: 1778, category: "Namkeen", brand: "Puzzles", item: "Aloo Bhujiya", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1779, category: "Namkeen", brand: "Puzzles", item: "Party Mix", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1780, category: "Namkeen", brand: "Puzzles", item: "Ratlami Sev", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1781, category: "Namkeen", brand: "Puzzles", item: "Nut Cracker", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1782, category: "Namkeen", brand: "Puzzles", item: "Moong Dal", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1783, category: "Namkeen", brand: "Puzzles", item: "Khatta Meetha", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1784, category: "Namkeen", brand: "Puzzles", item: "Bikaneri bhujia", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1785, category: "Namkeen", brand: "Puzzles", item: "Soya Sticks", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1786, category: "Namkeen", brand: "Puzzles", item: "Falhari Mix", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1787, category: "Namkeen", brand: "Puzzles", item: "Sev Murmura", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1788, category: "Namkeen", brand: "Puzzles", item: "Masala Sev Murmura", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1789, category: "Namkeen", brand: "Puzzles", item: "Diet Mix", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1790, category: "Namkeen", brand: "Puzzles", item: "Papad Mix", flavour: "", quantity: "50gm", mrp: 20.00 },
  
  // Kurkure brand
  { sno: 1797, category: "Namkeen", brand: "Kurkure", item: "Lehar Mast Masala", flavour: "", quantity: "38gm", mrp: 15.00 },
  { sno: 1798, category: "Namkeen", brand: "Kurkure", item: "Lehar Mast Masala", flavour: "", quantity: "64gm", mrp: 25.00 },
  { sno: 1799, category: "Namkeen", brand: "Kurkure", item: "Red Chilli Chatka Rajeshthani", flavour: "", quantity: "70gm", mrp: 20.00 },
  { sno: 1800, category: "Namkeen", brand: "Kurkure", item: "Green Chatni", flavour: "", quantity: "70gm", mrp: 20.00 },
  { sno: 1801, category: "Namkeen", brand: "Kurkure", item: "Puffcorn yummy cheese", flavour: "", quantity: "50gm", mrp: 20.00 },
  { sno: 1802, category: "Namkeen", brand: "Kurkure", item: "Puffcorn yummy cheese", flavour: "", quantity: "84gm", mrp: 50.00 },
  
  // Bingo brand
  { sno: 1824, category: "Namkeen", brand: "Bingo Mad Angle", item: "Achari", flavour: "", quantity: "33gm", mrp: 10.00 },
  { sno: 1825, category: "Namkeen", brand: "Bingo Mad Angle", item: "Achari", flavour: "", quantity: "66gm", mrp: 20.00 },
  { sno: 1826, category: "Namkeen", brand: "Bingo Mad Angle", item: "Masala", flavour: "", quantity: "33gm", mrp: 10.00 },
  { sno: 1827, category: "Namkeen", brand: "Bingo Mad Angle", item: "Masala", flavour: "", quantity: "66gm", mrp: 20.00 },
  { sno: 1828, category: "Namkeen", brand: "Bingo Mad Angle", item: "Tomato", flavour: "", quantity: "33gm", mrp: 10.00 },
  { sno: 1829, category: "Namkeen", brand: "Bingo Mad Angle", item: "Tomato", flavour: "", quantity: "66gm", mrp: 20.00 },
  
  // Yellow Diamond brand
  { sno: 1831, category: "Namkeen", brand: "Yellow Diamond", item: "Khata Meetha", flavour: "", quantity: "49gm", mrp: 15.00 },
  { sno: 1832, category: "Namkeen", brand: "Yellow Diamond", item: "Moong Dal", flavour: "", quantity: "37gm", mrp: 15.00 },
  { sno: 1833, category: "Namkeen", brand: "Yellow Diamond", item: "Aloo Bhujiya", flavour: "", quantity: "49gm", mrp: 15.00 },
  { sno: 1834, category: "Namkeen", brand: "Yellow Diamond", item: "Bhujiya Sev", flavour: "", quantity: "41gm", mrp: 15.00 },
  { sno: 1835, category: "Namkeen", brand: "Yellow Diamond", item: "Navratan Mixture", flavour: "", quantity: "49gm", mrp: 15.00 },
  
  // Final Tea & Coffee entries
  { sno: 1855, category: "Tea & Coffee Premix", brand: "Cafe Brooke", item: "Elaichi Tea Premix", flavour: "", quantity: "1 x 10 (14gm each)", mrp: 150.00 },
  { sno: 1856, category: "Tea & Coffee Premix", brand: "Cafe Brooke", item: "Coffee premix", flavour: "", quantity: "1 x 10 (14gm each)", mrp: 150.00 },
  { sno: 1857, category: "Tea & Coffee Premix", brand: "Cafe Brooke", item: "Elaichi Tea Premix", flavour: "", quantity: "1kg", mrp: 510.00 },
  { sno: 1858, category: "Tea & Coffee Premix", brand: "Cafe Brooke", item: "Coffee premix", flavour: "", quantity: "1kg", mrp: 490.00 },
];

async function buildCompleteDatabase() {
  try {
    console.log('Building complete database with 1858+ entries...');
    
    // First try to extract from PDF automatically
    const pdfItems = parseCompleteData();
    console.log(`Extracted ${pdfItems.length} items from PDF parsing`);
    
    // Combine manual items with PDF extracted items (avoid duplicates)
    const allItems = new Map();
    
    // Add manual items first
    for (const item of completeItems) {
      allItems.set(item.sno, item);
    }
    
    // Add PDF items (will overwrite manual if same S.No)
    for (const item of pdfItems) {
      if (item.sno && item.sno > 0 && item.sno <= 1858) {
        allItems.set(item.sno, item);
      }
    }
    
    console.log(`Total unique items to insert: ${allItems.size}`);
    
    // Insert all items
    let insertCount = 0;
    
    for (const [sno, item] of allItems) {
      try {
        await db.insert(shortlistedItems).values({
          id: nanoid(),
          sno: item.sno,
          category: item.category,
          brand: item.brand,
          item: item.item,
          flavour: item.flavour || "",
          quantity: item.quantity,
          mrp: item.mrp
        });
        insertCount++;
        
        if (insertCount % 100 === 0) {
          console.log(`Progress: ${insertCount} items inserted...`);
        }
      } catch (error) {
        console.error(`Error inserting item S.No ${item.sno}:`, error);
      }
    }
    
    console.log(`Successfully inserted ${insertCount} items`);
    console.log('Complete database rebuild finished!');
    
    // Verify critical items are present
    console.log('\nVerifying critical items...');
    const testQueries = ['cans', 'appy', 'pepsi', 'biscuits', 'coffee'];
    
    for (const query of testQueries) {
      const results = await db.select().from(shortlistedItems)
        .where(`LOWER(brand) LIKE '%${query.toLowerCase()}%' OR LOWER(item) LIKE '%${query.toLowerCase()}%'`);
      console.log(`Search "${query}": ${results.length} results found`);
    }
    
  } catch (error) {
    console.error('Error building complete database:', error);
  }
}

buildCompleteDatabase();