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

    // Use inspection subject from form
    const generatedSubject = `Sub: ${inspectionData.subject}`;

    // Generate opening paragraph with dynamic subject content
    const openingParagraph = `As per reference above, undersigned conducted course of ${inspectionData.subject.toLowerCase()} at ${inspectionData.stationCode} Railway Station on ${formattedDate}. During the course of checks, the deficiencies observed over Commercial Aspect were as follows:-`;

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

async function convertGeneralObservation(item: any, serialNumber: number, area: string, inspectionData: InspectionData): Promise<ObservationEntry> {
  // Convert general observations without AI
  const convertedText = generateGeneralObservationText(item, area);

  return {
    serialNumber: serialNumber.toString(),
    companyHeading: `${area.charAt(0).toUpperCase() + area.slice(1)} Inspection - Unit ${serialNumber}`,
    observations: convertedText.split('\n').filter(line => line.trim()),
    actionTakenBy: "SS/DEC\nCMI/DEE\nCMI/Ctg\nCOS/Ctg.",
    photographs: generatePhotographsText(inspectionData.attachedFiles),
    imageFiles: getImageFiles(inspectionData.attachedFiles)
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

async function convertNewCateringCompanyObservation(company: any, serialNumber: number, inspectionData: InspectionData, actionTaken?: string): Promise<ObservationEntry> {
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
    actionTakenBy: actionTaken || "COS Ctg",
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
    return "As per annexure";
  }
  
  // Filter for image files only
  const imageFiles = attachedFiles.filter(file => 
    file.fileType.startsWith('image/') || 
    file.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  );
  
  if (imageFiles.length === 0) {
    return "As per annexure";
  }
  
  if (imageFiles.length === 1) {
    return `Photo: ${imageFiles[0].fileName}`;
  }
  
  return `Photos: ${imageFiles.map(f => f.fileName).join(', ')}`;
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
          ] : convertedDoc.signatures.length === 2 ? [
            // Two inspectors: 2-column table, each column contains name and designation of one inspector
            new Table({
              rows: [
                new TableRow({
                  children: convertedDoc.signatures.map((signature, index) => {
                    const lines = signature.split('\n');
                    const name = lines[0] || '';
                    const designation = lines[1] || '';
                    
                    // First inspector: right-aligned, Second inspector: center-aligned
                    const alignment = index === 0 ? AlignmentType.RIGHT : AlignmentType.CENTER;
                    
                    return new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: name, bold: true, size: 22 })],
                          alignment: alignment,
                          spacing: { after: 50 }
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: designation, size: 20 })],
                          alignment: alignment,
                          spacing: { after: 50 }
                        })
                      ],
                      width: { size: 50, type: WidthType.PERCENTAGE },
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
              width: { size: 100, type: WidthType.PERCENTAGE }
            })
          ] : [
            // Three or more inspectors: table format with 2 columns (Name, Designation)
            new Table({
              rows: convertedDoc.signatures.map((signature, index) => {
                const lines = signature.split('\n');
                const name = lines[0] || '';
                const designation = lines[1] || '';
                
                // Determine alignment based on inspector order: 1st=right, 2nd=center, 3rd+=left
                const alignment = 
                  index === 0 ? AlignmentType.RIGHT :
                  index === 1 ? AlignmentType.CENTER :
                  AlignmentType.LEFT;
                
                return new TableRow({
                  children: [
                    // Name column
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: name, bold: true, size: 22 })],
                          alignment: alignment,
                          spacing: { after: 50 }
                        })
                      ],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      margins: { top: 100, bottom: 50, left: 100, right: 100 },
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE }
                      }
                    }),
                    // Designation column
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: designation, size: 20 })],
                          alignment: alignment,
                          spacing: { after: 50 }
                        })
                      ],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 100, left: 100, right: 100 },
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE }
                      }
                    })
                  ]
                });
              }),
              width: { size: 100, type: WidthType.PERCENTAGE }
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