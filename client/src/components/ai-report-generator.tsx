import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Wand2, Copy, Download, RefreshCw } from "lucide-react";

interface ReportStyle {
  id: string;
  name: string;
  description: string;
  tone: 'formal' | 'technical' | 'regulatory' | 'detailed' | 'concise';
}

interface AIReportGeneratorProps {
  observationData: any;
  onReportGenerated: (report: string) => void;
}

const reportStyles: ReportStyle[] = [
  {
    id: 'formal-regulatory',
    name: 'Formal Regulatory',
    description: 'Official regulatory compliance language with formal structure',
    tone: 'regulatory'
  },
  {
    id: 'technical-detailed',
    name: 'Technical Detailed',
    description: 'Comprehensive technical analysis with detailed observations',
    tone: 'technical'
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'Concise professional summary for management review',
    tone: 'concise'
  },
  {
    id: 'audit-comprehensive',
    name: 'Comprehensive Audit',
    description: 'Detailed audit-style report with systematic analysis',
    tone: 'detailed'
  },
  {
    id: 'compliance-focused',
    name: 'Compliance Focused',
    description: 'Standards-focused report emphasizing compliance aspects',
    tone: 'formal'
  }
];

export function AIReportGenerator({ observationData, onReportGenerated }: AIReportGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportVariations, setReportVariations] = useState<string[]>([]);

  const generateReport = async (styleId: string, variationIndex: number = 0) => {
    setIsGenerating(true);
    
    try {
      const style = reportStyles.find(s => s.id === styleId);
      const response = await fetch('/api/generate-inspection-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          observationData,
          style: style?.tone,
          variationIndex,
          previousReports: reportVariations
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');
      
      const { report, variations } = await response.json();
      setGeneratedReport(report);
      setReportVariations(variations || []);
      onReportGenerated(report);
    } catch (error) {
      console.error('Error generating report:', error);
      // Fallback to client-side generation
      const fallbackReport = generateFallbackReport(styleId);
      setGeneratedReport(fallbackReport);
      onReportGenerated(fallbackReport);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackReport = (styleId: string): string => {
    const style = reportStyles.find(s => s.id === styleId);
    const companies = observationData.companies || [];
    
    const reportTemplates = {
      'formal-regulatory': generateFormalReport,
      'technical-detailed': generateTechnicalReport,
      'executive-summary': generateExecutiveSummary,
      'audit-comprehensive': generateAuditReport,
      'compliance-focused': generateComplianceReport
    };

    const generator = reportTemplates[styleId as keyof typeof reportTemplates] || generateFormalReport;
    return generator(companies);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReport);
  };

  const downloadReport = () => {
    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspection-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wand2 className="mr-3 text-purple-600" size={24} />
          AI-Powered Inspection Report Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Style Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Report Style</label>
          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Choose professional writing style..." />
            </SelectTrigger>
            <SelectContent>
              {reportStyles.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  <div>
                    <div className="font-medium">{style.name}</div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style Preview */}
        {selectedStyle && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {reportStyles.find(s => s.id === selectedStyle)?.name}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">
              {reportStyles.find(s => s.id === selectedStyle)?.description}
            </p>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex gap-2">
          <Button
            onClick={() => generateReport(selectedStyle)}
            disabled={!selectedStyle || isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
          
          {reportVariations.length > 0 && (
            <Button
              variant="outline"
              onClick={() => generateReport(selectedStyle, Math.floor(Math.random() * 3) + 1)}
              disabled={isGenerating}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Variation
            </Button>
          )}
        </div>

        {/* Generated Report */}
        {generatedReport && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Generated Inspection Report</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={downloadReport}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <Textarea
              value={generatedReport}
              onChange={(e) => setGeneratedReport(e.target.value)}
              className="min-h-[400px] font-mono text-sm bg-white"
              placeholder="Generated report will appear here..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Report Generation Templates
function generateFormalReport(companies: any[]): string {
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  return `INSPECTION REPORT

Date of Inspection: ${currentDate}
Report Type: Formal Regulatory Assessment

EXECUTIVE SUMMARY
This comprehensive inspection was conducted to evaluate compliance standards and operational protocols across ${companies.length} unit(s). The assessment encompasses vendor documentation, hygiene standards, licensing compliance, and regulatory adherence.

${companies.map((company, index) => `
UNIT ${index + 1}: ${company.companyName || 'Unit ' + (index + 1)}
Location: ${company.unitType || 'Not specified'} - Platform ${company.platformNo || 'N/A'}

1. VENDOR IDENTIFICATION & DOCUMENTATION
Primary Vendor: ${company.vendorName || 'Not specified'}
Documentation Status:
- Proper Uniform: ${company.properUniform ? 'Compliant' : 'Non-compliant'}
- Medical Card: ${company.medicalCard ? 'Valid and Present' : 'Not available/Invalid'}
- ID Card: ${company.idCard ? 'Verified' : 'Not verified'}
- Police Verification: ${company.policeVerification ? 'Completed' : 'Pending/Not completed'}

${company.vendorDetails && company.vendorDetails.length > 0 ? `
Additional Personnel Documentation:
${company.vendorDetails.map((vendor: any, vIndex: number) => `
- Staff ${vIndex + 1}: ${vendor.name || 'Unnamed'}
  Position: ${vendor.designation || 'Not specified'}
  Uniform Compliance: ${vendor.properUniform ? 'Yes' : 'No'}
  Medical Clearance: ${vendor.medicalCard ? 'Yes' : 'No'}
  Police Verification: ${vendor.policeVerification ? 'Yes' : 'No'}
`).join('')}` : ''}

2. LICENSING AND REGULATORY COMPLIANCE
Food License Status: ${company.foodLicense === 'available' ? 'Valid and Current' : 'Not Available/Expired'}
${company.foodLicenseDetails ? `License Details: ${company.foodLicenseDetails}` : ''}

3. OPERATIONAL STANDARDS ASSESSMENT
Rate Display Compliance: ${company.rateListDisplay === 'properly_displayed' ? 'Satisfactory' : 'Requires Attention'}
"No Bill Food is Free" Policy: ${company.billFoodFree === 'properly_displayed' ? 'Properly Implemented' : 'Not Implemented'}
Electronic Billing System: ${company.billMachine === 'available_working' ? 'Operational' : company.billMachine === 'available_not_working' ? 'Non-functional' : 'Not Available'}
Digital Payment Acceptance: ${company.digitalPayment === 'accepting' ? 'Available' : 'Not Available'}

4. INVENTORY COMPLIANCE ASSESSMENT
${company.unapprovedItems && company.unapprovedItems.filter((item: string) => item.trim()).length > 0 ? `
Non-Approved Items Identified: ${company.unapprovedItems.filter((item: string) => item.trim()).length} item(s)
Items: ${company.unapprovedItems.filter((item: string) => item.trim()).join(', ')}
` : 'No unauthorized items detected.'}

${company.overchargingItems && company.overchargingItems.filter((item: any) => item.name.trim()).length > 0 ? `
Pricing Discrepancies Identified:
${company.overchargingItems.filter((item: any) => item.name.trim()).map((item: any) => `
- ${item.name}: MRP ₹${item.mrpPrice} | Selling Price ₹${item.sellingPrice} | Variance: ₹${item.sellingPrice - item.mrpPrice}`).join('')}
` : 'No pricing irregularities detected.'}

`).join('\n')}

RECOMMENDATIONS
1. Address all documentation gaps identified in vendor personnel records
2. Ensure continuous compliance with food safety and licensing requirements  
3. Implement corrective measures for any pricing discrepancies
4. Maintain regular monitoring of inventory and pricing protocols

Report prepared in accordance with regulatory standards and inspection protocols.

---
End of Report`;
}

function generateTechnicalReport(companies: any[]): string {
  // Technical detailed version with different language structure
  return `TECHNICAL INSPECTION ANALYSIS REPORT

Assessment Date: ${new Date().toLocaleDateString('en-IN')}
Inspection Protocol: Comprehensive Technical Evaluation

METHODOLOGY AND SCOPE
This technical assessment employed systematic evaluation protocols to examine operational compliance, documentation integrity, and service delivery standards across ${companies.length} operational unit(s).

${companies.map((company, index) => `
TECHNICAL ASSESSMENT - UNIT ${index + 1}
Facility Designation: ${company.companyName || 'Undesignated Unit'}
Operational Category: ${company.unitType || 'Standard Service Unit'}
Location Identifier: Platform ${company.platformNo || 'Unspecified'}

PERSONNEL VERIFICATION MATRIX
Lead Operator: ${company.vendorName || 'Unidentified'}

Compliance Parameters:
• Uniform Standard Adherence: ${company.properUniform ? 'PASS' : 'FAIL'}
• Health Certification Status: ${company.medicalCard ? 'VERIFIED' : 'UNVERIFIED'}
  ${company.medicalCardDetails ? `Details: ${company.medicalCardDetails}` : ''}
• Identity Documentation: ${company.idCard ? 'CONFIRMED' : 'PENDING'}
  ${company.idCardNumber ? `Reference: ${company.idCardNumber}` : ''}
• Security Clearance: ${company.policeVerification ? 'CLEARED' : 'INCOMPLETE'}
  ${company.policeVerificationDetails ? `Verification: ${company.policeVerificationDetails}` : ''}

${company.vendorDetails && company.vendorDetails.length > 0 ? `
AUXILIARY PERSONNEL MATRIX:
${company.vendorDetails.map((vendor: any, vIndex: number) => `
Operator ${vIndex + 1}: ${vendor.name || 'Unregistered'}
Role Classification: ${vendor.designation || 'General Service'}
Standards Compliance:
- Uniform Protocol: ${vendor.properUniform ? 'Conforming' : 'Non-conforming'}
- Health Validation: ${vendor.medicalCard ? 'Current' : 'Expired/Missing'}
- Security Status: ${vendor.policeVerification ? 'Validated' : 'Unvalidated'}
`).join('')}` : 'No auxiliary personnel registered'}

REGULATORY FRAMEWORK ANALYSIS
Authorization Status: ${company.foodLicense === 'available' ? 'Operational License Active' : 'License Deficiency Detected'}
${company.foodLicenseDetails ? `Authorization Parameters: ${company.foodLicenseDetails}` : ''}

OPERATIONAL SYSTEMS EVALUATION
Pricing Transparency System: ${company.rateListDisplay === 'properly_displayed' ? 'Implemented' : 'System Failure'}
Consumer Protection Protocol: ${company.billFoodFree === 'properly_displayed' ? 'Active' : 'Inactive'}
Transaction Processing System: ${company.billMachine === 'available_working' ? 'Functional' : company.billMachine === 'available_not_working' ? 'System Malfunction' : 'Hardware Absent'}
Digital Transaction Capability: ${company.digitalPayment === 'accepting' ? 'Enabled' : 'Disabled'}

INVENTORY CONTROL ANALYSIS
${company.unapprovedItems && company.unapprovedItems.filter((item: string) => item.trim()).length > 0 ? `
Unauthorized Inventory Detection: ${company.unapprovedItems.filter((item: string) => item.trim()).length} violation(s)
Unauthorized Items: ${company.unapprovedItems.filter((item: string) => item.trim()).join(' | ')}
` : 'Inventory Control: Within Parameters'}

${company.overchargingItems && company.overchargingItems.filter((item: any) => item.name.trim()).length > 0 ? `
Price Variance Analysis:
${company.overchargingItems.filter((item: any) => item.name.trim()).map((item: any) => `
Product: ${item.name}
Standard Price: ₹${item.mrpPrice}
Applied Price: ₹${item.sellingPrice}
Deviation: ${((item.sellingPrice - item.mrpPrice) / item.mrpPrice * 100).toFixed(1)}%`).join('')}
` : 'Price Variance Analysis: No significant deviations detected'}

`).join('\n')}

TECHNICAL CONCLUSIONS
The systematic evaluation reveals varying degrees of compliance across operational parameters. Critical attention required for documentation completeness and system functionality optimization.

TECHNICAL RECOMMENDATIONS
• Implement systematic documentation protocols for all personnel
• Establish automated compliance monitoring systems
• Deploy corrective measures for identified system failures
• Initiate regular calibration of pricing and inventory controls

Technical Assessment Complete
---`;
}

// Add more generator functions for other styles...
function generateExecutiveSummary(companies: any[]): string {
  return `EXECUTIVE INSPECTION SUMMARY

Date: ${new Date().toLocaleDateString('en-IN')}

OVERVIEW
Inspection completed across ${companies.length} operational unit(s) focusing on compliance, documentation, and service standards.

KEY FINDINGS
${companies.map((company, index) => `
Unit ${index + 1} - ${company.companyName || 'Standard Unit'}
• Vendor: ${company.vendorName || 'TBD'}
• Documentation: ${company.properUniform && company.medicalCard && company.policeVerification ? 'Complete' : 'Gaps Identified'}
• License Status: ${company.foodLicense === 'available' ? 'Current' : 'Action Required'}
• Systems: ${company.billMachine === 'available_working' ? 'Operational' : 'Needs Attention'}
• Compliance Issues: ${(company.unapprovedItems?.filter((item: string) => item.trim()).length || 0) + (company.overchargingItems?.filter((item: any) => item.name.trim()).length || 0)} item(s)
`).join('')}

PRIORITY ACTIONS
1. Address documentation gaps
2. Resolve system functionality issues  
3. Ensure pricing compliance
4. Maintain ongoing monitoring

Status: ${companies.every((company: any) => 
  company.foodLicense === 'available' && 
  company.properUniform && 
  (!company.unapprovedItems || company.unapprovedItems.filter((item: string) => item.trim()).length === 0)
) ? 'Satisfactory with Minor Issues' : 'Requires Immediate Attention'}

---
Executive Summary Complete`;
}

function generateAuditReport(companies: any[]): string {
  return `COMPREHENSIVE AUDIT REPORT

Audit Date: ${new Date().toLocaleDateString('en-IN')}
Audit Scope: Multi-point Compliance Assessment

AUDIT OBJECTIVES
To systematically evaluate operational compliance, regulatory adherence, and service delivery standards across designated service units.

DETAILED FINDINGS

${companies.map((company, index) => `
AUDIT UNIT ${index + 1}
Entity: ${company.companyName || 'Entity Unspecified'}
Classification: ${company.unitType || 'Service Unit'}
Location: Platform ${company.platformNo || 'N/A'}

AUDIT CRITERIA 1: PERSONNEL COMPLIANCE
Primary Operator: ${company.vendorName || 'Not Documented'}

Compliance Checklist:
□ ${company.properUniform ? '✓' : '✗'} Standard uniform requirements met
□ ${company.medicalCard ? '✓' : '✗'} Valid medical certification on file
  ${company.medicalCardDetails ? `Note: ${company.medicalCardDetails}` : ''}
□ ${company.idCard ? '✓' : '✗'} Identity documentation verified
  ${company.idCardNumber ? `ID: ${company.idCardNumber}` : ''}  
□ ${company.policeVerification ? '✓' : '✗'} Background verification completed
  ${company.policeVerificationDetails ? `Details: ${company.policeVerificationDetails}` : ''}

${company.vendorDetails && company.vendorDetails.length > 0 ? `
AUXILIARY STAFF AUDIT:
${company.vendorDetails.map((vendor: any, vIndex: number) => `
Staff Member ${vIndex + 1}: ${vendor.name || 'Unnamed'}
Designation: ${vendor.designation || 'Not specified'}
Audit Results:
- Uniform: ${vendor.properUniform ? 'Compliant' : 'Non-compliant'}
- Medical: ${vendor.medicalCard ? 'Valid' : 'Invalid'}
- Verification: ${vendor.policeVerification ? 'Complete' : 'Incomplete'}
`).join('')}` : 'No auxiliary staff documented'}

AUDIT CRITERIA 2: REGULATORY COMPLIANCE
License Audit: ${company.foodLicense === 'available' ? 'PASSED - Valid license confirmed' : 'FAILED - License not available'}
${company.foodLicenseDetails ? `License Information: ${company.foodLicenseDetails}` : ''}

AUDIT CRITERIA 3: OPERATIONAL STANDARDS
Rate Display Audit: ${company.rateListDisplay === 'properly_displayed' ? 'COMPLIANT' : 'NON-COMPLIANT'}
Consumer Protection Audit: ${company.billFoodFree === 'properly_displayed' ? 'IMPLEMENTED' : 'NOT IMPLEMENTED'}
Billing System Audit: ${company.billMachine === 'available_working' ? 'OPERATIONAL' : company.billMachine === 'available_not_working' ? 'DEFECTIVE' : 'ABSENT'}
Payment System Audit: ${company.digitalPayment === 'accepting' ? 'FUNCTIONAL' : 'NOT AVAILABLE'}

AUDIT CRITERIA 4: INVENTORY COMPLIANCE
${company.unapprovedItems && company.unapprovedItems.filter((item: string) => item.trim()).length > 0 ? `
Non-compliance Items Detected: ${company.unapprovedItems.filter((item: string) => item.trim()).length}
Unauthorized Inventory: ${company.unapprovedItems.filter((item: string) => item.trim()).join(', ')}
Risk Level: ${company.unapprovedItems.filter((item: string) => item.trim()).length > 3 ? 'HIGH' : 'MODERATE'}
` : 'Inventory Compliance: SATISFACTORY'}

${company.overchargingItems && company.overchargingItems.filter((item: any) => item.name.trim()).length > 0 ? `
Pricing Audit Findings:
${company.overchargingItems.filter((item: any) => item.name.trim()).map((item: any) => `
Item: ${item.name}
Prescribed Price: ₹${item.mrpPrice}
Charged Price: ₹${item.sellingPrice}
Excess Charge: ₹${item.sellingPrice - item.mrpPrice}
Violation Severity: ${(item.sellingPrice - item.mrpPrice) > 10 ? 'HIGH' : 'MODERATE'}
`).join('')}` : 'Pricing Audit: NO VIOLATIONS'}

UNIT AUDIT SCORE: ${calculateAuditScore(company)}%

`).join('\n')}

OVERALL AUDIT CONCLUSION
Systematic audit reveals compliance variations across operational units. Immediate corrective actions recommended for identified deficiencies.

AUDIT RECOMMENDATIONS
1. Establish comprehensive documentation protocols
2. Implement regular compliance monitoring systems
3. Deploy corrective action plans for deficiencies
4. Schedule follow-up audits for continuous improvement

Audit conducted in accordance with established standards and protocols.

---
Audit Report Complete`;
}

function generateComplianceReport(companies: any[]): string {
  return `COMPLIANCE ASSESSMENT REPORT

Assessment Date: ${new Date().toLocaleDateString('en-IN')}
Standards Framework: Regulatory Compliance Evaluation

COMPLIANCE SCOPE
This assessment evaluates adherence to established standards, regulatory requirements, and operational protocols across ${companies.length} service unit(s).

${companies.map((company, index) => `
COMPLIANCE UNIT ${index + 1}
Service Provider: ${company.companyName || 'Provider Not Specified'}
Unit Classification: ${company.unitType || 'Standard Service'}
Service Location: Platform ${company.platformNo || 'Location TBD'}

STANDARD 1: PERSONNEL DOCUMENTATION COMPLIANCE
Responsible Person: ${company.vendorName || 'Not Designated'}

Documentation Standards Review:
▪ Uniform Standards Compliance: ${company.properUniform ? 'MEETS STANDARDS' : 'BELOW STANDARDS'}
▪ Health Documentation Compliance: ${company.medicalCard ? 'COMPLIANT' : 'NON-COMPLIANT'}
  ${company.medicalCardDetails ? `Health Records: ${company.medicalCardDetails}` : ''}
▪ Identity Verification Compliance: ${company.idCard ? 'VERIFIED' : 'UNVERIFIED'}
  ${company.idCardNumber ? `Identity Reference: ${company.idCardNumber}` : ''}
▪ Security Clearance Compliance: ${company.policeVerification ? 'COMPLIANT' : 'NON-COMPLIANT'}
  ${company.policeVerificationDetails ? `Security Details: ${company.policeVerificationDetails}` : ''}

${company.vendorDetails && company.vendorDetails.length > 0 ? `
ADDITIONAL PERSONNEL COMPLIANCE:
${company.vendorDetails.map((vendor: any, vIndex: number) => `
Personnel ${vIndex + 1}: ${vendor.name || 'Unregistered'}
Role: ${vendor.designation || 'Standard Service'}
Compliance Status:
• Uniform Standards: ${vendor.properUniform ? 'Met' : 'Not Met'}
• Health Requirements: ${vendor.medicalCard ? 'Satisfied' : 'Unsatisfied'}  
• Security Requirements: ${vendor.policeVerification ? 'Cleared' : 'Not Cleared'}
`).join('')}` : 'No additional personnel compliance required'}

STANDARD 2: LICENSING AND AUTHORIZATION COMPLIANCE
Operating License Status: ${company.foodLicense === 'available' ? 'COMPLIANT - License Valid' : 'NON-COMPLIANT - License Required'}
${company.foodLicenseDetails ? `License Specifications: ${company.foodLicenseDetails}` : ''}

STANDARD 3: OPERATIONAL COMPLIANCE STANDARDS  
Price Transparency Standard: ${company.rateListDisplay === 'properly_displayed' ? 'COMPLIANT' : 'NON-COMPLIANT'}
Consumer Information Standard: ${company.billFoodFree === 'properly_displayed' ? 'COMPLIANT' : 'NON-COMPLIANT'}
Transaction System Standard: ${company.billMachine === 'available_working' ? 'COMPLIANT' : company.billMachine === 'available_not_working' ? 'PARTIALLY COMPLIANT' : 'NON-COMPLIANT'}
Digital Service Standard: ${company.digitalPayment === 'accepting' ? 'COMPLIANT' : 'NON-COMPLIANT'}

STANDARD 4: INVENTORY AND PRICING COMPLIANCE
${company.unapprovedItems && company.unapprovedItems.filter((item: string) => item.trim()).length > 0 ? `
Inventory Compliance Status: NON-COMPLIANT
Unauthorized Items: ${company.unapprovedItems.filter((item: string) => item.trim()).length} violation(s)
Non-compliant Items: ${company.unapprovedItems.filter((item: string) => item.trim()).join(', ')}
Compliance Risk: ${company.unapprovedItems.filter((item: string) => item.trim()).length > 2 ? 'HIGH RISK' : 'MODERATE RISK'}
` : 'Inventory Compliance Status: FULLY COMPLIANT'}

${company.overchargingItems && company.overchargingItems.filter((item: any) => item.name.trim()).length > 0 ? `
Pricing Compliance Status: NON-COMPLIANT
Price Violations Detected: ${company.overchargingItems.filter((item: any) => item.name.trim()).length}
${company.overchargingItems.filter((item: any) => item.name.trim()).map((item: any) => `
Violation: ${item.name}
Standard Rate: ₹${item.mrpPrice}
Applied Rate: ₹${item.sellingPrice}
Overcharge Amount: ₹${item.sellingPrice - item.mrpPrice}
Severity: ${(item.sellingPrice - item.mrpPrice) > 5 ? 'MAJOR' : 'MINOR'}
`).join('')}` : 'Pricing Compliance Status: FULLY COMPLIANT'}

OVERALL COMPLIANCE RATING: ${calculateComplianceRating(company)}

`).join('\n')}

COMPLIANCE SUMMARY
Assessment indicates varying levels of standards adherence across evaluated units. Priority focus required on identified non-compliance areas.

COMPLIANCE IMPROVEMENT PLAN
1. Address all identified non-compliance issues systematically
2. Implement enhanced monitoring for continuous compliance
3. Establish regular compliance review protocols
4. Deploy training programs for standards maintenance

Compliance assessment conducted per regulatory guidelines and industry standards.

---
Compliance Report Complete`;
}

// Helper functions
function calculateAuditScore(company: any): number {
  let score = 0;
  let totalCriteria = 0;

  // Personnel compliance (40 points)
  const personnelCriteria = [
    company.properUniform,
    company.medicalCard,
    company.idCard,
    company.policeVerification
  ];
  score += personnelCriteria.filter(Boolean).length * 10;
  totalCriteria += 4;

  // License compliance (20 points)
  if (company.foodLicense === 'available') score += 20;
  totalCriteria += 2;

  // Operational compliance (20 points)
  const operationalCriteria = [
    company.rateListDisplay === 'properly_displayed',
    company.billFoodFree === 'properly_displayed',
    company.billMachine === 'available_working',
    company.digitalPayment === 'accepting'
  ];
  score += operationalCriteria.filter(Boolean).length * 5;
  totalCriteria += 4;

  // Inventory compliance (20 points)
  const hasUnapprovedItems = company.unapprovedItems && company.unapprovedItems.filter((item: string) => item.trim()).length > 0;
  const hasPricingIssues = company.overchargingItems && company.overchargingItems.filter((item: any) => item.name.trim()).length > 0;
  
  if (!hasUnapprovedItems) score += 10;
  if (!hasPricingIssues) score += 10;
  totalCriteria += 2;

  return Math.round((score / (totalCriteria * 10)) * 100);
}

function calculateComplianceRating(company: any): string {
  const score = calculateAuditScore(company);
  if (score >= 90) return 'EXCELLENT COMPLIANCE';
  if (score >= 80) return 'GOOD COMPLIANCE';
  if (score >= 70) return 'ACCEPTABLE COMPLIANCE';
  if (score >= 60) return 'MARGINAL COMPLIANCE';
  return 'POOR COMPLIANCE';
}

export default AIReportGenerator;