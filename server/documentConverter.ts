import OpenAI from "openai";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel, ImageRun } from "docx";
import fs from "fs";
import path from "path";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface InspectionData {
  id: string;
  subject: string;
  stationCode: string;
  area: string;
  inspectionDate: string;
  observations: any;
  letterReference?: string;
  referenceNo?: string;
  inspectors?: Array<{name: string; designation: string}>;
  attachedFiles?: Array<{id: string; fileName: string; fileType: string; filePath: string}>;
}

interface ConvertedDocument {
  header: string;
  subject: string;
  letterReference: string;
  openingParagraph: string;
  observations: ObservationEntry[];
  closingNotes?: string;
  signatures: string[];
}

interface ObservationEntry {
  serialNumber: string;
  companyHeading: string;
  observations: string[];
  actionTakenBy: string;
  photographs?: string;
  imageFiles?: Array<{id: string; fileName: string; filePath: string; fileType: string}>;
}

// Generate professional subject with station code integration
function generateProfessionalSubject(originalSubject: string, stationCode: string): string {
  const subjectVariants = [
    `Sub: Comprehensive Commercial Inspection Report for ${stationCode} Railway Station - ${originalSubject}`,
    `Sub: Detailed Assessment and Evaluation Report of Commercial Operations at ${stationCode} Railway Station - ${originalSubject}`,
    `Sub: Systematic Commercial Compliance Audit conducted at ${stationCode} Railway Station - ${originalSubject}`,
    `Sub: Professional Commercial Operations Review and Assessment at ${stationCode} Railway Station - ${originalSubject}`,
    `Sub: Thorough Commercial Inspection and Regulatory Compliance Report - ${stationCode} Railway Station - ${originalSubject}`
  ];
  
  return subjectVariants[Math.floor(Math.random() * subjectVariants.length)];
}

export async function convertInspectionToDocument(inspectionData: InspectionData): Promise<ConvertedDocument> {
  try {
    console.log("Converting inspection data:", JSON.stringify(inspectionData, null, 2));
    
    // Extract date and station information
    const inspectionDate = new Date(inspectionData.inspectionDate);
    const formattedDate = inspectionDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });

    // Auto-generate professional subject with station code integration
    const generatedSubject = generateProfessionalSubject(inspectionData.subject, inspectionData.stationCode);

    // Advanced Varied Language System - generates unique, sophisticated Railway inspection terminology
    const generateAdvancedOpeningParagraph = () => {
      const directiveTerms = [
        'aforementioned directive', 'above-referenced instruction', 'prescribed mandate', 
        'referenced guidelines', 'stipulated directives', 'specified instructions',
        'authorized mandate', 'designated directive'
      ];
      
      const actionVerbs = [
        'undertook', 'conducted', 'executed', 'performed', 'carried out', 
        'implemented', 'administered', 'orchestrated'
      ];
      
      const inspectionTerms = [
        'comprehensive', 'thorough', 'detailed', 'extensive', 'systematic',
        'meticulous', 'rigorous', 'in-depth', 'exhaustive'
      ];
      
      const processTerms = [
        'examination and verification process', 'assessment and evaluation procedures',
        'inspection and verification process', 'evaluation and assessment procedures',
        'systematic review and analysis', 'comprehensive audit and evaluation',
        'detailed scrutiny and assessment'
      ];
      
      const observationTerms = [
        'observations pertaining to Commercial Operations were documented',
        'Commercial Operations observations were recorded',
        'Commercial Operations findings were established',
        'Commercial Operations observations were identified',
        'findings related to Commercial Operations were noted',
        'Commercial Operations assessments were compiled'
      ];
      
      const directive = directiveTerms[Math.floor(Math.random() * directiveTerms.length)];
      const action = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
      const inspection = inspectionTerms[Math.floor(Math.random() * inspectionTerms.length)];
      const process = processTerms[Math.floor(Math.random() * processTerms.length)];
      const observation = observationTerms[Math.floor(Math.random() * observationTerms.length)];
      
      return `In compliance with the ${directive}, the undersigned ${action} a ${inspection} ${inspectionData.subject.toLowerCase()} at ${inspectionData.stationCode} Railway Station on ${formattedDate}. During the ${process}, the following ${observation}:-`;
    };
    
    const openingParagraph = generateAdvancedOpeningParagraph();

    // Convert observations to structured format
    const convertedObservations = await convertObservationsToDocument(inspectionData.observations, inspectionData);
    console.log("Converted observations:", convertedObservations.length, "entries");

    const result = {
      header: "Northern Railway",
      subject: generatedSubject,
      letterReference: inspectionData.referenceNo ? `Ref: ${inspectionData.referenceNo}` : "Ref: NIL",
      openingParagraph,
      observations: convertedObservations,
      signatures: generateSignatures(inspectionData)
    };

    console.log("Final converted document structure:", Object.keys(result));
    return result;

  } catch (error) {
    console.error("Error converting inspection to document:", error);
    throw new Error("Failed to convert inspection to document format");
  }
}

async function convertObservationsToDocument(observations: any, inspectionData: InspectionData): Promise<ObservationEntry[]> {
  console.log("Processing observations:", typeof observations, observations);
  
  if (!observations || typeof observations !== 'object') {
    console.log("No valid observations found, creating fallback entry");
    return [{
      serialNumber: "1",
      companyHeading: "General Inspection",
      observations: ["Inspection conducted as per standard procedures."],
      actionTakenBy: "SS/DEC\nCMI/DEE\nCMI/Ctg\nCOS/Ctg.",
      photographs: "As per annexure"
    }];
  }

  const convertedEntries: ObservationEntry[] = [];
  let serialNumber = 1;

  // Handle different observation structures
  for (const [key, value] of Object.entries(observations)) {
    console.log(`Processing observation key: ${key}, type: ${typeof value}, isArray: ${Array.isArray(value)}`);
    
    if (key.includes('catering') && typeof value === 'object' && value !== null) {
      // Handle new catering structure with companies array
      if ('companies' in value && Array.isArray(value.companies)) {
        for (const company of value.companies as any[]) {
          if (company) {
            console.log(`Converting catering company: ${company.companyName || 'Unknown Company'}`);
            const entry = await convertNewCateringCompanyObservation(company, serialNumber, inspectionData, (value as any).actionTaken || 'COS Ctg');
            convertedEntries.push(entry);
            serialNumber++;
          }
        }
      } else if (Array.isArray(value)) {
        // Handle old catering structure
        for (const company of value as any[]) {
          if (company && company.companyName) {
            console.log(`Converting catering company: ${company.companyName}`);
            const entry = await convertCompanyObservation(company, serialNumber);
            convertedEntries.push(entry);
            serialNumber++;
          }
        }
      }
    } else if (Array.isArray(value) && value.length > 0) {
      // Process other area observations
      for (const item of value as any[]) {
        console.log(`Converting general observation for area: ${key}`);
        const entry = await convertGeneralObservation(item, serialNumber, key, inspectionData!);
        convertedEntries.push(entry);
        serialNumber++;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Handle single object observations
      console.log(`Converting single object observation for area: ${key}`);
      const entry = await convertGeneralObservation(value, serialNumber, key, inspectionData!);
      convertedEntries.push(entry);
      serialNumber++;
    }
  }

  // If no entries were created, add a fallback
  if (convertedEntries.length === 0) {
    console.log("No observations processed, adding fallback");
    convertedEntries.push({
      serialNumber: "1",
      companyHeading: "Comprehensive Commercial Inspection",
      observations: [
        "Thorough inspection was conducted in accordance with prescribed commercial protocols and regulatory frameworks.",
        "All operational parameters were systematically evaluated against established benchmarks.",
        "No material deficiencies were observed during the comprehensive examination process."
      ],
      actionTakenBy: "Station Superintendent/DEC\nChief Commercial Inspector/DEE\nCommercial Inspector/Catering\nChief Operating Superintendent/Catering",
      photographs: "Photographic documentation attached as per annexure"
    });
  }

  return convertedEntries;
}

async function convertCompanyObservation(company: any, serialNumber: number): Promise<ObservationEntry> {
  const companyName = company.companyName?.startsWith('M/s ') ? 
    company.companyName : `M/s ${company.companyName}`;
  
  const unitInfo = company.unitType && company.unitNumber ? 
    ` ${company.unitType} No. ${company.unitNumber}` : '';
  const platformInfo = company.platformNumber ? ` at PF No. ${company.platformNumber}` : '';
  
  const companyHeading = `${companyName}${unitInfo}${platformInfo}`;

  // Convert checkbox responses and details to English narrative (without AI)
  const convertedText = generateDetailedObservation(company);

  return {
    serialNumber: serialNumber.toString(),
    companyHeading,
    observations: convertedText.split('\n').filter(line => line.trim()),
    actionTakenBy: "Station Superintendent/DEC\nChief Commercial Inspector/DEE\nCommercial Inspector/Catering\nChief Operating Superintendent/Catering",
    photographs: "Photographic evidence attached as per annexure"
  };
}

async function convertGeneralObservation(item: any, serialNumber: number, area: string, inspectionData: InspectionData): Promise<ObservationEntry> {
  // Convert general observations without AI
  const convertedText = generateGeneralObservationText(item, area);

  return {
    serialNumber: serialNumber.toString(),
    companyHeading: `${area.charAt(0).toUpperCase() + area.slice(1)} Inspection - Unit ${serialNumber}`,
    observations: convertedText.split('\n').filter(line => line.trim()),
    actionTakenBy: "Station Superintendent/DEC\nChief Commercial Inspector/DEE\nCommercial Inspector/Catering\nChief Operating Superintendent/Catering",
    photographs: generatePhotographsText(inspectionData.attachedFiles),
    imageFiles: getImageFiles(inspectionData.attachedFiles)
  };
}

function generateDetailedObservation(company: any): string {
  const observations = [];
  
  // Vendor details with varied professional expressions
  if (company.vendorDetails) {
    const vendorName = company.vendorDetails.vendorName || 'the vendor';
    
    const uniformVariants = company.vendorDetails.uniform ? [
      'was observed to be properly attired in prescribed uniform',
      'was found appropriately dressed in regulation attire',
      'exhibited compliance with mandatory dress code requirements',
      'was noted to be wearing the stipulated uniform correctly'
    ] : [
      'was found operating without the mandatory prescribed uniform',
      'was observed functioning in violation of dress code protocols',
      'exhibited non-compliance with required attire standards',
      'was detected working without regulation uniform'
    ];
    
    const idCardVariants = company.documentation?.idCard ? [
      'bearing valid identification credentials',
      'displaying proper identification documentation',
      'presenting requisite identity verification',
      'carrying appropriate identification materials'
    ] : [
      'failing to display requisite identification credentials',
      'lacking proper identification documentation',
      'without displaying mandatory identity verification',
      'absent of required identification materials'
    ];
    
    const medicalVariants = company.documentation?.medicalCertificate ? [
      'with valid medical fitness certificate on record',
      'possessing current health clearance documentation',
      'holding appropriate medical certification',
      'maintaining valid fitness verification records'
    ] : [
      'without producing the mandatory medical fitness certificate',
      'lacking requisite health clearance documentation',
      'failing to present medical certification',
      'absent of mandatory fitness verification'
    ];
    
    const openingVariants = [
      'During the course of inspection,',
      'Upon systematic examination,',
      'During comprehensive verification,',
      'At the time of detailed assessment,'
    ];
    
    const closingVariants = [
      'This aspect requires immediate attention to ensure compliance with railway commercial regulations.',
      'This matter demands urgent consideration for adherence to prescribed protocols.',
      'This element necessitates prompt intervention to maintain regulatory compliance.',
      'This factor warrants immediate action to uphold commercial standards.'
    ];
    
    const uniformStatus = uniformVariants[Math.floor(Math.random() * uniformVariants.length)];
    const idCardStatus = idCardVariants[Math.floor(Math.random() * idCardVariants.length)];
    const medicalStatus = medicalVariants[Math.floor(Math.random() * medicalVariants.length)];
    const opening = openingVariants[Math.floor(Math.random() * openingVariants.length)];
    const closing = closingVariants[Math.floor(Math.random() * closingVariants.length)];
    
    observations.push(`${opening} ${vendorName} ${uniformStatus}, ${idCardStatus} ${medicalStatus}. ${closing}`);
  }
  
  // Overcharging with varied authoritative expressions
  if (company.overcharging?.detected === false) {
    const noOverchargingVariants = [
      'Thorough examination of pricing practices revealed no instances of overcharging, with all items being sold at Maximum Retail Price (MRP) as mandated by railway regulations.',
      'Comprehensive assessment of pricing compliance confirmed adherence to prescribed MRP standards with no evidence of excessive charging.',
      'Systematic verification of pricing protocols demonstrated full compliance with MRP regulations without any overcharging violations.',
      'Detailed scrutiny of pricing practices established complete conformity with mandated retail price structures.'
    ];
    observations.push(noOverchargingVariants[Math.floor(Math.random() * noOverchargingVariants.length)]);
  } else if (company.overcharging?.detected === true) {
    const details = company.overcharging.details || 'specific items and excess amounts to be documented';
    const overchargingVariants = [
      `A serious breach of pricing regulations was detected wherein passengers were being charged in excess of MRP. ${details}. This constitutes a flagrant violation of commercial terms and conditions and warrants immediate corrective action.`,
      `Critical non-compliance with pricing protocols was identified where customers were subjected to charges exceeding prescribed MRP. ${details}. This represents a grave contravention of licensing conditions requiring urgent remediation.`,
      `Significant pricing irregularities were discovered involving charges beyond established MRP limits. ${details}. This constitutes a material breach of commercial agreements necessitating immediate intervention.`,
      `Substantial deviation from pricing regulations was observed with customers being overcharged beyond MRP thresholds. ${details}. This violation of commercial protocols demands swift corrective measures.`
    ];
    observations.push(overchargingVariants[Math.floor(Math.random() * overchargingVariants.length)]);
  }
  
  // Billing machine with varied technical expressions
  if (company.billing) {
    if (company.billing.electronicBillMachine === false) {
      const nonFunctionalVariants = [
        'The Electronic Point of Sale (EPOS) system was found to be non-operational, thereby compromising the mandatory digital transaction recording mechanism. This deficiency impedes proper revenue accountability and requires urgent rectification.',
        'The Electronic Point of Sale infrastructure was discovered to be inoperative, creating significant gaps in digital transaction documentation. This irregularity undermines financial transparency and demands immediate technical intervention.',
        'The Electronic Point of Sale apparatus was identified as malfunctioning, disrupting essential digital billing protocols. This shortcoming affects revenue tracking integrity and necessitates prompt restoration.',
        'The Electronic Point of Sale mechanism was observed to be dysfunctional, hampering required electronic transaction processing. This inadequacy compromises audit trail requirements and warrants expeditious repair.'
      ];
      observations.push(nonFunctionalVariants[Math.floor(Math.random() * nonFunctionalVariants.length)]);
    } else if (company.billing.electronicBillMachine === true) {
      const functionalVariants = [
        'The Electronic Point of Sale (EPOS) system was verified to be functioning optimally, ensuring compliance with digital billing requirements and facilitating transparent transaction processing.',
        'The Electronic Point of Sale infrastructure was confirmed to be operating efficiently, maintaining adherence to electronic billing standards and enabling seamless transaction management.',
        'The Electronic Point of Sale apparatus was validated as performing satisfactorily, guaranteeing conformity with digital payment protocols and supporting transparent financial operations.',
        'The Electronic Point of Sale mechanism was assessed to be executing properly, securing compliance with electronic transaction requirements and promoting accountable revenue processing.'
      ];
      observations.push(functionalVariants[Math.floor(Math.random() * functionalVariants.length)]);
    }
    
    if (company.billing.manualBill === false) {
      const manualBillVariants = [
        'It was observed that manual receipts were not being issued to passengers, which constitutes a serious violation of consumer protection norms and railway commercial guidelines.',
        'It was noted that physical receipt generation was absent for customer transactions, representing a significant breach of consumer rights and commercial regulatory standards.',
        'It was detected that paper-based billing was not being provided to patrons, constituting a major infringement of customer service protocols and commercial compliance requirements.',
        'It was identified that tangible receipt issuance was being omitted for travellers, indicating a critical violation of consumer documentation rights and commercial operational standards.'
      ];
      observations.push(manualBillVariants[Math.floor(Math.random() * manualBillVariants.length)]);
    }
  }
  
  // Unapproved items with varied regulatory expressions
  if (company.items?.unapprovedItems && company.items.unapprovedItems.length > 0) {
    const itemsList = company.items.unapprovedItems.join(', ');
    const unapprovedVariants = [
      `During stock verification, unauthorized merchandise was found to be retailed from the licensed premises, specifically: ${itemsList}. The sale of non-approved items constitutes a material breach of the licensing agreement and contravenes established commercial protocols.`,
      `Upon inventory assessment, non-sanctioned products were discovered being sold from the authorized facility, namely: ${itemsList}. The retail of unapproved merchandise represents a significant violation of licensing terms and conflicts with prescribed commercial standards.`,
      `Through comprehensive stock examination, unauthorized items were identified being marketed from the licensed establishment, including: ${itemsList}. The distribution of non-approved goods constitutes a serious contravention of agreement conditions and regulatory frameworks.`,
      `During systematic merchandise review, unlicensed products were detected being offered for sale from the permitted premises, specifically: ${itemsList}. The vending of unauthorized items signifies a critical breach of commercial licensing provisions and operational guidelines.`
    ];
    observations.push(unapprovedVariants[Math.floor(Math.random() * unapprovedVariants.length)]);
  }
  
  // Quality and hygiene standards
  if (company.hygieneMaintenance !== undefined) {
    const hygieneStatus = company.hygieneMaintenance ? 
      'Sanitary conditions and food handling practices were found to be in accordance with prescribed hygiene standards' :
      'Significant deficiencies were observed in hygiene maintenance and food safety protocols, necessitating immediate remedial measures';
    observations.push(`${hygieneStatus}.`);
  }
  
  // License and documentation
  if (company.documentation) {
    const licenseStatus = company.documentation.license ? 
      'Valid commercial license was duly displayed and verified' :
      'Commercial license was either not displayed or found to be expired, requiring immediate compliance';
    observations.push(`${licenseStatus}.`);
  }
  
  // Additional notes with enhanced language
  if (company.additionalNotes && company.additionalNotes.trim()) {
    const enhancedNotes = enhanceObservationLanguage(company.additionalNotes.trim());
    observations.push(enhancedNotes);
  }
  
  // Varied professional default observations
  if (observations.length === 0) {
    const defaultVariants = [
      ['Comprehensive inspection was conducted in accordance with prescribed commercial inspection protocols.', 'All operational parameters were systematically evaluated against established railway commercial standards and regulatory requirements.'],
      ['Thorough examination was undertaken following established commercial inspection procedures and compliance standards.', 'Various operational aspects were assessed against prescribed criteria and determined to meet regulatory requirements.'],
      ['Systematic assessment was performed in alignment with mandated commercial verification protocols and standards.', 'Multiple operational elements were evaluated against established benchmarks and confirmed to be satisfactory.'],
      ['Detailed inspection was executed according to prescribed commercial regulatory frameworks and guidelines.', 'All relevant operational factors were scrutinized against standard criteria and found to be compliant.']
    ];
    const selectedDefault = defaultVariants[Math.floor(Math.random() * defaultVariants.length)];
    observations.push(...selectedDefault);
  }
  
  return observations.join('\n\n');
}

function generateGeneralObservationText(item: any, area: string): string {
  const observations = [];
  
  if (typeof item === 'object' && item !== null) {
    // Convert object properties to professional railway inspection language
    for (const [key, value] of Object.entries(item)) {
      const fieldName = formatFieldName(key);
      
      if (typeof value === 'boolean') {
        const status = value ? 
          'was found to be in full compliance with prescribed standards' : 
          'exhibited significant deficiencies requiring immediate remedial action';
        observations.push(`${fieldName} ${status}.`);
      } else if (typeof value === 'string' && value.trim()) {
        observations.push(`${fieldName}: ${enhanceObservationLanguage(value.trim())}.`);
      } else if (Array.isArray(value) && value.length > 0) {
        const itemsList = value.join(', ');
        observations.push(`${fieldName}: The following items were systematically examined - ${itemsList}.`);
      }
    }
  }
  
  if (observations.length === 0) {
    const generalDefaultVariants = [
      [`Comprehensive inspection of the ${area} facility was conducted in accordance with established railway commercial protocols and regulatory frameworks.`, 'All operational parameters and compliance aspects were systematically evaluated against prescribed benchmarks and found to be within acceptable limits.'],
      [`Thorough examination of the ${area} operations was undertaken following prescribed commercial inspection standards and procedures.`, 'Various compliance elements were assessed against regulatory criteria and determined to meet established requirements.'],
      [`Systematic assessment of the ${area} facility was performed in alignment with mandated inspection protocols and standards.`, 'Multiple operational aspects were evaluated against prescribed benchmarks and confirmed to be satisfactory.'],
      [`Detailed inspection of the ${area} area was executed according to established commercial regulatory frameworks and guidelines.`, 'All relevant operational factors were scrutinized against standard criteria and found to be compliant.']
    ];
    const selectedVariant = generalDefaultVariants[Math.floor(Math.random() * generalDefaultVariants.length)];
    observations.push(...selectedVariant);
  }
  
  return observations.join('\n\n');
}

function formatFieldName(key: string): string {
  // Convert camelCase to properly formatted field names
  return key
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/^./, str => str.toUpperCase())
    .replace(/\bid\b/gi, 'ID')
    .replace(/\bmrp\b/gi, 'MRP')
    .replace(/\bpos\b/gi, 'POS')
    .replace(/\bfssai\b/gi, 'FSSAI');
}

