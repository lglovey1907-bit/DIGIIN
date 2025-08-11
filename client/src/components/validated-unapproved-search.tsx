import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Search } from "lucide-react";

interface ShortlistedItem {
  sn: number;        // Not 'id' and 'sno'
  items: string;     // Not 'item' 
  brand: string;
  flavour: string;
  quantity: string;
  mrp: string;       // Text, not number
}

interface ValidatedUnapprovedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ValidatedUnapprovedSearch({ 
  value, 
  onChange, 
  placeholder = "Enter item to check if approved...", 
  className = "" 
}: ValidatedUnapprovedSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isApproved: boolean;
    foundItems: ShortlistedItem[];
    message: string;
  } | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [showFoundItems, setShowFoundItems] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Check if item exists in shortlisted items (7A database)
  const checkAgainstShortlistedItems = async (query: string) => {
    if (!query.trim()) {
      setValidationResult(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/shortlisted-items/search?q=${encodeURIComponent(query)}`);
      const foundItems: ShortlistedItem[] = await response.json();
      
      if (foundItems && foundItems.length > 0) {
        // Item found in approved list - cannot be added as unapproved
        setValidationResult({
          isApproved: true,
          foundItems,
          message: `⚠️ This item is already approved! Found ${foundItems.length} matching item(s) in the shortlisted catalog.`
        });
        setIsValidated(false);
        setShowFoundItems(true);
      } else {
        // Item not found in approved list - can be added as unapproved
        setValidationResult({
          isApproved: false,
          foundItems: [],
          message: `✅ This item is not in the approved catalog. You can record it as unapproved.`
        });
        setIsValidated(true);
        setShowFoundItems(false);
      }
    } catch (error) {
      console.error('Error checking shortlisted items:', error);
      setValidationResult({
        isApproved: false,
        foundItems: [],
        message: "❌ Error checking item. Please try again."
      });
      setIsValidated(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Debounce the search query to prevent immediate searching while typing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 1200); // Wait 1.2 seconds for user to finish typing

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Auto-check when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery.length >= 4) {
      checkAgainstShortlistedItems(debouncedQuery);
    } else {
      setValidationResult(null);
      setIsValidated(false);
      setShowFoundItems(false);
    }
  }, [debouncedQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    // Don't immediately show results while typing
    if (newValue.length < 4) {
      setShowFoundItems(false);
    }
  };

  const handleValidateClick = () => {
    if (searchQuery.trim()) {
      checkAgainstShortlistedItems(searchQuery);
    }
  };

  const closeDropdown = () => {
    setShowFoundItems(false);
  };

  return (
    <div className={`relative space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`${
              validationResult
                ? validationResult.isApproved
                  ? "border-red-300 bg-red-50"
                  : "border-green-300 bg-green-50"
                : ""
            }`}
            disabled={isChecking}
            onFocus={() => {
              // Only show dropdown if user hasn't seen results yet and there are results
              if (debouncedQuery.length >= 4 && validationResult?.foundItems && validationResult.foundItems.length > 0 && !isChecking) {
                // Small delay to prevent immediate show
                setTimeout(() => setShowFoundItems(true), 200);
              }
            }}
            onBlur={(e) => {
              // Hide dropdown when clicking outside, but with delay to allow clicking on results
              setTimeout(() => {
                if (!e.currentTarget.contains(document.activeElement)) {
                  setShowFoundItems(false);
                }
              }, 150);
            }}
          />
          {isChecking && (
            <div className="absolute right-3 top-3">
              <div className="w-4 h-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          )}
          
          {/* Scrollable Found Items Dropdown */}
          {showFoundItems && validationResult && validationResult.foundItems.length > 0 && (
            <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto border border-red-300 rounded-lg bg-white shadow-xl">
              <div className="p-2 bg-red-50 border-b text-xs text-red-700 font-medium">
                ⚠️ Found {validationResult.foundItems.length} matching item(s) in approved catalog
              </div>
              {validationResult.foundItems.map((item, index) => (
                <div
                  key={item.sn}
                  onClick={closeDropdown}
                  className="p-3 border-b last:border-b-0 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.brand} {item.items}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.flavour || 'N/A'} • {item.quantity || 'N/A'} • ₹{item.mrp || 0}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      S.No {item.sn}
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-3 bg-red-50 border-t text-xs text-red-600">
                This item is already approved and should not be added to unapproved items.
              </div>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleValidateClick}
          disabled={isChecking || !searchQuery.trim()}
          className="shrink-0"
        >
          {isChecking ? (
            <div className="w-4 h-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Validation Result Alert */}
      {validationResult && (
        <Alert className={validationResult.isApproved ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <div className="flex items-start gap-2">
            {validationResult.isApproved ? (
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <AlertDescription className={validationResult.isApproved ? "text-red-800" : "text-green-800"}>
                {validationResult.message}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-600">
        <strong>7B Validation:</strong> This automatically checks if the item is already approved in the shortlisted catalog (7A). 
        Only items NOT found in the approved list can be recorded as unapproved.
      </p>
    </div>
  );
}