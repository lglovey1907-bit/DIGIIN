import { useState, useEffect, useMemo, useRef } from "react";
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
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounce search term to prevent immediate searching while typing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Use backend search API for better performance and scalability
  const { data: searchResults = [] } = useQuery<ShortlistedItem[]>({
    queryKey: ["/api/shortlisted-items/search", debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm.trim() || debouncedTerm.length < 2) return [];
      
      const response = await fetch(`/api/shortlisted-items/search?q=${encodeURIComponent(debouncedTerm.trim())}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: debouncedTerm.trim().length >= 2,
  });

  // Add match type and field information to search results
  const enhancedResults = useMemo(() => {
    if (!debouncedTerm.trim()) return [];
    
    const term = debouncedTerm.toLowerCase().trim();
    return searchResults.map((item) => {
      let matchType = "General";
      let matchField = "";

      // Determine match type based on what field matched
      if (term.match(/^(s\.?no\.?|sn\.?|serial)\s*(\d+)$/i)) {
        const snoMatch = term.match(/(\d+)/);
        if (snoMatch && item.sno === parseInt(snoMatch[1])) {
          matchType = "Serial Number";
          matchField = `S.No ${item.sno}`;
        }
      } else if (term.match(/^\d+$/) && item.sno === parseInt(term)) {
        matchType = "Serial Number";
        matchField = `S.No ${item.sno}`;
      } else if (item.brand?.toLowerCase().includes(term)) {
        matchType = "Brand";
        matchField = item.brand;
      } else if (item.item?.toLowerCase().includes(term) || item.category?.toLowerCase().includes(term)) {
        matchType = "Category";
        matchField = `${item.category} - ${item.item}`;
      } else if (item.flavour?.toLowerCase().includes(term)) {
        matchType = "Flavour";
        matchField = item.flavour;
      } else if (item.quantity?.toLowerCase().includes(term)) {
        matchType = "Quantity";
        matchField = item.quantity;
      } else if (term.match(/^\d+$/) && item.mrp === parseFloat(term)) {
        matchType = "Price";
        matchField = `₹${item.mrp}`;
      }

      return { ...item, matchType, matchField };
    });
  }, [searchResults, debouncedTerm]);

  useEffect(() => {
    setShowResults(debouncedTerm.length >= 2 && enhancedResults.length > 0);
    setFocusedIndex(-1);
  }, [debouncedTerm, enhancedResults]);

  const selectItem = (item: ShortlistedItem) => {
    const selectedText = `S.No ${item.sno}: ${item.brand || ''} ${item.item || ''} ${item.flavour || ''} (${item.quantity || ''}) - ₹${item.mrp || 0}`;
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
        setFocusedIndex(prev => (prev < enhancedResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : enhancedResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && enhancedResults[focusedIndex]) {
          selectItem(enhancedResults[focusedIndex]);
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
          onFocus={() => debouncedTerm.length >= 2 && enhancedResults.length > 0 && setShowResults(true)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-3 text-gray-400" size={16} />
      </div>
      
      {/* Enhanced Search Results */}
      {showResults && (
        <div className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-xl">
          <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
            {enhancedResults.length} item{enhancedResults.length !== 1 ? 's' : ''} found
          </div>
          {enhancedResults.map((item, index) => (
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
                    {item.flavour || 'N/A'} • {item.quantity || 'N/A'} • ₹{item.mrp || 0}
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
            <div>• Type "cans" for soft drinks, "snacks" for namkeen</div>
            <div>• Type flavour like "Aloo Bhujia" or category like "Biscuits"</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedSmartSearch;