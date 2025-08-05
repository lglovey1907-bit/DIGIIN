import OpenAI from "openai";

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

    // Generate subject line (fallback without AI)
    const generatedSubject = `Sub: Decoy Checks on ${inspectionData.area} facilities at ${inspectionData.stationCode} Railway Station.`;

    // Generate opening paragraph (fallback without AI)
    const openingParagraph = `As per reference above, undersigned conducted course of decoy checks of ${inspectionData.area} facilities at ${inspectionData.stationCode} Railway Station on ${formattedDate}. During the course of decoy checks, the deficiencies observed over Commercial Aspect were as follows:-`;

    // Convert observations to structured format
    const convertedObservations = await convertObservationsToDocument(inspectionData.observations);
    console.log("Converted observations:", convertedObservations.length, "entries");

    const result = {
      header: "Northern Railway",
      subject: generatedSubject,
      letterReference: inspectionData.letterReference || generateLetterReference(inspectionData),
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

async function convertObservationsToDocument(observations: any): Promise<ObservationEntry[]> {
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
            const entry = await convertNewCateringCompanyObservation(company, serialNumber);
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
        const entry = await convertGeneralObservation(item, serialNumber, key);
        convertedEntries.push(entry);
        serialNumber++;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Handle single object observations
      console.log(`Converting single object observation for area: ${key}`);
      const entry = await convertGeneralObservation(value, serialNumber, key);
      convertedEntries.push(entry);
      serialNumber++;
    }
  }

  // If no entries were created, add a fallback
  if (convertedEntries.length === 0) {
    console.log("No observations processed, adding fallback");
    convertedEntries.push({
      serialNumber: "1",
      companyHeading: "General Inspection",
      observations: ["Inspection conducted as per standard procedures.", "No specific deficiencies observed during the inspection."],
      actionTakenBy: "SS/DEC\nCMI/DEE\nCMI/Ctg\nCOS/Ctg.",
      photographs: "As per annexure"
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
    actionTakenBy: "SS/DEC\nCMI/DEE\nCMI/Ctg\nCOS/Ctg.",
    photographs: "As per annexure"
  };
}

async function convertGeneralObservation(item: any, serialNumber: number, area: string): Promise<ObservationEntry> {
  // Convert general observations without AI
  const convertedText = generateGeneralObservationText(item, area);

  return {
    serialNumber: serialNumber.toString(),
    companyHeading: `${area.charAt(0).toUpperCase() + area.slice(1)} Inspection - Unit ${serialNumber}`,
    observations: convertedText.split('\n').filter(line => line.trim()),
    actionTakenBy: "SS/DEC\nCMI/DEE\nCMI/Ctg\nCOS/Ctg.",
    photographs: "As per annexure"
  };
}

function generateDetailedObservation(company: any): string {
  const observations = [];
  
  // Vendor details
  if (company.vendorDetails) {
    const vendorName = company.vendorDetails.vendorName || 'vendor';
    const uniform = company.vendorDetails.uniform ? 'with proper uniform' : 'without proper uniform';
    const idCard = company.documentation?.idCard ? 'with proper ID Card' : 'without ID Card';
    const medical = company.documentation?.medicalCertificate ? '& Medical Certificate' : '& without Medical Certificate';
    
    observations.push(`At the time of checks, ${vendorName} was found working in the said stall ${uniform}, ${idCard} ${medical}.`);
  }
  
  // Overcharging
  if (company.overcharging?.detected === false) {
    observations.push('No case of overcharging was detected.');
  } else if (company.overcharging?.detected === true) {
    observations.push(`Overcharging detected: ${company.overcharging.details || 'Details to be verified'}.`);
  }
  
  // Billing machine
  if (company.billing) {
    if (company.billing.electronicBillMachine === false) {
      observations.push('The Electronic Billing Machine was not functional.');
    } else if (company.billing.electronicBillMachine === true) {
      observations.push('Electronic Billing Machine was available and functional.');
    }
    
    if (company.billing.manualBill === false) {
      observations.push('Manual bills were not being issued to passengers.');
    }
  }
  
  // Unapproved items
  if (company.items?.unapprovedItems && company.items.unapprovedItems.length > 0) {
    const itemsList = company.items.unapprovedItems.join(', ');
    observations.push(`From the said stall unapproved items were observed selling i.e. ${itemsList}.`);
  }
  
  // Additional notes
  if (company.additionalNotes && company.additionalNotes.trim()) {
    observations.push(company.additionalNotes.trim());
  }
  
  // Default if no observations
  if (observations.length === 0) {
    observations.push('Inspection conducted as per standard procedures.');
    observations.push('Various aspects were checked for compliance.');
  }
  
  return observations.join('\n\n');
}

function generateGeneralObservationText(item: any, area: string): string {
  const observations = [];
  
  if (typeof item === 'object' && item !== null) {
    // Convert object properties to readable text
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'boolean') {
        const status = value ? 'satisfactory' : 'unsatisfactory';
        observations.push(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${status}`);
      } else if (typeof value === 'string' && value.trim()) {
        observations.push(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}`);
      } else if (Array.isArray(value) && value.length > 0) {
        observations.push(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value.join(', ')}`);
      }
    }
  }
  
  if (observations.length === 0) {
    observations.push(`Inspection of ${area} area conducted as per standard procedures.`);
    observations.push('Various aspects were checked for compliance with railway standards.');
  }
  
  return observations.join('\n');
}

async function convertNewCateringCompanyObservation(company: any, serialNumber: number): Promise<ObservationEntry> {
  const companyName = company.companyName?.startsWith('M/s ') ? 
    company.companyName : `M/s ${company.companyName || 'Unknown Company'}`;
  
  const unitInfo = company.unitType ? ` ${company.unitType}` : '';
  const platformInfo = company.platformNo ? ` at PF No. ${company.platformNo}` : '';
  
  const companyHeading = `${companyName}${unitInfo}${platformInfo}`;

  // Convert new catering structure to English narrative
  const observations = [];
  
  // Vendor details
  if (company.vendorName) {
    const uniform = company.properUniform ? 'with proper uniform' : 'without proper uniform';
    const medical = company.medicalCard ? 'with Medical Certificate' : 'without Medical Certificate';
    const police = company.policeVerification ? 'with Police Verification' : 'without Police Verification';
    
    observations.push(`At the time of checks, ${company.vendorName} was found working in the said stall ${uniform}, ${medical} ${police}.`);
  }
  
  // Overcharging check
  if (company.overchargingItems && company.overchargingItems.length > 0) {
    const item = company.overchargingItems[0];
    observations.push(`Overcharging detected: ${item.name} was being sold at Rs.${item.sellingPrice}/- against MRP Rs.${item.mrpPrice}/-.`);
  } else {
    observations.push('No case of overcharging was detected.');
  }
  
  // Billing machine status
  if (company.billMachine) {
    if (company.billMachine === 'available_working') {
      observations.push('Electronic Billing Machine was available and working properly.');
    } else if (company.billMachine === 'not_available') {
      observations.push('Electronic Billing Machine was not available.');
    } else if (company.billMachine === 'available_not_working') {
      observations.push('Electronic Billing Machine was available but not working.');
    }
  }
  
  // Digital payment
  if (company.digitalPayment === 'accepting') {
    observations.push('Digital payment facility was available and functional.');
  } else if (company.digitalPayment === 'not_accepting') {
    observations.push('Digital payment facility was not available.');
  }
  
  // Rate list display
  if (company.rateListDisplay === 'properly_displayed') {
    observations.push('Rate list was properly displayed.');
  } else if (company.rateListDisplay === 'not_displayed') {
    observations.push('Rate list was not properly displayed.');
  }
  
  // Food license
  if (company.foodLicense === 'available') {
    observations.push('Food license was available and valid.');
  } else if (company.foodLicense === 'not_available') {
    observations.push('Food license was not available.');
  }
  
  // Unapproved items
  if (company.unapprovedItems && company.unapprovedItems.length > 0) {
    const itemsList = company.unapprovedItems.join(', ');
    observations.push(`From the said stall unapproved items were observed selling i.e. ${itemsList}.`);
  }
  
  // Default if no observations
  if (observations.length === 0) {
    observations.push('Inspection conducted as per standard procedures.');
  }

  return {
    serialNumber: serialNumber.toString(),
    companyHeading,
    observations,
    actionTakenBy: "SS/DEC\nCMI/DEE\nCMI/Ctg\nCOS/Ctg.",
    photographs: "As per annexure"
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
  return [
    "Sanjay Kumar Singh\nCMI/YTSK",
    "Lovey Gandhi\nCMI/G.",
    "Vivek Kumar\nCMI/Ctg/VIP"
  ];
}

export async function generateDocumentText(convertedDoc: ConvertedDocument): Promise<string> {
  let documentText = `${convertedDoc.header}\n\n`;
  documentText += `${convertedDoc.subject}\n\n`;
  documentText += `${convertedDoc.letterReference}\n\n\n\n`;
  documentText += `${convertedDoc.openingParagraph}\n\n\n\n`;
  
  documentText += `SN\t\tDeficiencies/ Observations\t\tAction Taken By\n\n`;
  
  convertedDoc.observations.forEach((obs, index) => {
    documentText += `${obs.serialNumber}.\n\n`;
    documentText += `${obs.companyHeading}\n\n`;
    
    obs.observations.forEach(observation => {
      documentText += `${observation}\n\n`;
    });
    
    documentText += `${obs.actionTakenBy}\n\n`;
    
    if (obs.photographs) {
      documentText += `Photographs: ${obs.photographs}\n\n`;
    }
    
    documentText += `\n\n`;
  });
  
  if (convertedDoc.closingNotes) {
    documentText += `\n\nNote: ${convertedDoc.closingNotes}\n\n`;
  }
  
  documentText += `\n\n\n`;
  convertedDoc.signatures.forEach((signature, index) => {
    documentText += `${signature}${index < convertedDoc.signatures.length - 1 ? '\t\t\t\t' : ''}`;
  });
  
  documentText += `\n\n\nCopy to:\nSr.DCM/PS: For kind information please.\nDCM/PS: For kind information please.\n\nFor images of the Decoy Check\n\n`;
  
  return documentText;
}