import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Tag, Hash } from "lucide-react";

interface ShortlistedItem {
  id: string;
  sno: number;
  category: string;
  brand: string;
  item: string;
  flavour: string;
  quantity: string;
  mrp: number;
}

interface EnhancedSmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EnhancedSmartSearch({ value, onChange, placeholder, className }: EnhancedSmartSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [showResults, setShowResults] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Fetch all shortlisted items
  const { data: allItems = [] } = useQuery<ShortlistedItem[]>({
    queryKey: ["/api/shortlisted-items"],
  });

  // Enhanced search logic
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 1) return [];

    const term = searchTerm.toLowerCase().trim();
    const results: Array<ShortlistedItem & { matchType: string; matchField: string }> = [];

    allItems.forEach((item) => {
      // Search by Serial Number (S.No, SN, etc.)
      if (term.match(/^(s\.?no\.?|sn\.?|serial)\s*(\d+)$/i)) {
        const snoMatch = term.match(/(\d+)/);
        if (snoMatch && item.sno === parseInt(snoMatch[1])) {
          results.push({ ...item, matchType: "Serial Number", matchField: `S.No ${item.sno}` });
        }
      }
      // Direct serial number search
      else if (term.match(/^\d+$/) && item.sno === parseInt(term)) {
        results.push({ ...item, matchType: "Serial Number", matchField: `S.No ${item.sno}` });
      }
      // Search by Brand
      else if (item.brand.toLowerCase().includes(term)) {
        results.push({ ...item, matchType: "Brand", matchField: item.brand });
      }
      // Search by Item/Category
      else if (item.item.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)) {
        results.push({ ...item, matchType: "Category", matchField: `${item.category} - ${item.item}` });
      }
      // Search by Flavour
      else if (item.flavour.toLowerCase().includes(term)) {
        results.push({ ...item, matchType: "Flavour", matchField: item.flavour });
      }
      // Search by Quantity
      else if (item.quantity.toLowerCase().includes(term)) {
        results.push({ ...item, matchType: "Quantity", matchField: item.quantity });
      }
      // Search by MRP
      else if (term.match(/^\d+$/) && item.mrp === parseFloat(term)) {
        results.push({ ...item, matchType: "Price", matchField: `₹${item.mrp}` });
      }
    });

    // Remove duplicates and sort by relevance
    const uniqueResults = results.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id)
    );

    // Sort by match type priority: Serial Number > Brand > Category > Flavour > Quantity > Price
    const priority = { "Serial Number": 1, "Brand": 2, "Category": 3, "Flavour": 4, "Quantity": 5, "Price": 6 };
    return uniqueResults.sort((a, b) => (priority[a.matchType as keyof typeof priority] || 10) - (priority[b.matchType as keyof typeof priority] || 10));
  }, [searchTerm, allItems]);

  useEffect(() => {
    setShowResults(searchTerm.length >= 1 && searchResults.length > 0);
    setFocusedIndex(-1);
  }, [searchTerm, searchResults]);

  const selectItem = (item: ShortlistedItem) => {
    const selectedText = `S.No ${item.sno}: ${item.brand} ${item.item} ${item.flavour} (${item.quantity}) - ₹${item.mrp}`;
    setSearchTerm(selectedText);
    onChange(selectedText);
    setShowResults(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && searchResults[focusedIndex]) {
          selectItem(searchResults[focusedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const getMatchIcon = (matchType: string) => {
    switch (matchType) {
      case "Serial Number": return <Hash className="w-3 h-3" />;
      case "Brand": return <Tag className="w-3 h-3" />;
      case "Category": return <Package className="w-3 h-3" />;
      default: return <Search className="w-3 h-3" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder || "Type 'SN 1' or brand name or flavour..."}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length >= 1 && searchResults.length > 0 && setShowResults(true)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-3 text-gray-400" size={16} />
      </div>
      
      {/* Enhanced Search Results */}
      {showResults && (
        <div className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-xl">
          <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
            {searchResults.length} item{searchResults.length !== 1 ? 's' : ''} found
          </div>
          {searchResults.map((item, index) => (
            <div
              key={item.id}
              onClick={() => selectItem(item)}
              className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                index === focusedIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getMatchIcon(item.matchType)}
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {item.matchType}: {item.matchField}
                    </span>
                  </div>
                  <div className="font-medium text-gray-900">
                    {item.brand} {item.item}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.flavour} • {item.quantity} • ₹{item.mrp}
                  </div>
                </div>
                <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  S.No {item.sno}
                </div>
              </div>
            </div>
          ))}
          
          {/* Search Tips */}
          <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
            <div className="font-medium mb-1">Search Tips:</div>
            <div>• Type "SN 1" or just "1" for serial number</div>
            <div>• Type brand name like "Coca Cola" or "Neni Memi"</div>
            <div>• Type flavour like "Aloo Bhujia" or category like "Namkeen"</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedSmartSearch;