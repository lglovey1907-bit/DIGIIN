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

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Utensils className="mr-3 text-nr-blue" size={24} />
          Catering Inspection Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Vendor Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-nr-navy mb-4">Vendor Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Name of Company</Label>
              <Input
                placeholder="M/s Company Name"
                value={observations.companyName || ""}
                onChange={(e) => updateObservation('companyName', e.target.value)}
              />
            </div>
            <div>
              <Label>Type of Unit & Number</Label>
              <Input
                placeholder="e.g., SMU Stall No.1"
                value={observations.unitType || ""}
                onChange={(e) => updateObservation('unitType', e.target.value)}
              />
            </div>
            <div>
              <Label>Platform Number</Label>
              <Input
                placeholder="Platform No."
                value={observations.platformNo || ""}
                onChange={(e) => updateObservation('platformNo', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Observation Points */}
        <div className="space-y-6">
          {/* Point 1: Vendor Name */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-nr-navy mb-3 flex items-center">
              <span className="bg-nr-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">1</span>
              Name of the Vendor
            </h4>
            <Input
              placeholder="Enter vendor name"
              value={observations.vendorName || ""}
              onChange={(e) => updateObservation('vendorName', e.target.value)}
            />
            <div className="mt-3">
              <Label>Upload Photo</Label>
              <Input type="file" accept="image/*" className="mt-1" />
            </div>
          </div>

          {/* Point 2: Uniform & Documentation */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-nr-navy mb-3 flex items-center">
              <span className="bg-nr-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">2</span>
              Uniform & Documentation Check
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="properUniform"
                  checked={observations.properUniform || false}
                  onCheckedChange={(checked) => updateObservation('properUniform', checked)}
                />
                <Label htmlFor="properUniform">Wearing Proper Uniform</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="idCard"
                  checked={observations.idCard || false}
                  onCheckedChange={(checked) => updateObservation('idCard', checked)}
                />
                <Label htmlFor="idCard">Holding ID Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="medicalCard"
                  checked={observations.medicalCard || false}
                  onCheckedChange={(checked) => updateObservation('medicalCard', checked)}
                />
                <Label htmlFor="medicalCard">Medical Card Available</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="policeVerification"
                  checked={observations.policeVerification || false}
                  onCheckedChange={(checked) => updateObservation('policeVerification', checked)}
                />
                <Label htmlFor="policeVerification">Police Verification</Label>
              </div>
            </div>
            <div className="mt-3">
              <Label>Details (if available)</Label>
              <Textarea
                placeholder="Enter details of documentation"
                value={observations.documentationDetails || ""}
                onChange={(e) => updateObservation('documentationDetails', e.target.value)}
                rows={2}
              />
            </div>
            <div className="mt-3">
              <Input type="file" accept="image/*" />
            </div>
          </div>

          {/* Point 3: Food License */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-nr-navy mb-3 flex items-center">
              <span className="bg-nr-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">3</span>
              Food License
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RadioGroup 
                value={observations.foodLicense || ""}
                onValueChange={(value) => updateObservation('foodLicense', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="available" id="license-available" />
                  <Label htmlFor="license-available">Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_available" id="license-not-available" />
                  <Label htmlFor="license-not-available">Not Available</Label>
                </div>
              </RadioGroup>
              <div>
                <Label>License Details</Label>
                <Textarea
                  placeholder="Enter license details and validity"
                  value={observations.licenseDetails || ""}
                  onChange={(e) => updateObservation('licenseDetails', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-3">
              <Input type="file" accept="image/*" />
            </div>
          </div>

          {/* Point 4: Rate List Display */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-nr-navy mb-3 flex items-center">
              <span className="bg-nr-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">4</span>
              Rate List & "No Bill Food is Free" Display
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RadioGroup 
                value={observations.rateListDisplay || ""}
                onValueChange={(value) => updateObservation('rateListDisplay', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="properly_displayed" id="rate-displayed" />
                  <Label htmlFor="rate-displayed">Properly Displayed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_displayed" id="rate-not-displayed" />
                  <Label htmlFor="rate-not-displayed">Not Displayed</Label>
                </div>
              </RadioGroup>
              <div>
                <Input type="file" accept="image/*" />
              </div>
            </div>
          </div>

          {/* Point 5: Bill Machine */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-nr-navy mb-3 flex items-center">
              <span className="bg-nr-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">5</span>
              Electronic Billing Machine
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RadioGroup 
                value={observations.billMachine || ""}
                onValueChange={(value) => updateObservation('billMachine', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="available_working" id="bill-working" />
                  <Label htmlFor="bill-working">Available & Working</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="available_not_working" id="bill-not-working" />
                  <Label htmlFor="bill-not-working">Available but Not Working</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_available" id="bill-not-available" />
                  <Label htmlFor="bill-not-available">Not Available</Label>
                </div>
              </RadioGroup>
              <div>
                <Label>Bills at Inspection Time</Label>
                <Input
                  type="number"
                  placeholder="Number of bills"
                  value={observations.billsAtInspection || ""}
                  onChange={(e) => updateObservation('billsAtInspection', e.target.value)}
                />
              </div>
              <div>
                <Label>Bills in Last 2 Days</Label>
                <Input
                  type="number"
                  placeholder="Number of bills"
                  value={observations.billsLast2Days || ""}
                  onChange={(e) => updateObservation('billsLast2Days', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3">
              <Input type="file" accept="image/*" />
            </div>
          </div>

          {/* Point 6: Digital Payment */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-nr-navy mb-3 flex items-center">
              <span className="bg-nr-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">6</span>
              Digital Payment Acceptance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RadioGroup 
                value={observations.digitalPayment || ""}
                onValueChange={(value) => updateObservation('digitalPayment', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="accepting" id="digital-accepting" />
                  <Label htmlFor="digital-accepting">Accepting Digital Payment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_accepting" id="digital-not-accepting" />
                  <Label htmlFor="digital-not-accepting">Not Accepting Digital Payment</Label>
                </div>
              </RadioGroup>
              <div>
                <Input type="file" accept="image/*" />
              </div>
            </div>
          </div>

          {/* Point 7: Overcharging Detection */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-nr-navy mb-3 flex items-center">
              <span className="bg-nr-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">7</span>
              Overcharging Detection
            </h4>
            <div className="space-y-4">
              {overchargingItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Item Name</Label>
                    <Input
                      placeholder="Enter item name"
                      value={item.name}
                      onChange={(e) => updateOverchargingItem(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>MRP Price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.mrpPrice}
                      onChange={(e) => updateOverchargingItem(index, 'mrpPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Selling Price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.sellingPrice}
                      onChange={(e) => updateOverchargingItem(index, 'sellingPrice', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => removeOverchargingItem(index)}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              onClick={addOverchargingItem}
              className="mt-3 bg-nr-blue hover:bg-blue-800"
            >
              <Plus className="mr-2" size={16} />
              Add More Items
            </Button>
            <div className="mt-3">
              <Input type="file" accept="image/*" />
            </div>
          </div>

          {/* Point 8: Unapproved Items */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-nr-navy mb-3 flex items-center">
              <span className="bg-nr-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">8</span>
              Unapproved Items Detection
            </h4>
            
            {/* Smart Search Component */}
            <SmartSearch />

            <div className="space-y-3 mt-4">
              {unapprovedItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Input
                    placeholder="Enter unapproved item name"
                    value={item}
                    onChange={(e) => updateUnapprovedItem(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => removeUnapprovedItem(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              onClick={addUnapprovedItem}
              className="mt-3 bg-nr-blue hover:bg-blue-800"
            >
              <Plus className="mr-2" size={16} />
              Add More Items
            </Button>
            <div className="mt-3">
              <Input type="file" accept="image/*" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
