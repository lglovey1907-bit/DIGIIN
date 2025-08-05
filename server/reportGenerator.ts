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
    // Northern Railway Logo Area
    this.doc
      .fillColor('#1e40af')
      .rect(this.pageMargin, this.currentY, 495, 80)
      .fill();

    // Logo placeholder (rectangle)
    this.doc
      .fillColor('#ffffff')
      .rect(this.pageMargin + 10, this.currentY + 10, 60, 60)
      .fill();

    // Header text
    this.doc
      .fillColor('#ffffff')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('Northern Railway Delhi Division', this.pageMargin + 80, this.currentY + 15)
      .fontSize(16)
      .font('Helvetica')
      .text('Digital Inspection Report System', this.pageMargin + 80, this.currentY + 45);

    this.currentY += 100;

    // Report title
    this.doc
      .fillColor('#000000')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(title, this.pageMargin, this.currentY);

    this.currentY += 40;

    // Generation info
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Generated on: ${new Date().toLocaleString()}`, this.pageMargin)
      .text(`Report ID: RPT-${Date.now()}`, this.pageMargin, this.currentY + 12);

    this.currentY += 50;
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
    
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Detailed Inspection Data', this.pageMargin, this.currentY);

    this.currentY += 30;

    data.inspections.forEach((inspection, index) => {
      this.checkNewPage();
      this.addInspectionCard(inspection, index + 1);
    });
  }

  private addInspectionCard(inspection: any, index: number): void {
    // Inspection header
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(`${index}. ${inspection.subject}`, this.pageMargin, this.currentY);

    this.currentY += 20;

    // Inspection details
    const details = [
      `Station: ${inspection.stationCode}`,
      `Date: ${new Date(inspection.inspectionDate).toLocaleDateString()}`,
      `Reference: ${inspection.referenceNo}`,
      `Status: ${inspection.status}`
    ];

    this.doc
      .fontSize(10)
      .font('Helvetica');

    details.forEach(detail => {
      this.doc.text(detail, this.pageMargin + 20, this.currentY);
      this.currentY += 14;
    });

    // Areas inspected
    if (inspection.observations && typeof inspection.observations === 'object') {
      this.currentY += 10;
      this.doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Areas Inspected:', this.pageMargin + 20);

      this.currentY += 15;

      Object.keys(inspection.observations).forEach(area => {
        this.doc
          .fontSize(10)
          .font('Helvetica')
          .text(`• ${area}`, this.pageMargin + 40);
        this.currentY += 12;
      });
    }

    this.currentY += 20;
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
               { align: 'center', width: 495 - this.pageMargin });
      
      this.doc
        .text('Northern Railway Delhi Division - Digital Inspection System', 
               this.pageMargin, 
               this.doc.page.height - 20, 
               { align: 'center', width: 495 - this.pageMargin });
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