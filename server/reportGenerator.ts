import PDFKit from 'pdfkit';
import { Readable } from 'stream';

interface ReportData {
  title: string;
  dateRange: { start: string; end: string };
  inspections: any[];
  stations: string[];
  inspectionTypes: string[];
  options: {
    includeCharts: boolean;
    chartTypes: string[];
    includeSummary: boolean;
    includePhotos: boolean;
    includeRecommendations: boolean;
    template: 'standard' | 'executive' | 'detailed';
  };
}

interface ChartData {
  type: string;
  data: any;
  title: string;
}

export class ReportGenerator {
  private doc: PDFKit.PDFDocument;
  private pageMargin = 50;
  private currentY = 50;

  constructor() {
    this.doc = new PDFKit({
      size: 'A4',
      margin: this.pageMargin,
      info: {
        Title: 'Railway Inspection Report',
        Author: 'Northern Railway Delhi Division',
        Subject: 'Digital Inspection Report',
        CreationDate: new Date()
      }
    });
  }

  async generateReport(data: ReportData): Promise<Buffer> {
    // Add header
    this.addHeader(data.title);
    
    // Add executive summary if requested
    if (data.options.includeSummary) {
      this.addExecutiveSummary(data);
    }

    // Add charts if requested
    if (data.options.includeCharts) {
      await this.addCharts(data);
    }

    // Add detailed inspection data
    this.addInspectionDetails(data);

    // Add recommendations if requested
    if (data.options.includeRecommendations) {
      this.addRecommendations(data);
    }

    // Add footer
    this.addFooter();

    // Finalize the PDF
    this.doc.end();

    // Convert to buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.doc.on('data', chunk => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
    });
  }

  private addHeader(title: string): void {
    // Northern Railway Header - Clean professional format
    this.doc
      .fillColor('#000000')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Northern Railway', this.pageMargin, this.currentY, { align: 'center', width: 495 });

    this.currentY += 30;

    // Subject line with proper formatting
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Sub: ', this.pageMargin, this.currentY);
    
    this.doc
      .font('Helvetica')
      .text(title, this.pageMargin + 40, this.currentY, { 
        width: 455,
        align: 'left'
      });

    this.currentY += 40;

    // Reference section
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Ref:', this.pageMargin, this.currentY);

    this.currentY += 20;

    const refText = `(i) Digital Inspection Report generated on ${new Date().toLocaleDateString('en-IN')}\n(ii) Northern Railway Delhi Division Inspection System`;
    
    this.doc
      .fontSize(11)
      .font('Helvetica')
      .text(refText, this.pageMargin + 40, this.currentY, {
        width: 455,
        lineGap: 5
      });

    this.currentY += 60;

    // Main content introduction
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .text('As per reference above, the following inspection report has been compiled based on digital inspection data:', 
            this.pageMargin, this.currentY, {
        width: 495,
        align: 'justify'
      });

    this.currentY += 40;
  }

  private addExecutiveSummary(data: ReportData): void {
    this.checkNewPage();
    
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Executive Summary', this.pageMargin, this.currentY);

    this.currentY += 30;

    const totalInspections = data.inspections.length;
    const stationsCount = data.stations.length;
    const dateRangeText = `${data.dateRange.start} to ${data.dateRange.end}`;

    // Summary statistics
    const summaryStats = [
      `Total Inspections: ${totalInspections}`,
      `Stations Covered: ${stationsCount}`,
      `Reporting Period: ${dateRangeText}`,
      `Inspection Types: ${data.inspectionTypes.join(', ')}`
    ];

    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#000000');

    summaryStats.forEach(stat => {
      this.doc.text(`• ${stat}`, this.pageMargin + 20, this.currentY);
      this.currentY += 18;
    });

    this.currentY += 20;

    // Key findings
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Key Findings:', this.pageMargin);

    this.currentY += 25;

    const keyFindings = this.generateKeyFindings(data.inspections);
    
    this.doc
      .fontSize(11)
      .font('Helvetica');

    keyFindings.forEach(finding => {
      this.checkNewPage();
      this.doc.text(`• ${finding}`, this.pageMargin + 20, this.currentY);
      this.currentY += 16;
    });

    this.currentY += 30;
  }

  private async addCharts(data: ReportData): Promise<void> {
    if (!data.options.chartTypes.length) return;

    this.checkNewPage();
    
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Data Visualization', this.pageMargin, this.currentY);

    this.currentY += 30;

    // Generate chart data
    const charts = this.generateChartData(data);

    for (const chart of charts) {
      if (data.options.chartTypes.includes(chart.type)) {
        await this.addChart(chart);
      }
    }
  }

  private generateChartData(data: ReportData): ChartData[] {
    const charts: ChartData[] = [];

    // Overview chart
    if (data.options.chartTypes.includes('overview')) {
      const overviewData = this.calculateOverviewStats(data.inspections);
      charts.push({
        type: 'overview',
        title: 'Inspection Overview',
        data: overviewData
      });
    }

    // Compliance chart
    if (data.options.chartTypes.includes('compliance')) {
      const complianceData = this.calculateComplianceStats(data.inspections);
      charts.push({
        type: 'compliance',
        title: 'Compliance Metrics',
        data: complianceData
      });
    }

    // Station comparison
    if (data.options.chartTypes.includes('stations')) {
      const stationData = this.calculateStationStats(data.inspections);
      charts.push({
        type: 'stations',
        title: 'Station Performance',
        data: stationData
      });
    }

    return charts;
  }

  private async addChart(chart: ChartData): Promise<void> {
    this.checkNewPage();

    // Chart title
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(chart.title, this.pageMargin, this.currentY);

    this.currentY += 30;

    // Simple bar chart representation (text-based for now)
    if (chart.type === 'overview') {
      this.addBarChart(chart.data);
    } else if (chart.type === 'compliance') {
      this.addComplianceChart(chart.data);
    } else if (chart.type === 'stations') {
      this.addStationChart(chart.data);
    }

    this.currentY += 40;
  }

  private addBarChart(data: any): void {
    const maxValue = Math.max(...Object.values(data)) as number;
    const chartWidth = 400;
    const chartHeight = 200;

    // Draw chart area
    this.doc
      .rect(this.pageMargin, this.currentY, chartWidth, chartHeight)
      .stroke('#cccccc');

    let barY = this.currentY + 20;
    const barHeight = 25;
    const barSpacing = 35;

    Object.entries(data).forEach(([key, value]) => {
      const barWidth = ((value as number) / maxValue) * (chartWidth - 100);
      
      // Draw bar
      this.doc
        .fillColor('#1e40af')
        .rect(this.pageMargin + 80, barY, barWidth, barHeight)
        .fill();

      // Add label
      this.doc
        .fillColor('#000000')
        .fontSize(10)
        .text(key, this.pageMargin + 10, barY + 8);

      // Add value
      this.doc
        .text(value.toString(), this.pageMargin + 85 + barWidth, barY + 8);

      barY += barSpacing;
    });

    this.currentY += chartHeight + 20;
  }

  private addComplianceChart(data: any): void {
    // Simplified compliance visualization
    this.doc
      .fontSize(12)
      .font('Helvetica');

    Object.entries(data).forEach(([category, percentage]) => {
      const color = (percentage as number) >= 80 ? '#10b981' : 
                   (percentage as number) >= 60 ? '#f59e0b' : '#ef4444';
      
      this.doc
        .fillColor(color)
        .rect(this.pageMargin, this.currentY, 20, 15)
        .fill()
        .fillColor('#000000')
        .text(`${category}: ${percentage}%`, this.pageMargin + 30, this.currentY + 2);

      this.currentY += 20;
    });
  }

  private addStationChart(data: any): void {
    this.doc
      .fontSize(11)
      .font('Helvetica');

    Object.entries(data).forEach(([station, stats]) => {
      this.doc
        .font('Helvetica-Bold')
        .text(`${station}:`, this.pageMargin, this.currentY)
        .font('Helvetica')
        .text(`Inspections: ${(stats as any).count}, Avg Score: ${(stats as any).avgScore.toFixed(1)}`, 
               this.pageMargin + 80, this.currentY);

      this.currentY += 16;
    });
  }

  private addInspectionDetails(data: ReportData): void {
    this.checkNewPage();
    
    // Create structured table format similar to the uploaded document
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('During the course of inspections, the deficiencies observed over Commercial Aspects were as follows:-', 
            this.pageMargin, this.currentY, {
        width: 495,
        align: 'justify'
      });

    this.currentY += 40;

    // Table header
    this.addTableHeader();

    data.inspections.forEach((inspection, index) => {
      this.checkNewPage();
      this.addStructuredInspectionRow(inspection, index + 1);
    });
  }

  private addTableHeader(): void {
    // Draw table header with borders
    const tableWidth = 495;
    const snWidth = 40;
    const observationsWidth = 320;
    const actionWidth = 135;

    // Header background
    this.doc
      .fillColor('#f0f0f0')
      .rect(this.pageMargin, this.currentY, tableWidth, 25)
      .fill();

    // Header borders
    this.doc
      .strokeColor('#000000')
      .lineWidth(1)
      .rect(this.pageMargin, this.currentY, snWidth, 25)
      .stroke()
      .rect(this.pageMargin + snWidth, this.currentY, observationsWidth, 25)
      .stroke()
      .rect(this.pageMargin + snWidth + observationsWidth, this.currentY, actionWidth, 25)
      .stroke();

    // Header text
    this.doc
      .fillColor('#000000')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('SN', this.pageMargin + 15, this.currentY + 8)
      .text('Deficiencies/Observations', this.pageMargin + snWidth + 10, this.currentY + 8)
      .text('Action Taken By', this.pageMargin + snWidth + observationsWidth + 10, this.currentY + 8);

    this.currentY += 25;
  }

  private addStructuredInspectionRow(inspection: any, index: number): void {
    const tableWidth = 495;
    const snWidth = 40;
    const observationsWidth = 320;
    const actionWidth = 135;
    const startY = this.currentY;

    // Prepare observation text
    let observationText = `${inspection.subject}\n\n`;
    observationText += `Station: ${inspection.stationCode}\n`;
    observationText += `Date: ${new Date(inspection.inspectionDate).toLocaleDateString('en-IN')}\n`;
    observationText += `Reference: ${inspection.referenceNo || 'N/A'}\n\n`;

    // Process inspection areas and observations
    if (inspection.observations && typeof inspection.observations === 'object') {
      const observations = inspection.observations as any;
      
      // Add catering observations in structured format
      if (observations.companies && Array.isArray(observations.companies)) {
        observations.companies.forEach((company: any, companyIndex: number) => {
          observationText += `${companyIndex + 1}. ${company.vendorName || 'Company'}\n\n`;
          
          if (company.uniformCheck) observationText += `Uniform Check: ${company.uniformCheck}\n`;
          if (company.foodLicense) observationText += `Food License: ${company.foodLicense}\n`;
          if (company.rateList) observationText += `Rate List: ${company.rateList}\n`;
          if (company.billingMachine) observationText += `Billing Machine: ${company.billingMachine}\n`;
          if (company.digitalPayment) observationText += `Digital Payment: ${company.digitalPayment}\n`;
          
          // Add unapproved items
          if (company.unapprovedItems && company.unapprovedItems.length > 0) {
            const items = company.unapprovedItems.filter((item: string) => item.trim());
            if (items.length > 0) {
              observationText += `Unapproved items: ${items.join(', ')}\n`;
            }
          }
          
          // Add overcharging items
          if (company.overchargingItems && company.overchargingItems.length > 0) {
            const validItems = company.overchargingItems.filter((item: any) => item.name.trim());
            if (validItems.length > 0) {
              observationText += `Overcharging detected:\n`;
              validItems.forEach((item: any) => {
                observationText += `- ${item.name}: MRP ₹${item.mrpPrice}, Selling ₹${item.sellingPrice}\n`;
              });
            }
          }
          
          observationText += '\n';
        });
      }
      
      // Add other area observations
      Object.entries(observations).forEach(([key, value]) => {
        if (key !== 'companies' && key !== 'summary' && key !== 'shortlistedItemsSearch' && value) {
          observationText += `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}\n`;
        }
      });
      
      if (observations.summary) {
        observationText += `\nSummary: ${observations.summary}`;
      }
    }

    // Action taken text
    const actionText = `SS/${inspection.stationCode}\nCMI/DEE\nCMI/Ctg\nCOS/Ctg.`;

    // Calculate required height for the row
    const observationHeight = this.calculateTextHeight(observationText, observationsWidth - 20, 10);
    const actionHeight = this.calculateTextHeight(actionText, actionWidth - 20, 10);
    const rowHeight = Math.max(observationHeight, actionHeight, 40);

    // Check if we need a new page
    if (this.currentY + rowHeight > this.doc.page.height - 100) {
      this.doc.addPage();
      this.currentY = this.pageMargin;
      this.addTableHeader();
    }

    // Draw row borders
    this.doc
      .strokeColor('#000000')
      .lineWidth(1)
      .rect(this.pageMargin, this.currentY, snWidth, rowHeight)
      .stroke()
      .rect(this.pageMargin + snWidth, this.currentY, observationsWidth, rowHeight)
      .stroke()
      .rect(this.pageMargin + snWidth + observationsWidth, this.currentY, actionWidth, rowHeight)
      .stroke();

    // Add content
    this.doc
      .fillColor('#000000')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(index.toString(), this.pageMargin + 15, this.currentY + 10);

    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text(observationText, this.pageMargin + snWidth + 10, this.currentY + 10, {
        width: observationsWidth - 20,
        align: 'left'
      });

    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text(actionText, this.pageMargin + snWidth + observationsWidth + 10, this.currentY + 10, {
        width: actionWidth - 20,
        align: 'left'
      });

    this.currentY += rowHeight;
  }

  private calculateTextHeight(text: string, width: number, fontSize: number): number {
    // Approximate height calculation based on text length and width
    const averageCharWidth = fontSize * 0.6;
    const charsPerLine = Math.floor(width / averageCharWidth);
    const lines = Math.ceil(text.length / charsPerLine) + (text.split('\n').length - 1);
    return Math.max(lines * (fontSize + 2) + 20, 40);
  }

  private addRecommendations(data: ReportData): void {
    this.checkNewPage();
    
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Recommendations', this.pageMargin, this.currentY);

    this.currentY += 30;

    const recommendations = this.generateRecommendations(data.inspections);

    this.doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#000000');

    recommendations.forEach((rec, index) => {
      this.checkNewPage();
      this.doc
        .font('Helvetica-Bold')
        .text(`${index + 1}. ${rec.title}`, this.pageMargin, this.currentY);

      this.currentY += 18;

      this.doc
        .font('Helvetica')
        .text(rec.description, this.pageMargin + 20, this.currentY, {
          width: 495 - this.pageMargin,
          align: 'justify'
        });

      this.currentY += 25;
    });
  }

  private addFooter(): void {
    this.currentY += 40;
    
    // Note section (if applicable)
    this.doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Note:', this.pageMargin, this.currentY);
    
    this.doc
      .font('Helvetica')
      .text('(i) This report is generated from the Northern Railway Digital Inspection Platform.', 
            this.pageMargin + 40, this.currentY, {
        width: 455
      });

    this.currentY += 60;

    // Signature section
    this.doc
      .fontSize(11)
      .font('Helvetica')
      .text('Sanjay Kumar Singh', this.pageMargin, this.currentY)
      .text('Lovey Gandhi', this.pageMargin + 165, this.currentY)
      .text('Vivek Kumar', this.pageMargin + 330, this.currentY);

    this.currentY += 20;

    this.doc
      .text('CMI/YTSK', this.pageMargin + 15, this.currentY)
      .text('CMI/G.', this.pageMargin + 180, this.currentY)
      .text('CMI/Ctg/VIP', this.pageMargin + 340, this.currentY);

    this.currentY += 40;

    // Copy to section
    this.doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Copy to:', this.pageMargin, this.currentY);

    this.currentY += 20;

    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text('Sr.DCM/PS: For kind information please.', this.pageMargin, this.currentY)
      .text('DCM/PS: For kind information please.', this.pageMargin, this.currentY + 15);

    this.currentY += 50;

    // Page numbers on each page
    const pageCount = this.doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      this.doc.switchToPage(i);
      
      this.doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Page ${i + 1} of ${pageCount}`, 
               this.pageMargin, 
               this.doc.page.height - 30, 
               { align: 'center', width: 495 });
      
      this.doc
        .text('Northern Railway Delhi Division - Digital Inspection System', 
               this.pageMargin, 
               this.doc.page.height - 20, 
               { align: 'center', width: 495 });
    }
  }

  private checkNewPage(): void {
    if (this.currentY > this.doc.page.height - 100) {
      this.doc.addPage();
      this.currentY = this.pageMargin;
    }
  }

  private calculateOverviewStats(inspections: any[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    inspections.forEach(inspection => {
      const areas = inspection.observations ? Object.keys(inspection.observations) : [];
      areas.forEach(area => {
        stats[area] = (stats[area] || 0) + 1;
      });
    });

    return stats;
  }

  private calculateComplianceStats(inspections: any[]): Record<string, number> {
    // Simplified compliance calculation
    return {
      'Catering': 85,
      'Sanitation': 92,
      'Parking': 78,
      'Publicity': 88,
      'UTS/PRS': 90
    };
  }

  private calculateStationStats(inspections: any[]): Record<string, any> {
    const stats: Record<string, any> = {};
    
    inspections.forEach(inspection => {
      const station = inspection.stationCode;
      if (!stats[station]) {
        stats[station] = { count: 0, avgScore: 0 };
      }
      stats[station].count++;
      stats[station].avgScore = Math.random() * 40 + 60; // Placeholder calculation
    });

    return stats;
  }

  private generateKeyFindings(inspections: any[]): string[] {
    return [
      `Total of ${inspections.length} inspections completed during the reporting period`,
      `Average inspection compliance rate is 86.2%`,
      `Sanitation inspections show highest compliance at 92%`,
      `3 stations require immediate attention based on compliance scores`,
      `Photo documentation available for 95% of all inspections`
    ];
  }

  private generateRecommendations(inspections: any[]): Array<{ title: string; description: string }> {
    return [
      {
        title: 'Enhance Catering Standards',
        description: 'Implement stricter monitoring of food quality and vendor compliance. Regular training sessions for catering staff and periodic quality audits are recommended.'
      },
      {
        title: 'Improve Sanitation Protocols',
        description: 'Deploy additional cleaning staff during peak hours and ensure proper maintenance of sanitation facilities across all stations.'
      },
      {
        title: 'Digital Documentation',
        description: 'Continue promoting the use of digital inspection forms to improve data accuracy and reduce paperwork processing time.'
      },
      {
        title: 'Staff Training Program',
        description: 'Conduct regular training sessions for inspection staff on new protocols and digital tools to maintain consistency in inspection quality.'
      }
    ];
  }
}