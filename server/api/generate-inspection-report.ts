import { Request, Response } from 'express';

interface ReportGenerationRequest {
  observationData: any;
  style: 'formal' | 'technical' | 'regulatory' | 'detailed' | 'concise';
  variationIndex: number;
  previousReports: string[];
}

const vocabularyVariations = {
  formal: [
    ['assessed', 'evaluated', 'examined', 'reviewed', 'analyzed'],
    ['compliance', 'adherence', 'conformity', 'alignment', 'accordance'],
    ['standards', 'protocols', 'requirements', 'specifications', 'guidelines'],
    ['identified', 'detected', 'observed', 'noted', 'discovered'],
    ['implemented', 'established', 'deployed', 'instituted', 'executed'],
    ['deficiencies', 'gaps', 'shortcomings', 'inadequacies', 'lapses'],
    ['recommendations', 'suggestions', 'proposals', 'advisements', 'guidance']
  ],
  technical: [
    ['systems', 'mechanisms', 'processes', 'procedures', 'protocols'],
    ['functionality', 'operability', 'performance', 'capability', 'effectiveness'],
    ['parameters', 'specifications', 'criteria', 'benchmarks', 'metrics'],
    ['optimization', 'enhancement', 'improvement', 'refinement', 'advancement'],
    ['analysis', 'assessment', 'evaluation', 'examination', 'investigation'],
    ['implementation', 'deployment', 'execution', 'integration', 'application']
  ]
};

const sentenceStructures = {
  formal: [
    'The assessment reveals that {subject} demonstrates {status} regarding {aspect}.',
    'Upon examination, {subject} exhibits {status} in relation to {aspect}.',
    'The evaluation indicates that {subject} maintains {status} concerning {aspect}.',
    'Analysis shows that {subject} presents {status} with respect to {aspect}.'
  ],
  technical: [
    'Technical evaluation indicates {subject} operating at {status} for {aspect}.',
    'System analysis reveals {subject} functioning with {status} in {aspect}.',
    'Performance assessment shows {subject} maintaining {status} across {aspect}.',
    'Operational review confirms {subject} delivering {status} in {aspect}.'
  ]
};