function enhanceObservationLanguage(text: string): string {
  // Enhance basic text to professional railway inspection language with variety
  let enhancedText = text;
  
  // Multiple professional alternatives for each basic phrase to ensure variety
  const replacementVariants = {
    'ok': [
      'satisfactory and in compliance',
      'acceptable and conforming to standards',
      'adequate and meeting requirements',
      'appropriate and within specifications'
    ],
    'good': [
      'exemplary and meeting prescribed standards',
      'commendable and exceeding expectations',
      'superior and adhering to protocols',
      'excellent and maintaining high standards'
    ],
    'bad': [
      'substandard and requiring immediate attention',
      'inadequate and necessitating swift intervention',
      'deficient and demanding urgent remediation',
      'unsatisfactory and warranting corrective action'
    ],
    'not working': [
      'non-functional and necessitating urgent rectification',
      'inoperative and requiring immediate technical intervention',
      'dysfunctional and demanding prompt restoration',
      'malfunctioning and warranting expeditious repair'
    ],
    'working': [
      'operational and functioning as per specifications',
      'functional and performing within established parameters',
      'active and operating in accordance with requirements',
      'serviceable and executing prescribed functions'
    ],
    'clean': [
      'maintained in accordance with hygiene protocols',
      'preserved in compliance with sanitary standards',
      'sustained in adherence to cleanliness norms',
      'upheld according to prescribed hygiene requirements'
    ],
    'dirty': [
      'exhibiting unsatisfactory sanitary conditions',
      'displaying compromised hygiene standards',
      'manifesting inadequate cleanliness protocols',
      'demonstrating substandard sanitary maintenance'
    ],
    'found': [
      'observed during systematic examination',
      'detected through comprehensive inspection',
      'identified during thorough assessment',
      'discovered upon meticulous verification'
    ],
    'checked': [
      'subjected to thorough verification',
      'examined through comprehensive assessment',
      'scrutinized via detailed inspection',
      'evaluated through systematic review'
    ],
    'problem': [
      'deficiency requiring corrective measures',
      'irregularity demanding remedial action',
      'discrepancy necessitating intervention',
      'shortcoming warranting immediate attention'
    ],
    'issue': [
      'concern necessitating administrative intervention',
      'matter requiring supervisory attention',
      'aspect demanding managerial consideration',
      'element warranting operational review'
    ]
  };
  
  // Apply random variants to ensure unique expressions
  for (const [basic, variants] of Object.entries(replacementVariants)) {
    const regex = new RegExp(`\\b${basic}\\b`, 'gi');
    if (regex.test(enhancedText)) {
      const randomVariant = variants[Math.floor(Math.random() * variants.length)];
      enhancedText = enhancedText.replace(regex, randomVariant);
    }
  }
  
  // Ensure proper capitalization and punctuation
  enhancedText = enhancedText.charAt(0).toUpperCase() + enhancedText.slice(1);
  if (!enhancedText.endsWith('.') && !enhancedText.endsWith('!') && !enhancedText.endsWith('?')) {
    enhancedText += '.';
  }
  
  return enhancedText;
}

