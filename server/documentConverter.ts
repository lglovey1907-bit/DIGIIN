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
  // Use portrait format optimized for A4 paper (210mm width)
  // Standard A4 portrait: ~70-75 characters per line for optimal readability
  const portraitWidth = 75;
  
  let documentText = '';
  
  // Header - Centered for portrait format
  const headerSpaces = ' '.repeat(Math.max(0, (portraitWidth - convertedDoc.header.length) / 2));
  documentText += `${headerSpaces}${convertedDoc.header}\n\n`;
  
  documentText += `${convertedDoc.subject}\n\n`;
  
  // Letter reference - Only show if user provided custom reference
  if (convertedDoc.letterReference && 
      convertedDoc.letterReference.trim() && 
      !convertedDoc.letterReference.includes('Letter No.23AC/Decoy Checks dated')) {
    documentText += `${convertedDoc.letterReference}\n\n\n\n`;
  } else if (convertedDoc.letterReference && convertedDoc.letterReference.trim()) {
    documentText += `${convertedDoc.letterReference}\n\n\n\n`;
  }
  
  documentText += `${convertedDoc.openingParagraph}\n\n\n\n`;
  
  // Portrait format table structure optimized for A4
  const portraitColWidths = {
    sn: 5,
    observations: 45,
    actionTaken: 15,
    photographs: 10
  };
  
  // Table header with portrait formatting
  documentText += `${'S.No.'.padEnd(portraitColWidths.sn)}${'Deficiencies/Observations'.padEnd(portraitColWidths.observations)}${'Action Taken By'.padEnd(portraitColWidths.actionTaken)}${'Photos'}\n`;
  documentText += `${'-'.repeat(portraitColWidths.sn)}${'-'.repeat(portraitColWidths.observations)}${'-'.repeat(portraitColWidths.actionTaken)}${'-'.repeat(portraitColWidths.photographs)}\n`;
  
  convertedDoc.observations.forEach((obs, index) => {
    // Start with SN and company heading
    documentText += `${obs.serialNumber.padEnd(portraitColWidths.sn)}`;
    
    // Company heading with portrait wrapping
    const wrappedCompany = wrapPortraitText(obs.companyHeading, portraitColWidths.observations - 2);
    const companyLines = wrappedCompany.split('\n');
    documentText += `${companyLines[0].padEnd(portraitColWidths.observations)}`;
    
    // Action taken by (first line)
    const actionLines = obs.actionTakenBy.split('\n').filter(line => line.trim());
    documentText += `${(actionLines[0] || '').substring(0, portraitColWidths.actionTaken).padEnd(portraitColWidths.actionTaken)}`;
    documentText += `${(obs.photographs || 'Annexure').substring(0, portraitColWidths.photographs)}\n`;
    
    // Additional company heading lines
    for (let i = 1; i < companyLines.length; i++) {
      documentText += `${' '.repeat(portraitColWidths.sn)}`;
      documentText += `${companyLines[i].padEnd(portraitColWidths.observations)}`;
      if (i < actionLines.length) {
        documentText += `${actionLines[i].substring(0, portraitColWidths.actionTaken).padEnd(portraitColWidths.actionTaken)}`;
      } else {
        documentText += `${' '.repeat(portraitColWidths.actionTaken)}`;
      }
      documentText += `${' '.repeat(portraitColWidths.photographs)}\n`;
    }
    
    // Observations content with portrait formatting
    obs.observations.forEach((observation, obsIndex) => {
      const wrappedObs = wrapPortraitText(observation, portraitColWidths.observations - 2);
      const obsLines = wrappedObs.split('\n');
      
      obsLines.forEach((obsLine, lineIndex) => {
        documentText += `${' '.repeat(portraitColWidths.sn)}`;
        documentText += `${obsLine.padEnd(portraitColWidths.observations)}`;
        
        // Show remaining action taken lines
        const actionLineIndex = companyLines.length + obsIndex + lineIndex;
        if (actionLineIndex < actionLines.length) {
          documentText += `${actionLines[actionLineIndex].substring(0, portraitColWidths.actionTaken).padEnd(portraitColWidths.actionTaken)}`;
        } else {
          documentText += `${' '.repeat(portraitColWidths.actionTaken)}`;
        }
        documentText += `${' '.repeat(portraitColWidths.photographs)}\n`;
      });
    });
    
    // Separator between entries for better readability in portrait
    if (index < convertedDoc.observations.length - 1) {
      documentText += `${'-'.repeat(portraitColWidths.sn)}${'-'.repeat(portraitColWidths.observations)}${'-'.repeat(portraitColWidths.actionTaken)}${'-'.repeat(portraitColWidths.photographs)}\n`;
    }
  });
  
  if (convertedDoc.closingNotes) {
    documentText += `\n\nNote: ${convertedDoc.closingNotes}\n\n`;
  }
  
  documentText += `\n\n\n`;
  
  // Format signatures with portrait alignment
  documentText += formatPortraitInspectorSignatures(convertedDoc.signatures, portraitWidth);
  
  documentText += `\n\n\nCopy to:\nSr.DCM/PS: For kind information please.\nDCM/PS: For kind information please.\n\nFor images of the Decoy Check\n\n`;
  
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

// Generate RTF document for Microsoft Office compatibility
export function generateRTFDocument(plainText: string): string {
  // RTF header for latest Microsoft Word compatibility
  let rtfContent = '{\\rtf1\\ansi\\deff0';
  
  // Font table with common Windows fonts
  rtfContent += '{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}{\\f1\\fswiss\\fcharset0 Arial;}}';
  
  // Color table
  rtfContent += '{\\colortbl;\\red0\\green0\\blue0;}';
  
  // Document formatting for portrait A4
  rtfContent += '\\paperw11906\\paperh16838'; // A4 size in twips
  rtfContent += '\\margl1134\\margr1134\\margt850\\margb850'; // 1 inch margins
  rtfContent += '\\sectd\\pgwsxn11906\\pghsxn16838'; // Page dimensions
  rtfContent += '\\cols1\\colsx708'; // Single column
  
  // Default paragraph formatting
  rtfContent += '\\pard\\plain\\f0\\fs24'; // Times New Roman, 12pt
  
  // Convert plain text to RTF format
  const lines = plainText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Header formatting (centered)
    if (line.trim() === 'Northern Railway') {
      rtfContent += '\\qc\\b\\fs28 ' + escapeRTF(line) + '\\b0\\fs24\\par\\par';
      continue;
    }
    
    // Subject line formatting
    if (line.startsWith('Sub:')) {
      rtfContent += '\\ql\\b ' + escapeRTF(line) + '\\b0\\par\\par';
      continue;
    }
    
    // Reference line formatting
    if (line.startsWith('Ref:')) {
      rtfContent += '\\ql ' + escapeRTF(line) + '\\par\\par';
      continue;
    }
    
    // Table header formatting
    if (line.includes('S.No.') && line.includes('Deficiencies/Observations')) {
      rtfContent += '\\ql\\b ' + escapeRTF(line) + '\\b0\\par';
      continue;
    }
    
    // Table separator lines
    if (line.match(/^-+$/)) {
      rtfContent += '\\ql ' + escapeRTF(line) + '\\par';
      continue;
    }
    
    // Inspector signatures (detect by pattern)
    if (line.includes('CMI/') || line.includes('COS/') || line.includes('SS/')) {
      rtfContent += '\\ql\\b ' + escapeRTF(line) + '\\b0\\par';
      continue;
    }
    
    // Regular content
    if (line.trim()) {
      rtfContent += '\\ql ' + escapeRTF(line) + '\\par';
    } else {
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