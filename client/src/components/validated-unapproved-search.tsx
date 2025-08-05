import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Search } from "lucide-react";

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
  const [isChecking, setIsChecking] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isApproved: boolean;
    foundItems: ShortlistedItem[];
    message: string;
  } | null>(null);
  const [isValidated, setIsValidated] = useState(false);

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
      } else {
        // Item not found in approved list - can be added as unapproved
        setValidationResult({
          isApproved: false,
          foundItems: [],
          message: `✅ This item is not in the approved catalog. You can record it as unapproved.`
        });
        setIsValidated(true);
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

  // Auto-check when user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== value) {
        setSearchQuery(value);
      }
      if (value.trim()) {
        checkAgainstShortlistedItems(value);
      } else {
        setValidationResult(null);
        setIsValidated(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setIsValidated(false);
    if (!newValue.trim()) {
      setValidationResult(null);
    }
  };

  const handleValidateClick = () => {
    if (value.trim()) {
      checkAgainstShortlistedItems(value);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 ${
            validationResult
              ? validationResult.isApproved
                ? "border-red-300 bg-red-50"
                : "border-green-300 bg-green-50"
              : ""
          }`}
          disabled={isChecking}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleValidateClick}
          disabled={isChecking || !value.trim()}
          className="shrink-0"
        >
          {isChecking ? (
            <div className="w-4 h-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Validation Result */}
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
              
              {/* Show found items if any */}
              {validationResult.foundItems.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-red-700">Found in approved catalog:</p>
                  {validationResult.foundItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-xs bg-white p-2 rounded border border-red-200">
                      <span className="font-medium">S.No {item.sno}:</span> {item.brand} - {item.item}
                      {item.flavour && <span className="text-gray-600"> ({item.flavour})</span>}
                      <span className="text-gray-600"> | {item.quantity} | ₹{item.mrp}</span>
                    </div>
                  ))}
                  {validationResult.foundItems.length > 3 && (
                    <p className="text-xs text-red-600">...and {validationResult.foundItems.length - 3} more</p>
                  )}
                </div>
              )}
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