async function convertNewCateringCompanyObservation(company: any, serialNumber: number, inspectionData: InspectionData, actionTaken?: string): Promise<ObservationEntry> {
  const companyName = company.companyName?.startsWith('M/s ') ? 
    company.companyName : `M/s ${company.companyName || 'Unknown Company'}`;
  
  const unitInfo = company.unitType ? ` ${company.unitType}` : '';
  const platformInfo = company.platformNo ? ` at PF No. ${company.platformNo}` : '';
  
  const companyHeading = `${companyName}${unitInfo}${platformInfo}`;

  // Convert new catering structure to English narrative
  const observations = [];
  
  // Smart vendor details handling - supports both single and multiple vendors
  const vendorNames = [];
  if (company.vendorDetails && Array.isArray(company.vendorDetails)) {
    // Handle new multiple vendor structure
    company.vendorDetails.forEach(vendor => {
      if (vendor.name && vendor.name.trim()) {
        const nameWithDesignation = vendor.designation ? 
          `${vendor.name} (${vendor.designation})` : vendor.name;
        vendorNames.push(nameWithDesignation);
      }
    });
  } else if (company.vendorName && company.vendorName.trim()) {
    // Handle legacy single vendor field
    vendorNames.push(company.vendorName);
  }

  if (vendorNames.length > 0) {
    const uniformVariants = company.properUniform ? [
      'was observed to be properly attired in prescribed uniform',
      'was found appropriately dressed in regulation attire',
      'exhibited compliance with mandatory dress code requirements',
      'was noted to be wearing the stipulated uniform correctly'
    ] : [
      'was found operating without the mandatory prescribed uniform',
      'was observed functioning in violation of dress code protocols',
      'exhibited non-compliance with required attire standards',
      'was detected working without regulation uniform'
    ];
    
    const medicalVariants = company.medicalCard ? [
      'with valid medical fitness certificate on record',
      'possessing current health clearance documentation',
      'holding appropriate medical certification',
      'maintaining valid fitness verification records'
    ] : [
      'without producing the mandatory medical fitness certificate',
      'lacking requisite health clearance documentation',
      'failing to present medical certification',
      'absent of mandatory fitness verification'
    ];
    
    const policeVariants = company.policeVerification ? [
      'and bearing requisite police verification clearance',
      'and possessing proper law enforcement background verification',
      'and maintaining valid police clearance certification',
      'and holding appropriate security verification documentation'
    ] : [
      'and lacking the required police verification clearance',
      'and absent of mandatory law enforcement background verification',
      'and without proper police clearance certification',
      'and missing essential security verification documentation'
    ];
    
    const openingVariants = [
      'During the course of systematic inspection,',
      'Upon thorough examination,',
      'During comprehensive assessment,',
      'At the time of detailed verification,'
    ];
    
    const closingVariants = [
      'This compliance aspect requires strict adherence to prescribed commercial protocols.',
      'This matter demands immediate attention to maintain regulatory standards.',
      'This element necessitates urgent consideration for protocol compliance.',
      'This factor warrants prompt action to ensure commercial regulation adherence.'
    ];
    
    const uniformStatus = uniformVariants[Math.floor(Math.random() * uniformVariants.length)];
    const medicalStatus = medicalVariants[Math.floor(Math.random() * medicalVariants.length)];
    const policeStatus = policeVariants[Math.floor(Math.random() * policeVariants.length)];
    const opening = openingVariants[Math.floor(Math.random() * openingVariants.length)];
    const closing = closingVariants[Math.floor(Math.random() * closingVariants.length)];
    
    const vendorText = vendorNames.length === 1 ? 
      vendorNames[0] : 
      `the following personnel: ${vendorNames.join(', ')}`;
    
    observations.push(`${opening} ${vendorText} ${uniformStatus}, ${medicalStatus} ${policeStatus}. ${closing}`);
  }
  
  // Smart overcharging detection - only add if violations detected
  if (company.overchargingItems && company.overchargingItems.length > 0) {
    const hasActualOvercharging = company.overchargingItems.some((item: any) => 
      item.name && item.name.trim() && 
      item.mrpPrice && item.sellingPrice && 
      parseFloat(item.sellingPrice) > parseFloat(item.mrpPrice)
    );
    
    if (hasActualOvercharging) {
      const overchargedItem = company.overchargingItems.find((item: any) => 
        item.name && item.name.trim() && 
        item.mrpPrice && item.sellingPrice && 
        parseFloat(item.sellingPrice) > parseFloat(item.mrpPrice)
      );
      
      if (!overchargedItem) return;
      
      const overchargingVariants = [
        `A flagrant violation of pricing regulations was detected wherein ${overchargedItem.name} was being retailed at Rs.${overchargedItem.sellingPrice}/- against the prescribed Maximum Retail Price of Rs.${overchargedItem.mrpPrice}/-. This constitutes a serious breach of commercial licensing terms and warrants immediate corrective action.`,
        `Serious pricing irregularities were identified where ${overchargedItem.name} was being sold at Rs.${overchargedItem.sellingPrice}/- exceeding the authorized Maximum Retail Price of Rs.${overchargedItem.mrpPrice}/-. This represents a significant contravention of commercial regulations requiring urgent rectification.`,
        `Critical overcharging practices were observed with ${overchargedItem.name} being offered at Rs.${overchargedItem.sellingPrice}/- substantially above the stipulated Maximum Retail Price of Rs.${overchargedItem.mrpPrice}/-. This violation demands immediate corrective measures to ensure regulatory compliance.`
      ];
      observations.push(overchargingVariants[Math.floor(Math.random() * overchargingVariants.length)]);
    } else {
      // Only add positive observation if no overcharging detected
      const noOverchargingVariants = [
        'Comprehensive examination of pricing practices revealed no instances of overcharging, with all merchandise being sold at Maximum Retail Price as mandated by railway commercial regulations.',
        'Systematic price verification demonstrated complete adherence to Maximum Retail Price protocols, with no pricing violations detected during the comprehensive assessment.',
        'Thorough pricing audit confirmed full compliance with prescribed tariff structures, with all commodities being retailed at authorized Maximum Retail Prices.'
      ];
      observations.push(noOverchargingVariants[Math.floor(Math.random() * noOverchargingVariants.length)]);
    }
  }
  
  // Electronic billing infrastructure assessment
  if (company.billMachine) {
    if (company.billMachine === 'available_working') {
      observations.push('The Electronic Point of Sale (EPOS) system was verified to be available and functioning optimally, ensuring compliance with digital billing requirements and facilitating transparent transaction processing.');
    } else if (company.billMachine === 'not_available') {
      observations.push('The Electronic Point of Sale (EPOS) system was found to be completely absent, thereby compromising the mandatory digital transaction recording mechanism and impeding proper revenue accountability.');
    } else if (company.billMachine === 'available_not_working') {
      observations.push('While the Electronic Point of Sale (EPOS) system was physically present, it was found to be non-operational, thereby defeating the purpose of digital billing compliance and requiring urgent technical rectification.');
    }
  }
  
  // Digital payment infrastructure evaluation
  if (company.digitalPayment === 'accepting') {
    observations.push('Digital payment infrastructure was verified to be operational and accepting electronic transactions, thereby facilitating cashless commerce in accordance with modern payment protocols.');
  } else if (company.digitalPayment === 'not_accepting') {
    observations.push('Digital payment facility was found to be non-functional or unavailable, thereby restricting customer payment options and hindering the promotion of cashless transactions.');
  }
  
  // Rate display compliance verification
  if (company.rateListDisplay === 'properly_displayed') {
    observations.push('The prescribed rate list was found to be prominently displayed and clearly visible to customers, ensuring transparency in pricing and compliance with consumer protection norms.');
  } else if (company.rateListDisplay === 'not_displayed') {
    observations.push('The mandatory rate list was either not displayed or inadequately presented, thereby compromising pricing transparency and violating consumer information requirements.');
  }
  
  // Food licensing compliance assessment
  if (company.foodLicense === 'available') {
    observations.push('Valid food handling license issued by competent authority was duly displayed and verified for authenticity, ensuring compliance with food safety regulations.');
  } else if (company.foodLicense === 'not_available') {
    observations.push('Required food handling license was not available or properly displayed, constituting a serious violation of food safety norms and regulatory compliance requirements.');
  }
  
  // Unauthorized merchandise detection
  if (company.unapprovedItems && company.unapprovedItems.length > 0) {
    const itemsList = company.unapprovedItems.join(', ');
    observations.push(`During comprehensive stock verification, unauthorized merchandise was detected being sold from the licensed premises, specifically: ${itemsList}. The retail of non-approved items constitutes a material breach of licensing conditions and contravenes established commercial protocols.`);
  }
  
  // Professional default observation
  if (observations.length === 0) {
    observations.push('Comprehensive inspection was conducted in accordance with prescribed commercial protocols and regulatory frameworks, with all operational parameters being systematically evaluated against established benchmarks.');
  }

  return {
    serialNumber: serialNumber.toString(),
    companyHeading,
    observations,
    actionTakenBy: actionTaken || "Chief Operating Superintendent/Catering",
    photographs: generatePhotographsText(inspectionData.attachedFiles),
    imageFiles: getImageFiles(inspectionData.attachedFiles)
  };
}

