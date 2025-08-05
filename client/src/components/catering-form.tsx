import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SmartSearch } from "./smart-search";
import { Upload, Plus, Trash2, Utensils } from "lucide-react";

interface CateringFormProps {
  observations: any;
  onObservationsChange: (observations: any) => void;
}

export default function CateringForm({ observations, onObservationsChange }: CateringFormProps) {
  const [overchargingItems, setOverchargingItems] = useState([
    { name: "", mrpPrice: "", sellingPrice: "" }
  ]);
  
  const [unapprovedItems, setUnapprovedItems] = useState([""]);
  
  const [additionalPoints, setAdditionalPoints] = useState([]);
  
  // Multiple companies state
  const [companies, setCompanies] = useState([
    {
      companyName: "",
      unitType: "",
      platformNo: "",
      vendorName: "",
      billMachine: "",
      foodLicense: "",
      medicalCard: false,
      properUniform: false,
      digitalPayment: "",
      rateListDisplay: "",
      policeVerification: false,
      unapprovedItems: [""],
      overchargingItems: [{ name: "", mrpPrice: "", sellingPrice: "" }]
    }
  ]);

  const updateObservation = (point: string, data: any) => {
    onObservationsChange({
      ...observations,
      [point]: data
    });
  };

  const addOverchargingItem = () => {
    setOverchargingItems([...overchargingItems, { name: "", mrpPrice: "", sellingPrice: "" }]);
  };

  const removeOverchargingItem = (index: number) => {
    if (overchargingItems.length > 1) {
      setOverchargingItems(overchargingItems.filter((_, i) => i !== index));
    }
  };

  const updateOverchargingItem = (index: number, field: string, value: string) => {
    const updated = overchargingItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setOverchargingItems(updated);
    updateObservation('overchargingItems', updated);
  };

  const addUnapprovedItem = () => {
    setUnapprovedItems([...unapprovedItems, ""]);
  };

  const removeUnapprovedItem = (index: number) => {
    if (unapprovedItems.length > 1) {
      setUnapprovedItems(unapprovedItems.filter((_, i) => i !== index));
    }
  };

  const updateUnapprovedItem = (index: number, value: string) => {
    const updated = unapprovedItems.map((item, i) => i === index ? value : item);
    setUnapprovedItems(updated);
    updateObservation('unapprovedItems', updated);
  };

  // Multiple companies functions
  const addCompany = () => {
    const newCompany = {
      companyName: "",
      unitType: "",
      platformNo: "",
      vendorName: "",
      billMachine: "",
      foodLicense: "",
      medicalCard: false,
      properUniform: false,
      digitalPayment: "",
      rateListDisplay: "",
      policeVerification: false,
      unapprovedItems: [""],
      overchargingItems: [{ name: "", mrpPrice: "", sellingPrice: "" }]
    };
    const updatedCompanies = [...companies, newCompany];
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const removeCompany = (companyIndex: number) => {
    if (companies.length > 1) {
      const updatedCompanies = companies.filter((_, i) => i !== companyIndex);
      setCompanies(updatedCompanies);
      updateObservation('companies', updatedCompanies);
    }
  };

  const updateCompany = (companyIndex: number, field: string, value: any) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex ? { ...company, [field]: value } : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const addCompanyUnapprovedItem = (companyIndex: number) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex 
        ? { ...company, unapprovedItems: [...company.unapprovedItems, ""] }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const removeCompanyUnapprovedItem = (companyIndex: number, itemIndex: number) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex && company.unapprovedItems.length > 1
        ? { ...company, unapprovedItems: company.unapprovedItems.filter((_, j) => j !== itemIndex) }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const updateCompanyUnapprovedItem = (companyIndex: number, itemIndex: number, value: string) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex 
        ? { 
            ...company, 
            unapprovedItems: company.unapprovedItems.map((item, j) => j === itemIndex ? value : item)
          }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const addCompanyOverchargingItem = (companyIndex: number) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex 
        ? { 
            ...company, 
            overchargingItems: [...company.overchargingItems, { name: "", mrpPrice: "", sellingPrice: "" }]
          }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const removeCompanyOverchargingItem = (companyIndex: number, itemIndex: number) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex && company.overchargingItems.length > 1
        ? { ...company, overchargingItems: company.overchargingItems.filter((_, j) => j !== itemIndex) }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const updateCompanyOverchargingItem = (companyIndex: number, itemIndex: number, field: string, value: string) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex 
        ? { 
            ...company, 
            overchargingItems: company.overchargingItems.map((item, j) => 
              j === itemIndex ? { ...item, [field]: value } : item
            )
          }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Utensils className="mr-3 text-nr-blue" size={24} />
          Catering Inspection Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Multiple Companies */}
        <div className="mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-nr-navy">Company Inspections</h3>
          </div>
          
          {companies.map((company, companyIndex) => (
            <div key={companyIndex} className="bg-gray-50 rounded-lg p-4 mb-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-nr-navy">
                  Company {companyIndex + 1} - Vendor Information
                </h4>
                {companies.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCompany(companyIndex)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Name of Company</Label>
                  <Input
                    placeholder="M/s Company Name"
                    value={company.companyName || ""}
                    onChange={(e) => updateCompany(companyIndex, 'companyName', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Type of Unit & Number</Label>
                  <Input
                    placeholder="e.g., SMU Stall No.1"
                    value={company.unitType || ""}
                    onChange={(e) => updateCompany(companyIndex, 'unitType', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Platform Number</Label>
                  <Input
                    placeholder="Platform No."
                    value={company.platformNo || ""}
                    onChange={(e) => updateCompany(companyIndex, 'platformNo', e.target.value)}
                  />
                </div>
              </div>

              {/* Company-specific Observation Points */}
              <div className="space-y-4">
                {/* Point 1: Vendor Name */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">1</span>
                    Name of the Vendor
                  </h5>
                  <Input
                    placeholder="Enter vendor name"
                    value={company.vendorName || ""}
                    onChange={(e) => updateCompany(companyIndex, 'vendorName', e.target.value)}
                  />
                  <div className="mt-2">
                    <Input type="file" accept="image/*" className="text-sm" />
                  </div>
                </div>

                {/* Point 2: Uniform & Documentation */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">2</span>
                    Uniform & Documentation Check
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`properUniform-${companyIndex}`}
                        checked={company.properUniform || false}
                        onCheckedChange={(checked) => updateCompany(companyIndex, 'properUniform', checked)}
                      />
                      <Label htmlFor={`properUniform-${companyIndex}`}>Proper Uniform</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`medicalCard-${companyIndex}`}
                        checked={company.medicalCard || false}
                        onCheckedChange={(checked) => updateCompany(companyIndex, 'medicalCard', checked)}
                      />
                      <Label htmlFor={`medicalCard-${companyIndex}`}>Medical Card</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`policeVerification-${companyIndex}`}
                        checked={company.policeVerification || false}
                        onCheckedChange={(checked) => updateCompany(companyIndex, 'policeVerification', checked)}
                      />
                      <Label htmlFor={`policeVerification-${companyIndex}`}>Police Verification</Label>
                    </div>
                  </div>
                  <Input type="file" accept="image/*" className="mt-2 text-sm" />
                </div>

                {/* Point 3: Food License */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">3</span>
                    Food License
                  </h5>
                  <RadioGroup 
                    value={company.foodLicense || ""}
                    onValueChange={(value) => updateCompany(companyIndex, 'foodLicense', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="available" id={`license-available-${companyIndex}`} />
                      <Label htmlFor={`license-available-${companyIndex}`}>Available</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="not_available" id={`license-not-available-${companyIndex}`} />
                      <Label htmlFor={`license-not-available-${companyIndex}`}>Not Available</Label>
                    </div>
                  </RadioGroup>
                  <Input type="file" accept="image/*" className="mt-2 text-sm" />
                </div>

                {/* Point 4: Rate List Display */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">4</span>
                    Rate List & "No Bill Food is Free" Display
                  </h5>
                  <RadioGroup 
                    value={company.rateListDisplay || ""}
                    onValueChange={(value) => updateCompany(companyIndex, 'rateListDisplay', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="properly_displayed" id={`rate-displayed-${companyIndex}`} />
                      <Label htmlFor={`rate-displayed-${companyIndex}`}>Properly Displayed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="not_displayed" id={`rate-not-displayed-${companyIndex}`} />
                      <Label htmlFor={`rate-not-displayed-${companyIndex}`}>Not Displayed</Label>
                    </div>
                  </RadioGroup>
                  <Input type="file" accept="image/*" className="mt-2 text-sm" />
                </div>

                {/* Point 5: Bill Machine */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">5</span>
                    Electronic Billing Machine
                  </h5>
                  <RadioGroup 
                    value={company.billMachine || ""}
                    onValueChange={(value) => updateCompany(companyIndex, 'billMachine', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="available_working" id={`bill-working-${companyIndex}`} />
                      <Label htmlFor={`bill-working-${companyIndex}`}>Available & Working</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="available_not_working" id={`bill-not-working-${companyIndex}`} />
                      <Label htmlFor={`bill-not-working-${companyIndex}`}>Available but Not Working</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="not_available" id={`bill-not-available-${companyIndex}`} />
                      <Label htmlFor={`bill-not-available-${companyIndex}`}>Not Available</Label>
                    </div>
                  </RadioGroup>
                  <Input type="file" accept="image/*" className="mt-2 text-sm" />
                </div>

                {/* Point 6: Digital Payment */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">6</span>
                    Digital Payment Acceptance
                  </h5>
                  <RadioGroup 
                    value={company.digitalPayment || ""}
                    onValueChange={(value) => updateCompany(companyIndex, 'digitalPayment', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="accepting" id={`digital-accepting-${companyIndex}`} />
                      <Label htmlFor={`digital-accepting-${companyIndex}`}>Accepting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="not_accepting" id={`digital-not-accepting-${companyIndex}`} />
                      <Label htmlFor={`digital-not-accepting-${companyIndex}`}>Not Accepting</Label>
                    </div>
                  </RadioGroup>
                  <Input type="file" accept="image/*" className="mt-2 text-sm" />
                </div>

                {/* Point 7: Item Verification */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-4 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">7</span>
                    Item Verification
                  </h5>
                  
                  {/* 7A: Shortlisted Items Search */}
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h6 className="font-medium text-green-800 mb-2 flex items-center">
                      <span className="bg-green-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs mr-2">A</span>
                      Shortlisted Items (Approved)
                    </h6>
                    <div className="space-y-2">
                      <SmartSearch
                        value=""
                        onChange={(value) => {}}
                        placeholder="Search approved shortlisted items..."
                        className="w-full"
                      />
                      <p className="text-xs text-green-600">Search and verify items from the approved shortlisted catalog (Reference tool - not included in report)</p>
                    </div>
                  </div>

                  {/* 7B: Unapproved Items */}
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h6 className="font-medium text-red-800 mb-2 flex items-center">
                      <span className="bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs mr-2">B</span>
                      Unapproved Items (if found)
                    </h6>
                    {company.unapprovedItems.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-2 mb-2">
                        <SmartSearch
                          value={item}
                          onChange={(value) => updateCompanyUnapprovedItem(companyIndex, itemIndex, value)}
                          placeholder="Enter unapproved item details..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addCompanyUnapprovedItem(companyIndex)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        {company.unapprovedItems.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCompanyUnapprovedItem(companyIndex, itemIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-red-600 mt-2">Record any items found that are not in the approved shortlist</p>
                  </div>
                  
                  <Input type="file" accept="image/*" className="mt-3 text-sm" />
                </div>

                {/* Point 8: Overcharging Items */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">8</span>
                    Overcharging Items (if found)
                  </h5>
                  {company.overchargingItems.map((item, itemIndex) => (
                    <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                      <SmartSearch
                        value={item.name}
                        onChange={(value) => updateCompanyOverchargingItem(companyIndex, itemIndex, 'name', value)}
                        placeholder="Item name..."
                      />
                      <Input
                        type="number"
                        placeholder="MRP Price"
                        value={item.mrpPrice}
                        onChange={(e) => updateCompanyOverchargingItem(companyIndex, itemIndex, 'mrpPrice', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Selling Price"
                        value={item.sellingPrice}
                        onChange={(e) => updateCompanyOverchargingItem(companyIndex, itemIndex, 'sellingPrice', e.target.value)}
                      />
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addCompanyOverchargingItem(companyIndex)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        {company.overchargingItems.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCompanyOverchargingItem(companyIndex, itemIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Input type="file" accept="image/*" className="mt-2 text-sm" />
                </div>
              </div>
              
              {/* Add Another Company Button - only show on the last company */}
              {companyIndex === companies.length - 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={addCompany}
                    className="bg-nr-blue hover:bg-nr-navy w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Company
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>


      </CardContent>
    </Card>
  );
}
