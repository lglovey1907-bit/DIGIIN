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
    // Extract date and station information
    const inspectionDate = new Date(inspectionData.inspectionDate);
    const formattedDate = inspectionDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });

    // Generate subject line using AI
    const subjectPrompt = `Based on the following inspection data, generate an appropriate subject line for a Northern Railway inspection report:
    
Station: ${inspectionData.stationCode}
Area: ${inspectionData.area}
Date: ${formattedDate}
Original Subject: ${inspectionData.subject}

Format should be: "Sub: [Type of checks] on [area] at [Station Name] Railway Station."
Example: "Sub: Decoy Checks on Catering and vending stalls at Delhi Cantt Railway Station."`;

    const subjectResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: subjectPrompt }],
      max_tokens: 100,
    });

    const generatedSubject = subjectResponse.choices[0].message.content?.trim() || 
      `Sub: Inspection of ${inspectionData.area} facilities at ${inspectionData.stationCode} Railway Station.`;

    // Generate opening paragraph using AI
    const openingPrompt = `Generate an opening paragraph for a Northern Railway inspection report with these details:
    
Station: ${inspectionData.stationCode}
Date: ${formattedDate}
Area: ${inspectionData.area}

Use this template structure:
"As per reference above, undersigned conducted course of [inspection type] of [facilities] at [Station] Railway Station on [date]. During the course of [inspection type], the deficiencies observed over Commercial Aspect were as follows:-"

Make it sound professional and appropriate for the inspection type.`;

    const openingResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: openingPrompt }],
      max_tokens: 200,
    });

    const openingParagraph = openingResponse.choices[0].message.content?.trim() ||
      `As per reference above, undersigned conducted course of inspection of ${inspectionData.area} facilities at ${inspectionData.stationCode} Railway Station on ${formattedDate}. During the course of inspection, the deficiencies observed over Commercial Aspect were as follows:-`;

    // Convert observations to structured format
    const convertedObservations = await convertObservationsToDocument(inspectionData.observations);

    return {
      header: "Northern Railway",
      subject: generatedSubject,
      letterReference: inspectionData.letterReference || generateLetterReference(inspectionData),
      openingParagraph,
      observations: convertedObservations,
      signatures: generateSignatures(inspectionData)
    };

  } catch (error) {
    console.error("Error converting inspection to document:", error);
    throw new Error("Failed to convert inspection to document format");
  }
}

async function convertObservationsToDocument(observations: any): Promise<ObservationEntry[]> {
  if (!observations || typeof observations !== 'object') {
    return [];
  }

  const convertedEntries: ObservationEntry[] = [];
  let serialNumber = 1;

  // Handle different observation structures
  for (const [key, value] of Object.entries(observations)) {
    if (key.includes('catering') && Array.isArray(value)) {
      // Process catering observations
      for (const company of value as any[]) {
        if (company.companyName) {
          const entry = await convertCompanyObservation(company, serialNumber);
          convertedEntries.push(entry);
          serialNumber++;
        }
      }
    } else if (Array.isArray(value)) {
      // Process other area observations
      for (const item of value as any[]) {
        const entry = await convertGeneralObservation(item, serialNumber, key);
        convertedEntries.push(entry);
        serialNumber++;
      }
    }
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

  // Convert checkbox responses and details to English narrative
  const observationPrompt = `Convert the following catering inspection data into professional English narrative format for a Railway inspection report:

Company: ${company.companyName}
Vendor Details: ${JSON.stringify(company.vendorDetails || {})}
Documentation: ${JSON.stringify(company.documentation || {})}
Billing: ${JSON.stringify(company.billing || {})}
Items: ${JSON.stringify(company.items || {})}
Overcharging: ${JSON.stringify(company.overcharging || {})}
Additional Notes: ${company.additionalNotes || ''}

Convert checkbox responses (true/false) into elaborate English descriptions:
- If uniform is true: "was wearing proper uniform"
- If uniform is false: "was without proper uniform"
- If ID card is true: "with proper ID Card"
- If medical certificate is true: "& Medical Certificate"
- Convert billing machine status into proper sentences
- Convert overcharging detection into professional statements
- List unapproved items in proper format

Format as numbered points:
1. Name of vendor and compliance status
2. Overcharging detection results
3. Billing machine status and bill issuance
4. Unapproved items selling (if any)

Keep the tone professional and consistent with Railway inspection reports.`;

  const conversionResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: observationPrompt }],
    max_tokens: 500,
  });

  const convertedText = conversionResponse.choices[0].message.content?.trim() || 
    generateFallbackObservation(company);

  return {
    serialNumber: serialNumber.toString(),
    companyHeading,
    observations: convertedText.split('\n').filter(line => line.trim()),
    actionTakenBy: "SS/DEC\nCMI/DEE\nCMI/Ctg\nCOS/Ctg.",
    photographs: "As per annexure"
  };
}

async function convertGeneralObservation(item: any, serialNumber: number, area: string): Promise<ObservationEntry> {
  const observationPrompt = `Convert the following ${area} inspection data into professional English narrative format for a Railway inspection report:

Data: ${JSON.stringify(item)}
Area: ${area}

Convert into proper English sentences describing the observations and deficiencies found.
Keep the tone professional and consistent with Railway inspection reports.`;

  const conversionResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: observationPrompt }],
    max_tokens: 300,
  });

  const convertedText = conversionResponse.choices[0].message.content?.trim() || 
    `Inspection of ${area} area - ${JSON.stringify(item)}`;

  return {
    serialNumber: serialNumber.toString(),
    companyHeading: `${area.charAt(0).toUpperCase() + area.slice(1)} Inspection - Unit ${serialNumber}`,
    observations: convertedText.split('\n').filter(line => line.trim()),
    actionTakenBy: "SS/DEC\nCMI/DEE\nCMI/Ctg\nCOS/Ctg.",
    photographs: "As per annexure"
  };
}

function generateFallbackObservation(company: any): string {
  const vendorName = company.vendorDetails?.vendorName || 'Unknown vendor';
  const uniform = company.vendorDetails?.uniform ? 'with proper uniform' : 'without proper uniform';
  const idCard = company.documentation?.idCard ? 'with proper ID Card' : 'without ID Card';
  const medical = company.documentation?.medicalCertificate ? '& Medical Certificate' : '& without Medical Certificate';
  
  return `1. ${vendorName} was found working in the said stall ${uniform}, ${idCard} ${medical}.
2. No case of overcharging was detected.
3. Electronic billing machine status needs verification.
4. Various items were observed for compliance check.`;
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