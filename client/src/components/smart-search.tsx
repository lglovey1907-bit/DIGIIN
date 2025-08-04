import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

export function SmartSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/shortlisted-items/search", { q: searchTerm }],
    enabled: searchTerm.length >= 2,
  });

  useEffect(() => {
    setShowResults(searchTerm.length >= 2 && Array.isArray(searchResults) && searchResults.length > 0);
  }, [searchTerm, searchResults]);

  const selectItem = (item: any) => {
    setSearchTerm(`${item.brand} ${item.item} ${item.flavour || ''} ${item.quantity}`.trim());
    setShowResults(false);
  };

  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium text-gray-700 mb-2">
        Search Shortlisted Items
      </Label>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by S.No, Brand, Item, Flavour..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-3 text-gray-400" size={16} />
        
        {/* Search Results */}
        {showResults && (
          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
            {searchResults?.map((item: any) => (
              <div
                key={item.id}
                onClick={() => selectItem(item)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      {item.brand} {item.item} {item.flavour || ''} {item.quantity}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">₹{item.mrp}</span>
                  </div>
                  <span className="text-xs text-gray-400">S.No: {item.sno}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SmartSearch;