export async function generateInspectionReport(req: Request, res: Response) {
  try {
    const { observationData, style, variationIndex, previousReports }: ReportGenerationRequest = req.body;

    const variations = generateReportVariations(observationData, style, 3);
    const selectedVariation = selectUniqueVariation(variations, previousReports, variationIndex);

    res.json({
      report: selectedVariation,
      variations: variations,
      style: style,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}

function generateReportVariations(data: any, style: string, count: number): string[] {
  const variations = [];
  for (let i = 0; i < count; i++) {
    const variation = generateStyledReport(data, style, i);
    variations.push(variation);
  }
  return variations;
}

function generateStyledReport(data: any, style: string, variationIndex: number): string {
  const companies = data.companies || [];
  const vocabularySet = vocabularyVariations[style as keyof typeof vocabularyVariations] || vocabularyVariations.formal;
  const currentDate = new Date().toLocaleDateString('en-IN');

  return `${getReportHeader(style, variationIndex)}

${getDateSection(currentDate, variationIndex)}

${getExecutiveSummary(companies, vocabularySet, variationIndex)}

${companies.map((company: any, index: number) =>
  generateUnitSection(company, index, vocabularySet, variationIndex)
).join('\n\n')}

${getRecommendationsSection(companies, vocabularySet, variationIndex)}

${getReportFooter(style, variationIndex)}`;
}

function getReportHeader(style: string, variation: number): string {
  const headers = {
    formal: [
      'COMPREHENSIVE INSPECTION REPORT',
      'DETAILED ASSESSMENT REPORT',
      'FORMAL EVALUATION DOCUMENT',
      'REGULATORY COMPLIANCE REPORT'
    ],
    technical: [
      'TECHNICAL INSPECTION ANALYSIS',
      'SYSTEMS EVALUATION REPORT',
      'OPERATIONAL ASSESSMENT DOCUMENT',
      'TECHNICAL COMPLIANCE REVIEW'
    ]
  };
  const headerArray = headers[style as keyof typeof headers] || headers.formal;
  return headerArray[variation % headerArray.length];
}

function getDateSection(date: string, variation: number): string {
  const datePrefixes = [
    `Date of Inspection: ${date}`,
    `Assessment Date: ${date}`,
    `Evaluation Date: ${date}`,
    `Review Date: ${date}`
  ];
  return datePrefixes[variation % datePrefixes.length];
}

function getExecutiveSummary(companies: any[], vocabulary: string[][], variation: number): string {
  const assessmentWord = vocabulary[0] ? vocabulary[0][variation % vocabulary[0].length] : 'assessed';
  const complianceWord = vocabulary[1] ? vocabulary[1][variation % vocabulary[1].length] : 'compliance';
  const standardsWord = vocabulary[2] ? vocabulary[2][variation % vocabulary[2].length] : 'standards';

  return `EXECUTIVE SUMMARY
This comprehensive inspection ${assessmentWord} ${complianceWord} with established ${standardsWord} across ${companies.length} operational unit${companies.length > 1 ? 's' : ''}. The evaluation encompasses vendor documentation, operational protocols, and regulatory adherence.`;
}

function generateUnitSection(company: any, index: number, vocabulary: string[][], variation: number): string {
  const identifiedWord = vocabulary[3] ? vocabulary[3][variation % vocabulary[3].length] : 'identified';
  const implementedWord = vocabulary[4] ? vocabulary[4][variation % vocabulary[4].length] : 'implemented';
  const deficiencyWord = vocabulary[5] ? vocabulary[5][variation % vocabulary[5].length] : 'deficiencies';

  let imagesSection = 'Images of the Inspection:\n';
  if (company.photos && company.photos.length > 0) {
    const includedPhotos = company.photos.filter((photo: any) => photo.includeInReport);
    if (includedPhotos.length > 0) {
      imagesSection += includedPhotos
        .map((photo: any, idx: number) => `- [Photo ${idx + 1}](${photo.url})`)
        .join('\n');
    } else {
      imagesSection += 'As per annexure';
    }
  } else {
    imagesSection += 'As per annexure';
  }

  return `UNIT ${index + 1}: ${company.companyName || `Unit ${index + 1}`}
Location: ${company.unitType || 'Not specified'} - Platform ${company.platformNo || 'N/A'}

Vendor Information: ${company.vendorName || 'Not specified'}
Documentation Status ${identifiedWord}:
- Uniform Requirements: ${company.properUniform ? 'Satisfied' : 'Requires Attention'}
- Health Documentation: ${company.medicalCard ? 'Current' : 'Needs Update'}
- Identity Verification: ${company.idCard ? 'Completed' : 'Pending'}
- Security Clearance: ${company.policeVerification ? 'Verified' : 'Outstanding'}

Operational Standards ${implementedWord}:
- Licensing: ${company.foodLicense === 'available' ? 'Current' : 'Action Required'}
- Rate Display: ${company.rateListDisplay === 'properly_displayed' ? 'Compliant' : 'Non-compliant'}
- Billing Systems: ${company.billMachine === 'available_working' ? 'Functional' : 'Needs Repair'}
- Digital Payments: ${company.digitalPayment === 'accepting' ? 'Available' : 'Not Available'}

${imagesSection}

${company.unapprovedItems && company.unapprovedItems.filter((item: string) => item.trim()).length > 0
  ? `Inventory ${deficiencyWord} noted: ${company.unapprovedItems.filter((item: string) => item.trim()).length} unauthorized items`
  : 'Inventory compliance maintained'
}`;
}

function getRecommendationsSection(companies: any[], vocabulary: string[][], variation: number): string {
  const recommendWord = vocabulary[6] ? vocabulary[6][variation % vocabulary[6].length] : 'recommendations';

  return `${recommendWord.toUpperCase()}
1. Address documentation gaps systematically
2. Enhance operational protocol compliance
3. Implement corrective measures for identified issues
4. Establish regular monitoring procedures`;
}

function getReportFooter(style: string, variation: number): string {
  const footers = [
    'Report prepared in accordance with inspection protocols.',
    'Assessment completed per regulatory guidelines.',
    'Evaluation conducted following standard procedures.',
    'Review executed in compliance with established methodology.'
  ];
  return `---\n${footers[variation % footers.length]}`;
}

function selectUniqueVariation(variations: string[], previousReports: string[], preferredIndex: number): string {
  const availableVariations = variations.filter(variation =>
    !previousReports.some(previous => calculateSimilarity(variation, previous) > 0.8)
  );
  if (availableVariations.length === 0) {
    return variations[preferredIndex % variations.length];
  }
  return availableVariations[preferredIndex % availableVariations.length];
}

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word)).length;
  const totalWords = Math.max(words1.length, words2.length);
  return commonWords / totalWords;
}