function generateFallbackObservation(company: any): string {
  return generateDetailedObservation(company);
}

function generateLetterReference(inspectionData: InspectionData): string {
  const currentDate = new Date().toLocaleDateString('en-GB');
  return `Ref: (i) Letter No.23AC/Decoy Checks dated ${currentDate}.
      (ii) Control Message No.1006/CC/DLI/2025 dated ${currentDate}.`;
}

function generateSignatures(inspectionData: InspectionData): string[] {
  // Use inspector details from form if available
  if (inspectionData.inspectors && inspectionData.inspectors.length > 0) {
    return inspectionData.inspectors
      .filter(inspector => inspector.name && inspector.designation)
      .map(inspector => `${inspector.name}\n${inspector.designation}`);
  }
  
  // Return empty array if no inspectors in form - no auto-generated defaults
  return [];
}

function generatePhotographsText(attachedFiles?: Array<{id: string; fileName: string; fileType: string; filePath: string}>): string {
  if (!attachedFiles || attachedFiles.length === 0) {
    return "Photographic documentation attached as per annexure";
  }
  
  // Filter for image files only
  const imageFiles = attachedFiles.filter(file => 
    file.fileType.startsWith('image/') || 
    file.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  );
  
  if (imageFiles.length === 0) {
    return "Photographic documentation attached as per annexure";
  }
  
  if (imageFiles.length === 1) {
    return `Photographic Evidence: ${imageFiles[0].fileName}`;
  }
  
  return `Photographic Evidence: ${imageFiles.map(f => f.fileName).join(', ')}`;
}

function getImageFiles(attachedFiles?: Array<{id: string; fileName: string; fileType: string; filePath: string}>): Array<{id: string; fileName: string; filePath: string; fileType: string}> {
  if (!attachedFiles || attachedFiles.length === 0) {
    return [];
  }
  
  // Filter for image files only
  return attachedFiles.filter(file => 
    file.fileType.startsWith('image/') || 
    file.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  );
}

