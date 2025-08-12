import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SmartSearch } from "./smart-search";
import { EnhancedSmartSearch } from "./enhanced-smart-search";
import { ValidatedUnapprovedSearch } from "./validated-unapproved-search";
import { Upload, Plus, Trash2, Utensils, FileText } from "lucide-react";
import { PhotoManager } from "./photo-manager";

interface VendorDetail {
  name: string;
  designation: string;
  properUniform?: boolean;
  medicalCard?: boolean;
  medicalCardDetails?: string;
  idCard?: boolean;
  idCardNumber?: string;
  policeVerification?: boolean;
  policeVerificationDetails?: string;
  photos?: any[]; // Add this field for photo data
}

interface AdditionalObservation {
  title: string;
  content: string;
  photos?: any[]; // Add this field for photo data
}

interface OverchargingItem {
  name: string;
  mrpPrice: string;
  sellingPrice: string;
}

interface CompanyData {
  companyName: string;
  unitType: string;
  platformNo: string;
  vendorName: string;
  vendorDetails: VendorDetail[];
  billMachine: string;
  foodLicense: string;
  foodLicenseDetails: string;
  medicalCard: boolean;
  medicalCardDetails: string;
  idCard: boolean;
  idCardNumber: string;
  properUniform: boolean;
  digitalPayment: string;
  rateListDisplay: string;
  billFoodFree: string;
  policeVerification: boolean;
  policeVerificationDetails: string;
  unapprovedItems: string[];
  overchargingItems: OverchargingItem[];
  additionalObservations: AdditionalObservation[];
  // Add photo fields
  vendorDocsPhotos?: any[];
  foodLicensePhotos?: any[];
  rateListDisplayPhotos?: any[];
  billFoodFreeDisplayPhotos?: any[];
  billMachinePhotos?: any[];
  digitalPaymentPhotos?: any[];
  itemVerificationPhotos?: any[];
  overchargingItemsPhotos?: any[];
}

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
  const [companies, setCompanies] = useState<CompanyData[]>([
    {
      companyName: "",
      unitType: "",
      platformNo: "",
      vendorName: "",
      vendorDetails: [],
      billMachine: "",
      foodLicense: "",
      foodLicenseDetails: "",
      medicalCard: false,
      medicalCardDetails: "",
      idCard: false,
      idCardNumber: "",
      properUniform: false,
      digitalPayment: "",
      rateListDisplay: "",
      billFoodFree: "",
      policeVerification: false,
      policeVerificationDetails: "",
      unapprovedItems: [""],
      overchargingItems: [{ name: "", mrpPrice: "", sellingPrice: "" }],
      additionalObservations: [],
      // Add photo fields
      vendorDocsPhotos: [],
      foodLicensePhotos: [],
      rateListDisplayPhotos: [],
      billFoodFreeDisplayPhotos: [],
      billMachinePhotos: [],
      digitalPaymentPhotos: [],
      itemVerificationPhotos: [],
      overchargingItemsPhotos: []
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
    const newCompany: CompanyData = {
      companyName: "",
      unitType: "",
      platformNo: "",
      vendorName: "",
      vendorDetails: [],
      billMachine: "",
      foodLicense: "",
      foodLicenseDetails: "",
      medicalCard: false,
      medicalCardDetails: "",
      idCard: false,
      idCardNumber: "",
      properUniform: false,
      digitalPayment: "",
      rateListDisplay: "",
      billFoodFree: "",
      policeVerification: false,
      policeVerificationDetails: "",
      unapprovedItems: [""],
      overchargingItems: [{ name: "", mrpPrice: "", sellingPrice: "" }],
      additionalObservations: [],
      // Add photo fields
      vendorDocsPhotos: [],
      foodLicensePhotos: [],
      rateListDisplayPhotos: [],
      billFoodFreeDisplayPhotos: [],
      billMachinePhotos: [],
      digitalPaymentPhotos: [],
      itemVerificationPhotos: [],
      overchargingItemsPhotos: []
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

  // Additional observation points functions
  const addAdditionalPoint = (companyIndex: number) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex 
        ? { 
            ...company, 
            additionalObservations: [...(company.additionalObservations || []), { 
              title: "", 
              content: "", 
              photos: [] // Add this
            }]
          }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const removeAdditionalPoint = (companyIndex: number, pointIndex: number) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex 
        ? { 
            ...company, 
            additionalObservations: company.additionalObservations?.filter((_, j) => j !== pointIndex) || []
          }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const updateAdditionalPoint = (companyIndex: number, pointIndex: number, field: string, value: string | any) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex 
        ? { 
            ...company, 
            additionalObservations: company.additionalObservations?.map((point, j) => 
              j === pointIndex ? { ...point, [field]: value } : point
            ) || []
          }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  // Multiple vendor details functions
  const addVendorDetail = (companyIndex: number) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex 
        ? { 
            ...company, 
            vendorDetails: [...(company.vendorDetails || []), { 
              name: "", 
              designation: "", 
              properUniform: false, 
              medicalCard: false,
              medicalCardDetails: "",
              idCard: false,
              idCardNumber: "",
              policeVerification: false,
              policeVerificationDetails: "",
              photos: [] // Add this
            }]
          }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const removeVendorDetail = (companyIndex: number, vendorIndex: number) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex && (company.vendorDetails || []).length > 1
        ? { 
            ...company, 
            vendorDetails: (company.vendorDetails || []).filter((_, j) => j !== vendorIndex)
          }
        : company
    );
    setCompanies(updatedCompanies);
    updateObservation('companies', updatedCompanies);
  };

  const updateVendorDetail = (companyIndex: number, vendorIndex: number, field: string, value: string | boolean | any) => {
    const updatedCompanies = companies.map((company, i) => 
      i === companyIndex 
        ? { 
            ...company, 
            vendorDetails: (company.vendorDetails || []).map((vendor, j) => 
              j === vendorIndex ? { ...vendor, [field]: value } : vendor
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
            <h3 className="text-lg font-medium text-nr-navy">Observations/Deficiencies</h3>
          
          {companies.map((company, companyIndex) => (
            <div key={companyIndex} className="bg-gray-50 rounded-lg p-4 mb-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-nr-navy">
                  Unit {companyIndex + 1}
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
                    onChange={(e) => {
                      let value = e.target.value;
                      // Automatically add M/s prefix if not present
                      if (value && !value.startsWith('M/s ')) {
                        value = 'M/s ' + value;
                      }
                      updateCompany(companyIndex, 'companyName', value);
                    }}
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
                {/* Point 1: Name of the Vendor & Documentation Check (MERGED with 1A) */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">1</span>
                    Name of the Vendor & Documentation Check
                  </h5>
                  
                  {/* Main Vendor */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h6 className="text-sm font-medium text-blue-800 mb-3">Primary Vendor</h6>
                    
                    <div className="mb-4">
                      <Label className="text-sm font-medium">Vendor Name</Label>
                      <Input
                        placeholder="Enter vendor name"
                        value={company.vendorName || ""}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('Sh. ')) {
                            value = 'Sh. ' + value;
                          }
                          updateCompany(companyIndex, 'vendorName', value);
                        }}
                        className="mt-1"
                      />
                    </div>

                    {/* Primary Vendor Documentation */}
                    <div className="space-y-3">
                      <h6 className="text-sm font-medium text-gray-700">Documentation & Uniform Verification</h6>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`properUniform-${companyIndex}`}
                          checked={company.properUniform || false}
                          onCheckedChange={(checked) => updateCompany(companyIndex, 'properUniform', checked)}
                        />
                        <Label htmlFor={`properUniform-${companyIndex}`}>Proper Uniform</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`medicalCard-${companyIndex}`}
                            checked={company.medicalCard || false}
                            onCheckedChange={(checked) => updateCompany(companyIndex, 'medicalCard', checked)}
                          />
                          <Label htmlFor={`medicalCard-${companyIndex}`}>Medical Card</Label>
                        </div>
                        <Input 
                          placeholder="Medical card details (validity, type, etc.)"
                          value={company.medicalCardDetails || ""}
                          onChange={(e) => updateCompany(companyIndex, 'medicalCardDetails', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`idCard-${companyIndex}`}
                            checked={company.idCard || false}
                            onCheckedChange={(checked) => updateCompany(companyIndex, 'idCard', checked)}
                          />
                          <Label htmlFor={`idCard-${companyIndex}`}>ID Card</Label>
                        </div>
                        <Input 
                          placeholder="ID card number"
                          value={company.idCardNumber || ""}
                          onChange={(e) => updateCompany(companyIndex, 'idCardNumber', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`policeVerification-${companyIndex}`}
                            checked={company.policeVerification || false}
                            onCheckedChange={(checked) => updateCompany(companyIndex, 'policeVerification', checked)}
                          />
                          <Label htmlFor={`policeVerification-${companyIndex}`}>Police Verification</Label>
                        </div>
                        <Input 
                          placeholder="Police verification details (date, station, etc.)"
                          value={company.policeVerificationDetails || ""}
                          onChange={(e) => updateCompany(companyIndex, 'policeVerificationDetails', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    <PhotoManager
                      sectionId={`vendor-docs-${companyIndex}`}
                      sectionName="vendorDocs"
                      maxInReport={2}
                      onPhotosChange={(photos) => {
                        // Handle photos for this section
                        updateCompany(companyIndex, `vendorDocs`, photos);
                      }}
                    />
                  </div>

                  {/* Additional Vendors - Now part of Point 1 */}
                  {(company.vendorDetails || []).length > 0 && (
                    <div className="space-y-4">
                      <h6 className="text-sm font-medium text-gray-700 border-t border-gray-200 pt-3">Additional Vendors</h6>
                      {(company.vendorDetails || []).map((vendor, vendorIndex) => (
                        <div key={vendorIndex} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <h6 className="text-sm font-medium text-green-800">Vendor {vendorIndex + 2}</h6>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeVendorDetail(companyIndex, vendorIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <Label className="text-sm">Vendor Name</Label>
                              <Input
                                placeholder="Additional Vendor Name"
                                value={vendor.name || ""}
                                onChange={(e) => {
                                  let value = e.target.value;
                                  if (value && !value.startsWith('Sh. ')) {
                                    value = 'Sh. ' + value;
                                  }
                                  updateVendorDetail(companyIndex, vendorIndex, 'name', value);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Designation</Label>
                              <Input
                                placeholder="Designation (optional)"
                                value={vendor.designation || ""}
                                onChange={(e) => updateVendorDetail(companyIndex, vendorIndex, 'designation', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          {/* Additional vendor documentation with text fields */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`additionalUniform-${companyIndex}-${vendorIndex}`}
                                checked={vendor.properUniform || false}
                                onCheckedChange={(checked) => updateVendorDetail(companyIndex, vendorIndex, 'properUniform', checked as boolean)}
                              />
                              <Label htmlFor={`additionalUniform-${companyIndex}-${vendorIndex}`} className="text-sm">Proper Uniform</Label>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`additionalMedical-${companyIndex}-${vendorIndex}`}
                                  checked={vendor.medicalCard || false}
                                  onCheckedChange={(checked) => updateVendorDetail(companyIndex, vendorIndex, 'medicalCard', checked as boolean)}
                                />
                                <Label htmlFor={`additionalMedical-${companyIndex}-${vendorIndex}`} className="text-sm">Medical Card</Label>
                              </div>
                              <Input 
                                placeholder="Medical card details"
                                value={vendor.medicalCardDetails || ""}
                                onChange={(e) => updateVendorDetail(companyIndex, vendorIndex, 'medicalCardDetails', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`additionalId-${companyIndex}-${vendorIndex}`}
                                  checked={vendor.idCard || false}
                                  onCheckedChange={(checked) => updateVendorDetail(companyIndex, vendorIndex, 'idCard', checked as boolean)}
                                />
                                <Label htmlFor={`additionalId-${companyIndex}-${vendorIndex}`} className="text-sm">ID Card</Label>
                              </div>
                              <Input 
                                placeholder="ID card number"
                                value={vendor.idCardNumber || ""}
                                onChange={(e) => updateVendorDetail(companyIndex, vendorIndex, 'idCardNumber', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`additionalPolice-${companyIndex}-${vendorIndex}`}
                                  checked={vendor.policeVerification || false}
                                  onCheckedChange={(checked) => updateVendorDetail(companyIndex, vendorIndex, 'policeVerification', checked as boolean)}
                                />
                                <Label htmlFor={`additionalPolice-${companyIndex}-${vendorIndex}`} className="text-sm">Police Verification</Label>
                              </div>
                              <Input 
                                placeholder="Police verification details"
                                value={vendor.policeVerificationDetails || ""}
                                onChange={(e) => updateVendorDetail(companyIndex, vendorIndex, 'policeVerificationDetails', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          
                          <PhotoManager
                            sectionId={`additional-vendor-docs-${companyIndex}-${vendorIndex}`}
                            sectionName="additionalVendorDocs"
                            maxInReport={2}
                            onPhotosChange={(photos) => {
                              // Handle photos for this section
                              updateVendorDetail(companyIndex, vendorIndex, 'photos', photos);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Another Vendor Button - Now adds to Point 1 */}
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addVendorDetail(companyIndex)}
                      className="border-dashed border-2 border-nr-blue text-nr-blue hover:bg-nr-blue hover:text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Vendor
                    </Button>
                  </div>
                </div>

                {/* Point 2: Food License (was Point 3) */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">2</span>
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
                  {company.foodLicense === 'available' && (
                    <Input 
                      placeholder="Food license details (number, validity, issuing authority, etc.)"
                      value={company.foodLicenseDetails || ""}
                      onChange={(e) => updateCompany(companyIndex, 'foodLicenseDetails', e.target.value)}
                      className="mt-2 text-sm"
                    />
                  )}
                  <PhotoManager
                    sectionId={`food-license-${companyIndex}`}
                    sectionName="foodLicense"
                    maxInReport={2}
                    onPhotosChange={(photos) => {
                      // Handle photos for this section
                      updateCompany(companyIndex, `foodLicensePhotos`, photos);
                    }}
                  />
                </div>

                {/* Point 3A: Rate List Display (was Point 4A) */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">3A</span>
                    Rate List Display
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
                  <PhotoManager
                    sectionId={`rate-list-display-${companyIndex}`}
                    sectionName="rateListDisplay"
                    maxInReport={2}
                    onPhotosChange={(photos) => {
                      // Handle photos for this section
                      updateCompany(companyIndex, `rateListDisplayPhotos`, photos);
                    }}
                  />
                </div>

                {/* Point 3B: Bill Food Free Display (was Point 4B) */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">3B</span>
                    "No Bill Food is Free" Display
                  </h5>
                  <RadioGroup 
                    value={company.billFoodFree || ""}
                    onValueChange={(value) => updateCompany(companyIndex, 'billFoodFree', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="properly_displayed" id={`bill-food-displayed-${companyIndex}`} />
                      <Label htmlFor={`bill-food-displayed-${companyIndex}`}>Properly Displayed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="not_displayed" id={`bill-food-not-displayed-${companyIndex}`} />
                      <Label htmlFor={`bill-food-not-displayed-${companyIndex}`}>Not Displayed</Label>
                    </div>
                  </RadioGroup>
                  <PhotoManager
                    sectionId={`bill-food-free-display-${companyIndex}`}
                    sectionName="billFoodFreeDisplay"
                    maxInReport={2}
                    onPhotosChange={(photos) => {
                      // Handle photos for this section
                      updateCompany(companyIndex, `billFoodFreeDisplayPhotos`, photos);
                    }}
                  />
                </div>

                {/* Point 4: Bill Machine (was Point 5) */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">4</span>
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
                  <PhotoManager
                    sectionId={`bill-machine-${companyIndex}`}
                    sectionName="billMachine"
                    maxInReport={2}
                    onPhotosChange={(photos) => {
                      // Handle photos for this section
                      updateCompany(companyIndex, `billMachinePhotos`, photos);
                    }}
                  />
                </div>

                {/* Point 5: Digital Payment (was Point 6) */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">5</span>
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
                  <PhotoManager
                    sectionId={`digital-payment-${companyIndex}`}
                    sectionName="digitalPayment"
                    maxInReport={2}
                    onPhotosChange={(photos) => {
                      // Handle photos for this section
                      updateCompany(companyIndex, `digitalPaymentPhotos`, photos);
                    }}
                  />
                </div>

                {/* Point 6: Item Verification (was Point 7) */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-4 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">6</span>
                    Item Verification
                  </h5>
                  
                  {/* 6A: Shortlisted Items Search */}
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h6 className="font-medium text-green-800 mb-2 flex items-center">
                      <span className="bg-green-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs mr-2">A</span>
                      Shortlisted Items (Approved)
                    </h6>
                    <div className="space-y-2">
                      <EnhancedSmartSearch
                        value=""
                        onChange={(value) => {}}
                        placeholder="Type 'cans', 'SN 1', brand name, or flavour..."
                        className="w-full"
                      />
                      <p className="text-xs text-green-600">
                        <strong>Smart Search Features:</strong> Search by S.No (e.g., "SN 1"), brand name, flavour, category, or quantity. 
                        This is a reference tool - not included in report.
                      </p>
                    </div>
                  </div>

                  {/* 6B: Unapproved Items with Validation */}
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h6 className="font-medium text-red-800 mb-3 flex items-center">
                      <span className="bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs mr-2">B</span>
                      Unapproved Items (Auto-validates against 6A)
                    </h6>
                    {company.unapprovedItems.map((item, itemIndex) => (
                      <div key={itemIndex} className="mb-4">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1">
                            <ValidatedUnapprovedSearch
                              value={item}
                              onChange={(value) => updateCompanyUnapprovedItem(companyIndex, itemIndex, value)}
                              placeholder="Enter item name to validate against approved catalog..."
                              className="w-full"
                            />
                          </div>
                          <div className="flex gap-1 mt-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addCompanyUnapprovedItem(companyIndex)}
                              title="Add another unapproved item"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            {company.unapprovedItems.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeCompanyUnapprovedItem(companyIndex, itemIndex)}
                                title="Remove this item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <strong>Smart Validation:</strong> Each item entered here is automatically checked against the approved shortlisted items (6A). 
                      Only items NOT found in the approved catalog can be recorded as unapproved items.
                    </div>
                  </div>
                  
                  <PhotoManager
                    sectionId={`item-verification-${companyIndex}`}
                    sectionName="itemVerification"
                    maxInReport={2}
                    onPhotosChange={(photos) => {
                      // Handle photos for this section
                      updateCompany(companyIndex, `itemVerificationPhotos`, photos);
                    }}
                  />
                </div>

                {/* Point 7: Overcharging Items (was Point 8) */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-nr-navy mb-2 flex items-center">
                    <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">7</span>
                    Overcharging Items (if found)
                  </h5>
                  {company.overchargingItems.map((item, itemIndex) => (
                    <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                      <Input
                        type="text"
                        placeholder="Item name..."
                        value={item.name}
                        onChange={(e) => updateCompanyOverchargingItem(companyIndex, itemIndex, 'name', e.target.value)}
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
                  <PhotoManager
                    sectionId={`overcharging-items-${companyIndex}`}
                    sectionName="overchargingItems"
                    maxInReport={2}
                    onPhotosChange={(photos) => {
                      // Handle photos for this section
                      updateCompany(companyIndex, `overchargingItemsPhotos`, photos);
                    }}
                  />
                </div>

                {/* Additional Observation Points - Now starting from Point 8 */}
                {company.additionalObservations && company.additionalObservations.length > 0 && (
                  <div className="space-y-4">
                    {company.additionalObservations.map((point, pointIndex) => (
                      <div key={pointIndex} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-nr-navy flex items-center">
                            <span className="bg-nr-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">
                              {7 + pointIndex + 1}
                            </span>
                            Additional Observation Point {pointIndex + 1}
                          </h5>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAdditionalPoint(companyIndex, pointIndex)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Observation title or category"
                            value={point.title || ""}
                            onChange={(e) => updateAdditionalPoint(companyIndex, pointIndex, 'title', e.target.value)}
                            className="font-medium"
                          />
                          <Textarea
                            placeholder="Detailed observation or deficiency..."
                            value={point.content || ""}
                            onChange={(e) => updateAdditionalPoint(companyIndex, pointIndex, 'content', e.target.value)}
                            rows={3}
                          />
                          <PhotoManager
                            sectionId={`additional-observation-${companyIndex}-${pointIndex}`}
                            sectionName="additionalObservations"
                            maxInReport={2}
                            onPhotosChange={(photos) => {
                              // Handle photos for this section
                              updateAdditionalPoint(companyIndex, pointIndex, 'photos', photos);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Additional Observation Point Button */}
                <div className="mt-4 pt-2 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addAdditionalPoint(companyIndex)}
                    className="w-full border-dashed border-2 border-gray-300 hover:border-nr-blue hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Add Additional Observation Point
                  </Button>
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
      </div>

      </CardContent>
    </Card>
  );
}
