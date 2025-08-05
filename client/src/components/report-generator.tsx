import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download,
  Settings,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Printer
} from 'lucide-react';

interface ReportOptions {
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  stations: string[];
  inspectionTypes: string[];
  includeCharts: boolean;
  chartTypes: string[];
  includeSummary: boolean;
  includePhotos: boolean;
  includeRecommendations: boolean;
  format: 'pdf' | 'excel' | 'both';
  template: 'standard' | 'executive' | 'detailed';
}

interface ReportGeneratorProps {
  inspections: any[];
  onGenerateReport: (options: ReportOptions) => Promise<void>;
}

export function ReportGenerator({ inspections, onGenerateReport }: ReportGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const [options, setOptions] = useState<ReportOptions>({
    title: 'Inspection Report',
    dateRange: {
      start: '',
      end: ''
    },
    stations: [],
    inspectionTypes: ['catering', 'sanitation', 'parking', 'publicity', 'uts_prs'],
    includeCharts: true,
    chartTypes: ['overview', 'trends', 'compliance'],
    includeSummary: true,
    includePhotos: true,
    includeRecommendations: true,
    format: 'pdf',
    template: 'standard'
  });

  const chartTypeOptions = [
    { value: 'overview', label: 'Overview Statistics', icon: BarChart3 },
    { value: 'trends', label: 'Trend Analysis', icon: TrendingUp },
    { value: 'compliance', label: 'Compliance Metrics', icon: PieChart },
    { value: 'stations', label: 'Station Comparison', icon: MapPin },
    { value: 'timeline', label: 'Timeline View', icon: Clock }
  ];

  const templateOptions = [
    { 
      value: 'standard', 
      label: 'Standard Railway Format',
      description: 'Official Northern Railway inspection report format with structured tables'
    },
    { 
      value: 'executive', 
      label: 'Executive Summary',
      description: 'High-level overview for management with key findings'
    },
    { 
      value: 'detailed', 
      label: 'Detailed Technical Analysis',
      description: 'Comprehensive technical report with charts and detailed observations'
    }
  ];

  const availableStations = Array.from(new Set(inspections.map(i => i.stationCode))).filter(Boolean);

  const handleGenerateReport = async () => {
    if (!options.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a report title.",
        variant: "destructive"
      });
      return;
    }

    if (!options.dateRange.start || !options.dateRange.end) {
      toast({
        title: "Date Range Required",
        description: "Please select start and end dates.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerateReport(options);
      toast({
        title: "Report Generated",
        description: "Your custom report has been generated successfully.",
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Report generation failed:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleChartType = (chartType: string) => {
    setOptions(prev => ({
      ...prev,
      chartTypes: prev.chartTypes.includes(chartType)
        ? prev.chartTypes.filter(t => t !== chartType)
        : [...prev.chartTypes, chartType]
    }));
  };

  const toggleStation = (station: string) => {
    setOptions(prev => ({
      ...prev,
      stations: prev.stations.includes(station)
        ? prev.stations.filter(s => s !== station)
        : [...prev.stations, station]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-nr-blue hover:bg-blue-800">
          <FileText className="mr-2" size={20} />
          Generate Report
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChart3 className="mr-2 text-nr-blue" size={24} />
            Custom Report Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  value={options.title}
                  onChange={(e) => setOptions(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter report title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={options.dateRange.start}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={options.dateRange.end}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Report Template</Label>
                <Select 
                  value={options.template} 
                  onValueChange={(value: 'standard' | 'executive' | 'detailed') => 
                    setOptions(prev => ({ ...prev, template: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateOptions.map(template => (
                      <SelectItem key={template.value} value={template.value}>
                        <div className="py-2">
                          <div className="font-medium text-sm">{template.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Standard format matches official Northern Railway inspection documents
                </p>
              </div>

              <div>
                <Label>Output Format</Label>
                <Select 
                  value={options.format} 
                  onValueChange={(value: 'pdf' | 'excel' | 'both') => 
                    setOptions(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="both">Both PDF & Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-base font-medium">Stations to Include</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-stations"
                      checked={options.stations.length === availableStations.length}
                      onCheckedChange={(checked) => {
                        setOptions(prev => ({
                          ...prev,
                          stations: checked ? availableStations : []
                        }));
                      }}
                    />
                    <Label htmlFor="all-stations" className="font-medium">All Stations</Label>
                  </div>
                  {availableStations.map(station => (
                    <div key={station} className="flex items-center space-x-2">
                      <Checkbox
                        id={`station-${station}`}
                        checked={options.stations.includes(station)}
                        onCheckedChange={() => toggleStation(station)}
                      />
                      <Label htmlFor={`station-${station}`}>{station}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Inspection Types</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: 'catering', label: 'Catering', icon: '🍽️' },
                    { value: 'sanitation', label: 'Sanitation', icon: '🧹' },
                    { value: 'parking', label: 'Parking', icon: '🅿️' },
                    { value: 'publicity', label: 'Publicity', icon: '📢' },
                    { value: 'uts_prs', label: 'UTS/PRS', icon: '🎫' }
                  ].map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={options.inspectionTypes.includes(type.value)}
                        onCheckedChange={(checked) => {
                          setOptions(prev => ({
                            ...prev,
                            inspectionTypes: checked 
                              ? [...prev.inspectionTypes, type.value]
                              : prev.inspectionTypes.filter(t => t !== type.value)
                          }));
                        }}
                      />
                      <Label htmlFor={`type-${type.value}`}>
                        <span className="mr-2">{type.icon}</span>
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visualization Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visualization Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-charts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeCharts: !!checked }))
                  }
                />
                <Label htmlFor="include-charts" className="font-medium">Include Charts & Graphs</Label>
              </div>

              {options.includeCharts && (
                <div className="ml-6 space-y-3">
                  <Label className="text-sm font-medium">Chart Types to Include:</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {chartTypeOptions.map(chart => {
                      const IconComponent = chart.icon;
                      return (
                        <div key={chart.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`chart-${chart.value}`}
                            checked={options.chartTypes.includes(chart.value)}
                            onCheckedChange={() => toggleChartType(chart.value)}
                          />
                          <Label htmlFor={`chart-${chart.value}`} className="flex items-center">
                            <IconComponent className="mr-2 text-nr-blue" size={16} />
                            {chart.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-summary"
                  checked={options.includeSummary}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeSummary: !!checked }))
                  }
                />
                <Label htmlFor="include-summary">Executive Summary</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-photos"
                  checked={options.includePhotos}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includePhotos: !!checked }))
                  }
                />
                <Label htmlFor="include-photos">Include Photos</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-recommendations"
                  checked={options.includeRecommendations}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeRecommendations: !!checked }))
                  }
                />
                <Label htmlFor="include-recommendations">Action Recommendations</Label>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="bg-nr-blue hover:bg-blue-800"
            >
              {isGenerating ? (
                <>
                  <Clock className="mr-2 animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2" size={20} />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}