async function generateImageCellContent(obs: ObservationEntry): Promise<Paragraph[]> {
  if (!obs.imageFiles || obs.imageFiles.length === 0) {
    return [new Paragraph({
      children: [new TextRun({ text: "As per annexure", size: 22 })],
      alignment: AlignmentType.CENTER
    })];
  }

  const imageContent: Paragraph[] = [];

  // Use a professional format that clearly indicates uploaded photos
  // This provides better compatibility across different Word versions
  for (const imageFile of obs.imageFiles) {
    try {
      if (fs.existsSync(imageFile.filePath)) {
        const stats = fs.statSync(imageFile.filePath);
        
        if (stats.size > 0) {
          console.log(`Adding professional photo reference for ${imageFile.fileName} (${stats.size} bytes)`);
          
          // Create a professional photo reference that's clear and readable
          imageContent.push(new Paragraph({
            children: [
              new TextRun({ 
                text: "Uploaded Photo:", 
                size: 18,
                bold: true
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 }
          }));
          
          imageContent.push(new Paragraph({
            children: [
              new TextRun({ 
                text: imageFile.fileName, 
                size: 16,
                italics: true,
                underline: {}
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 }
          }));
          
        } else {
          imageContent.push(new Paragraph({
            children: [new TextRun({ text: `Photo: ${imageFile.fileName}`, size: 20 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }));
        }
      } else {
        imageContent.push(new Paragraph({
          children: [new TextRun({ text: `Photo: ${imageFile.fileName}`, size: 20 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }));
      }
    } catch (error) {
      console.error(`Error processing image ${imageFile.fileName}:`, error);
      imageContent.push(new Paragraph({
        children: [new TextRun({ text: `Photo: ${imageFile.fileName}`, size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }));
    }
  }

  return imageContent;
}

export async function generateDocumentText(convertedDoc: ConvertedDocument): Promise<string> {
  // Create structured document for RTF table conversion
  let documentText = '';
  
  // Header - will be centered in RTF
  documentText += `${convertedDoc.header}\n\n`;
  
  documentText += `${convertedDoc.subject}\n\n`;
  
  // Letter reference
  if (convertedDoc.letterReference && convertedDoc.letterReference.trim()) {
    documentText += `${convertedDoc.letterReference}\n\n\n\n`;
  }
  
  documentText += `${convertedDoc.openingParagraph}\n\n\n\n`;
  
  // TABLE STRUCTURE MARKER - RTF will parse this specially
  documentText += `TABLE_START\n`;
  documentText += `S.No.|Observations|Action Taken By|Images of the Inspection\n`;
  
  convertedDoc.observations.forEach((obs, index) => {
    // Format all observations in one cell with numbering and indentation
    let observationsCell = `**${obs.companyHeading}**\n`;
    obs.observations.forEach((observation, obsIndex) => {
      observationsCell += `    ${obsIndex + 1}. ${observation}\n`;
    });
    
    // Single row with all observations grouped in one cell - replace newlines with special marker
    const singleLineObservations = observationsCell.replace(/\n/g, '~~~NEWLINE~~~');
    documentText += `${obs.serialNumber}|${singleLineObservations}|${obs.actionTakenBy}|${obs.photographs || 'As per annexure'}\n`;
  });
  
  documentText += `TABLE_END\n\n\n`;
  
  if (convertedDoc.closingNotes) {
    documentText += `Note: ${convertedDoc.closingNotes}\n\n`;
  }
  
  documentText += `\n\n\n`;
  
  // Inspector signatures
  convertedDoc.signatures.forEach((signature, index) => {
    documentText += `SIGNATURE_${index + 1}|${signature}\n`;
  });
  
  documentText += `\n\nCopy to:\nSr.DCM/PS: For kind information please.\nDCM/PS: For kind information please.\n\nFor images of the Decoy Check\n\n`;
  
  return documentText;
}

function wrapTextToWidth(text: string, width: number): string {
  if (text.length <= width) return text;
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length > width) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        // Single word longer than width, force break
        lines.push(word.substring(0, width));
        currentLine = word.substring(width) + ' ';
      }
    } else {
      currentLine += word + ' ';
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  return lines.join('\n');
}

// Portrait format text wrapping optimized for A4 paper
function wrapPortraitText(text: string, width: number): string {
  if (text.length <= width) return text;
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= width) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word too long, break it at width boundary
        let remainingWord = word;
        while (remainingWord.length > width) {
          lines.push(remainingWord.substring(0, width));
          remainingWord = remainingWord.substring(width);
        }
        currentLine = remainingWord;
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}

// Portrait format inspector signature alignment
function formatPortraitInspectorSignatures(signatures: string[], portraitWidth: number): string {
  if (!signatures || signatures.length === 0) {
    return '';
  }
  
  // For portrait format, use 3-column layout with proper spacing
  const colWidth = Math.floor(portraitWidth / 3);
  let signatureText = '';
  
  // Parse signatures into name/designation pairs
  const inspectors = signatures.map(sig => {
    const lines = sig.split('\n');
    return {
      name: lines[0] || '',
      designation: lines[1] || ''
    };
  });
  
  if (inspectors.length === 1) {
    // Single inspector - align right in portrait
    const inspector = inspectors[0];
    const rightPos = portraitWidth - Math.max(inspector.name.length, inspector.designation.length);
    signatureText += `${' '.repeat(Math.max(0, rightPos))}${inspector.name}\n`;
    signatureText += `${' '.repeat(Math.max(0, rightPos))}${inspector.designation}`;
  } else if (inspectors.length === 2) {
    // Two inspectors - 1st right, 2nd middle in portrait
    const first = inspectors[0];  // Right
    const second = inspectors[1]; // Middle
    
    const middlePos = Math.floor(portraitWidth / 2) - Math.floor(Math.max(second.name.length, second.designation.length) / 2);
    const rightPos = portraitWidth - Math.max(first.name.length, first.designation.length);
    
    // Names line
    signatureText += `${' '.repeat(Math.max(0, middlePos))}${second.name}`;
    signatureText += `${' '.repeat(Math.max(1, rightPos - middlePos - second.name.length))}${first.name}\n`;
    
    // Designations line  
    signatureText += `${' '.repeat(Math.max(0, middlePos))}${second.designation}`;
    signatureText += `${' '.repeat(Math.max(1, rightPos - middlePos - second.designation.length))}${first.designation}`;
  } else if (inspectors.length >= 3) {
    // Three or more inspectors - 1st right, 2nd middle, 3rd left in portrait
    const first = inspectors[0];  // Right
    const second = inspectors[1]; // Middle  
    const third = inspectors[2];  // Left
    
    const middlePos = Math.floor(portraitWidth / 2) - Math.floor(Math.max(second.name.length, second.designation.length) / 2);
    const rightPos = portraitWidth - Math.max(first.name.length, first.designation.length);
    
    // Names line
    signatureText += `${third.name}`;
    signatureText += `${' '.repeat(Math.max(1, middlePos - third.name.length))}${second.name}`;
    signatureText += `${' '.repeat(Math.max(1, rightPos - middlePos - second.name.length))}${first.name}\n`;
    
    // Designations line
    signatureText += `${third.designation}`;
    signatureText += `${' '.repeat(Math.max(1, middlePos - third.designation.length))}${second.designation}`;
    signatureText += `${' '.repeat(Math.max(1, rightPos - middlePos - second.designation.length))}${first.designation}`;
  }
  
  return signatureText;
}

// Generate RTF document for Microsoft Office compatibility with proper table structure
export function generateRTFDocument(plainText: string): string {
  // RTF header for latest Microsoft Word compatibility
  let rtfContent = '{\\rtf1\\ansi\\deff0';
  
  // Font table with common Windows fonts
  rtfContent += '{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}{\\f1\\fswiss\\fcharset0 Arial;}}';
  
  // Color table
  rtfContent += '{\\colortbl;\\red0\\green0\\blue0;\\red128\\green128\\blue128;}';
  
  // Document formatting for portrait A4
  rtfContent += '\\paperw11906\\paperh16838'; // A4 size in twips
  rtfContent += '\\margl1134\\margr1134\\margt850\\margb850'; // 1 inch margins
  rtfContent += '\\sectd\\pgwsxn11906\\pghsxn16838'; // Page dimensions
  rtfContent += '\\cols1\\colsx708'; // Single column
  
  // Default paragraph formatting
  rtfContent += '\\pard\\plain\\f0\\fs24'; // Times New Roman, 12pt
  
  const lines = plainText.split('\n');
  let inTable = false;
  let tableHeaderDone = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Northern Railway header - CENTERED AT TOP OF PAGE
    if (line.trim() === 'Northern Railway') {
      rtfContent += '\\qc\\b\\fs32\\ul ' + escapeRTF(line) + '\\ulnone\\b0\\fs24\\par\\par\\par';
      continue;
    }
    
    // Subject line formatting
    if (line.startsWith('Sub:')) {
      rtfContent += '\\ql\\b\\fs26 ' + escapeRTF(line) + '\\b0\\fs24\\par\\par';
      continue;
    }
    
    // Reference line formatting
    if (line.startsWith('Ref:')) {
      rtfContent += '\\ql\\fs22 ' + escapeRTF(line) + '\\fs24\\par';
      continue;
    }
    
    // Opening paragraph with justify
    if (line.includes('As per reference above')) {
      rtfContent += '\\par\\qj\\fs22 ' + escapeRTF(line) + '\\fs24\\par\\par';
      continue;
    }
    
    // TABLE START MARKER
    if (line === 'TABLE_START') {
      inTable = true;
      tableHeaderDone = false;
      continue;
    }
    
    // TABLE END MARKER
    if (line === 'TABLE_END') {
      inTable = false;
      rtfContent += '\\pard\\par\\par';
      continue;
    }
    
    // Process table content
    if (inTable) {
      const parts = line.split('|');
      
      if (parts.length >= 4) {
        // Start table row with borders
        rtfContent += '\\trowd\\trgaph108\\trleft-108';
        
        // Add table borders (all borders)
        rtfContent += '\\trbrdrt\\brdrs\\brdrw10\\brdrcf1';  // Top border
        rtfContent += '\\trbrdrb\\brdrs\\brdrw10\\brdrcf1';  // Bottom border
        rtfContent += '\\trbrdrl\\brdrs\\brdrw10\\brdrcf1';  // Left border
        rtfContent += '\\trbrdrr\\brdrs\\brdrw10\\brdrcf1';  // Right border
        
        // Define column widths (in twips: 1 inch = 1440 twips, total ~10000)
        rtfContent += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf1';  // Cell top border
        rtfContent += '\\clbrdrb\\brdrs\\brdrw10\\brdrcf1';  // Cell bottom border
        rtfContent += '\\clbrdrl\\brdrs\\brdrw10\\brdrcf1';  // Cell left border
        rtfContent += '\\clbrdrr\\brdrs\\brdrw10\\brdrcf1';  // Cell right border
        rtfContent += '\\cellx1000';      // S.No. - 1000 twips
        
        rtfContent += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\clbrdrb\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\clbrdrl\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\clbrdrr\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\cellx7200';      // Observations - 6200 twips wide for better content display  
        
        rtfContent += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\clbrdrb\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\clbrdrl\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\clbrdrr\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\cellx8700';      // Action Taken By - 1500 twips
        
        rtfContent += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\clbrdrb\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\clbrdrl\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\clbrdrr\\brdrs\\brdrw10\\brdrcf1';  
        rtfContent += '\\cellx10000';     // Images - 1500 twips
        
        // Table header row
        if (!tableHeaderDone && parts[0] === 'S.No.') {
          rtfContent += '\\pard\\intbl\\qc\\b\\fs22 ' + escapeRTF(parts[0]) + '\\cell';
          rtfContent += '\\pard\\intbl\\qc\\b\\fs22 ' + escapeRTF(parts[1]) + '\\cell';
          rtfContent += '\\pard\\intbl\\qc\\b\\fs22 ' + escapeRTF(parts[2]) + '\\cell';
          rtfContent += '\\pard\\intbl\\qc\\b\\fs22 ' + escapeRTF(parts[3]) + '\\cell';
          rtfContent += '\\row';
          tableHeaderDone = true;
          continue;
        }
        
        // Data rows
        if (tableHeaderDone) {
          // Serial number cell (bold if not empty)
          if (parts[0].trim()) {
            rtfContent += '\\pard\\intbl\\qc\\b\\fs22 ' + escapeRTF(parts[0]) + '\\b0\\cell';
          } else {
            rtfContent += '\\pard\\intbl\\cell';
          }
          
          // Observations cell with justify formatting and special formatting for bold and numbered lists
          if (parts[1].trim()) {
            let cellContent = parts[1];
            
            // Restore newlines from table generation
            cellContent = cellContent.replace(/~~~NEWLINE~~~/g, '\n');
            
            // Process the content line by line to handle formatting
            const lines = cellContent.split('\n');
            let formattedContent = '';
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              
              // Handle bold headings (**text**)
              if (line.includes('**')) {
                const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '\\b $1\\b0');
                formattedContent += boldFormatted;
                if (i < lines.length - 1) formattedContent += '\\par ';
              }
              // Handle numbered lists with proper indentation and spacing
              else if (line.match(/^\s+\d+\./)) {
                const cleanLine = line.trim();
                formattedContent += '\\li720\\fi-360 ' + cleanLine; // Hanging indent for numbered lists
                if (i < lines.length - 1) formattedContent += '\\par ';
              }
              // Regular content
              else if (line.trim()) {
                formattedContent += line.trim();
                if (i < lines.length - 1) formattedContent += '\\par ';
              }
            }
            
            rtfContent += '\\pard\\intbl\\ql\\fs22 ' + formattedContent + '\\cell';
          } else {
            rtfContent += '\\pard\\intbl\\cell';
          }
          
          // Action taken cell
          if (parts[2].trim()) {
            rtfContent += '\\pard\\intbl\\qc\\fs22 ' + escapeRTF(parts[2]) + '\\cell';
          } else {
            rtfContent += '\\pard\\intbl\\cell';
          }
          
          // Images cell
          if (parts[3].trim()) {
            rtfContent += '\\pard\\intbl\\qc\\fs22 ' + escapeRTF(parts[3]) + '\\cell';
          } else {
            rtfContent += '\\pard\\intbl\\cell';
          }
          
          rtfContent += '\\row';
        }
      }
      continue;
    }
    
    // Inspector signatures with special formatting
    if (line.startsWith('SIGNATURE_')) {
      const parts = line.split('|');
      if (parts.length >= 2) {
        const signature = parts[1];
        const sigLines = signature.split('\\n');
        
        // Position signatures: 1st right, 2nd middle, 3rd left
        if (line.startsWith('SIGNATURE_1')) {
          rtfContent += '\\ql\\b\\fs22 ' + escapeRTF(sigLines[0]) + '\\b0\\tab\\tab\\tab';
        } else if (line.startsWith('SIGNATURE_2')) {
          rtfContent += '\\tab\\tab ' + escapeRTF(sigLines[0]) + '\\tab\\tab';
        } else if (line.startsWith('SIGNATURE_3')) {
          rtfContent += escapeRTF(sigLines[0]) + '\\par';
          
          // Designations line
          rtfContent += '\\ql\\b\\fs22 ';
          if (parts[1].includes('CMI/YTSK')) rtfContent += escapeRTF('CMI/YTSK');
          rtfContent += '\\tab\\tab CMI/G.\\tab\\tab CMI/Ctg/VIP\\b0\\fs24\\par\\par';
        }
        continue;
      }
    }
    
    // Copy to section
    if (line.startsWith('Copy to:')) {
      rtfContent += '\\ql\\b\\fs22 ' + escapeRTF(line) + '\\b0\\par';
      continue;
    }
    
    // Regular content
    if (line.trim() && !line.startsWith('SIGNATURE_')) {
      rtfContent += '\\ql\\fs22 ' + escapeRTF(line) + '\\par';
    } else if (!line.trim()) {
      rtfContent += '\\par'; // Empty line
    }
  }
  
  rtfContent += '}';
  return rtfContent;
}

// Escape special RTF characters
function escapeRTF(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/[\u0080-\uffff]/g, (match) => {
      return '\\u' + match.charCodeAt(0) + '?';
    });
}

function formatInspectorSignatures(signatures: string[]): string {
  if (!signatures || signatures.length === 0) {
    return '';
  }
  
  const pageWidth = 120;
  let result = '';
  
  // Parse signatures into name/designation pairs
  const inspectors = signatures.map(sig => {
    const lines = sig.split('\n');
    return {
      name: lines[0] || '',
      designation: lines[1] || ''
    };
  });
  
  if (inspectors.length === 1) {
    // Single inspector - align right
    const inspector = inspectors[0];
    const rightPos = pageWidth - Math.max(inspector.name.length, inspector.designation.length);
    result += `${' '.repeat(rightPos)}${inspector.name}\n`;
    result += `${' '.repeat(rightPos)}${inspector.designation}`;
  } else if (inspectors.length === 2) {
    // Two inspectors - 1st right, 2nd middle
    const first = inspectors[0];  // Right
    const second = inspectors[1]; // Middle
    
    const middlePos = Math.floor(pageWidth / 2) - Math.floor(Math.max(second.name.length, second.designation.length) / 2);
    const rightPos = pageWidth - Math.max(first.name.length, first.designation.length);
    
    // Names line
    result += `${' '.repeat(middlePos)}${second.name}`;
    result += `${' '.repeat(Math.max(1, rightPos - middlePos - second.name.length))}${first.name}\n`;
    
    // Designations line  
    result += `${' '.repeat(middlePos)}${second.designation}`;
    result += `${' '.repeat(Math.max(1, rightPos - middlePos - second.designation.length))}${first.designation}`;
  } else if (inspectors.length >= 3) {
    // Three or more inspectors - 1st right, 2nd middle, 3rd left
    const first = inspectors[0];  // Right
    const second = inspectors[1]; // Middle  
    const third = inspectors[2];  // Left
    
    const leftPos = 0;
    const middlePos = Math.floor(pageWidth / 2) - Math.floor(Math.max(second.name.length, second.designation.length) / 2);
    const rightPos = pageWidth - Math.max(first.name.length, first.designation.length);
    
    // Names line
    result += `${third.name}`;
    result += `${' '.repeat(Math.max(1, middlePos - third.name.length))}${second.name}`;
    result += `${' '.repeat(Math.max(1, rightPos - middlePos - second.name.length))}${first.name}\n`;
    
    // Designations line
    result += `${third.designation}`;
    result += `${' '.repeat(Math.max(1, middlePos - third.designation.length))}${second.designation}`;
    result += `${' '.repeat(Math.max(1, rightPos - middlePos - second.designation.length))}${first.designation}`;
  }
  
  return result;
}

export async function generateWordDocument(convertedDoc: ConvertedDocument): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header - Centered and Underlined
        new Paragraph({
          children: [
            new TextRun({
              text: convertedDoc.header,
              bold: true,
              size: 32, // 16pt
              underline: { type: "single" }
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Subject - Bold
        new Paragraph({
          children: [
            new TextRun({
              text: convertedDoc.subject,
              bold: true,
              size: 26 // 13pt
            })
          ],
          spacing: { after: 300 }
        }),

        // Reference
        new Paragraph({
          children: [
            new TextRun({
              text: convertedDoc.letterReference,
              size: 22 // 11pt
            })
          ],
          spacing: { after: 400 }
        }),

        // Opening paragraph - Justified
        new Paragraph({
          children: [
            new TextRun({
              text: convertedDoc.openingParagraph,
              size: 22 // 11pt
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
        }),

        // Create the observations table
        new Table({
          columnWidths: [1000, 6200, 1500, 1300], // Column widths in twentieths of a point
          rows: [
            // Header row
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "S.No.", bold: true, size: 22 })],
                    alignment: AlignmentType.CENTER
                  })],
                  width: { size: 10, type: WidthType.PERCENTAGE }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "Observations", bold: true, size: 22 })],
                    alignment: AlignmentType.CENTER
                  })],
                  width: { size: 60, type: WidthType.PERCENTAGE }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "Action Taken By", bold: true, size: 22 })],
                    alignment: AlignmentType.CENTER
                  })],
                  width: { size: 15, type: WidthType.PERCENTAGE }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "Images of the Inspection", bold: true, size: 22 })],
                    alignment: AlignmentType.CENTER
                  })],
                  width: { size: 15, type: WidthType.PERCENTAGE }
                })
              ]
            }),
            // Data rows - generate async and await all
            ...(await Promise.all(convertedDoc.observations.map(async obs => 
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: obs.serialNumber, bold: true, size: 22 })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [
                      // Company heading in bold
                      new Paragraph({
                        children: [new TextRun({ text: obs.companyHeading, bold: true, size: 22 })],
                        spacing: { after: 100 }
                      }),
                      // Observations with numbering and indentation
                      ...obs.observations.map((observation, index) => 
                        new Paragraph({
                          children: [new TextRun({ text: `${index + 1}. ${observation}`, size: 22 })],
                          indent: { left: 720, hanging: 360 }, // Hanging indent
                          spacing: { after: 100 }
                        })
                      )
                    ],
                    width: { size: 60, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: obs.actionTakenBy, size: 22 })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 15, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: await generateImageCellContent(obs),
                    width: { size: 15, type: WidthType.PERCENTAGE }
                  })
                ]
              })
            )))
          ]
        }),

        // Spacing after table
        new Paragraph({
          children: [new TextRun({ text: "", size: 22 })],
          spacing: { after: 300 }
        }),



        // Inspector signatures with proper alignment (only if signatures exist)
        ...(convertedDoc.signatures.length > 0 ? [
          new Paragraph({
            children: [new TextRun({ text: "", size: 22 })],
            spacing: { after: 300 }
          }),

          // Special handling for single inspector: name and designation in one column, right-aligned
          ...(convertedDoc.signatures.length === 1 ? [
            // Single inspector: name and designation stacked vertically, right-aligned
            new Paragraph({
              children: [new TextRun({ text: convertedDoc.signatures[0].split('\n')[0] || '', bold: true, size: 22 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 50 }
            }),
            new Paragraph({
              children: [new TextRun({ text: convertedDoc.signatures[0].split('\n')[1] || '', size: 20 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 }
            })
          ] : [
            // Two or more inspectors: multi-column table, each column contains name and designation of one inspector
            new Table({
              rows: [
                new TableRow({
                  children: convertedDoc.signatures.map((signature, index) => {
                    const lines = signature.split('\n');
                    const name = lines[0] || '';
                    const designation = lines[1] || '';
                    
                    // Calculate column width based on number of inspectors
                    const columnWidth = Math.floor(100 / convertedDoc.signatures.length);
                    
                    return new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: name, bold: true, size: 22 })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 50 }
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: designation, size: 20 })],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 50 }
                        })
                      ],
                      width: { size: columnWidth, type: WidthType.PERCENTAGE },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE }
                      }
                    });
                  })
                })
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
              }
            })
          ])
        ] : []),

        // Copy to section
        new Paragraph({
          children: [new TextRun({ text: "", size: 22 })],
          spacing: { after: 300 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Copy to:",
              bold: true,
              size: 22
            })
          ],
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Sr.DCM/PS: For kind information please.",
              size: 22
            })
          ],
          spacing: { after: 100 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "DCM/PS: For kind information please.",
              size: 22
            })
          ],
          spacing: { after: 200 }
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "For images of the Decoy Check",
              size: 22
            })
          ]
        })
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}