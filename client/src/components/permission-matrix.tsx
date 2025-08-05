import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Eye, Edit, Trash2, Plus, Search, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  category: string;
}

interface UserPermission {
  userId: string;
  permissionId: string;
  granted: boolean;
  grantedBy: string;
  grantedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  stationSection: string;
}

interface PermissionMatrixData {
  users: User[];
  permissions: Permission[];
  userPermissions: UserPermission[];
}

const PERMISSION_CATEGORIES = [
  'Inspection Management',
  'User Management',
  'Report Generation',
  'System Administration',
  'Data Access'
];

const INSPECTION_AREAS = [
  'Catering',
  'Sanitation',
  'Publicity',
  'UTS/PRS',
  'Parking'
];

const DEFAULT_PERMISSIONS: Omit<Permission, 'id'>[] = [
  // Inspection Management
  { resource: 'inspections', action: 'create', description: 'Create new inspections', category: 'Inspection Management' },
  { resource: 'inspections', action: 'view_own', description: 'View own inspections', category: 'Inspection Management' },
  { resource: 'inspections', action: 'view_all', description: 'View all inspections', category: 'Inspection Management' },
  { resource: 'inspections', action: 'edit_own', description: 'Edit own inspections', category: 'Inspection Management' },
  { resource: 'inspections', action: 'edit_all', description: 'Edit all inspections', category: 'Inspection Management' },
  { resource: 'inspections', action: 'delete', description: 'Delete inspections', category: 'Inspection Management' },
  { resource: 'inspections', action: 'approve', description: 'Approve/Reject inspections', category: 'Inspection Management' },
  
  // Area-specific permissions
  ...INSPECTION_AREAS.map(area => ({
    resource: `inspections_${area.toLowerCase()}`,
    action: 'access',
    description: `Access ${area} inspections`,
    category: 'Inspection Management'
  })),
  
  // User Management
  { resource: 'users', action: 'view', description: 'View user list', category: 'User Management' },
  { resource: 'users', action: 'create', description: 'Create new users', category: 'User Management' },
  { resource: 'users', action: 'edit', description: 'Edit user details', category: 'User Management' },
  { resource: 'users', action: 'approve', description: 'Approve pending users', category: 'User Management' },
  { resource: 'users', action: 'deactivate', description: 'Deactivate users', category: 'User Management' },
  { resource: 'permissions', action: 'manage', description: 'Manage user permissions', category: 'User Management' },
  
  // Report Generation
  { resource: 'reports', action: 'generate', description: 'Generate inspection reports', category: 'Report Generation' },
  { resource: 'reports', action: 'export_pdf', description: 'Export reports as PDF', category: 'Report Generation' },
  { resource: 'reports', action: 'view_analytics', description: 'View analytics dashboard', category: 'Report Generation' },
  
  // System Administration
  { resource: 'system', action: 'settings', description: 'Manage system settings', category: 'System Administration' },
  { resource: 'system', action: 'backup', description: 'Perform system backups', category: 'System Administration' },
  { resource: 'system', action: 'logs', description: 'View system logs', category: 'System Administration' },
  
  // Data Access
  { resource: 'data', action: 'export', description: 'Export system data', category: 'Data Access' },
  { resource: 'data', action: 'import', description: 'Import data into system', category: 'Data Access' },
  { resource: 'shortlisted_items', action: 'manage', description: 'Manage shortlisted items', category: 'Data Access' }
];

export default function PermissionMatrix() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch permission matrix data
  const { data: matrixData, isLoading, error } = useQuery<PermissionMatrixData>({
    queryKey: ['/api/admin/permission-matrix'],
    enabled: true
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Matrix Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-red-600 mb-4">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <p>Failed to load permission matrix data.</p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reload Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ userId, permissionId, granted }: { userId: string; permissionId: string; granted: boolean }) => {
      const url = `/api/admin/permissions/${userId}/${permissionId}`;
      if (granted) {
        return apiRequest(url, 'POST');
      } else {
        return apiRequest(url, 'DELETE');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permission-matrix'] });
      toast({
        title: "Permission Updated",
        description: "User permission has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update permission. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Initialize permissions mutation
  const initializePermissionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/initialize-permissions', 'POST', { permissions: DEFAULT_PERMISSIONS });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permission-matrix'] });
      toast({
        title: "Permissions Initialized",
        description: "Default permissions have been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error initializing permissions:", error);
      toast({
        title: "Error",
        description: "Failed to initialize permissions. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter functions
  const filteredUsers = matrixData?.users?.filter(user => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.stationSection.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  }) || [];

  const filteredPermissions = matrixData?.permissions?.filter(permission => {
    return selectedCategory === 'all' || permission.category === selectedCategory;
  }) || [];

  // Helper function to check if user has permission
  const hasPermission = (userId: string, permissionId: string): boolean => {
    return matrixData?.userPermissions?.some(
      up => up.userId === userId && up.permissionId === permissionId && up.granted
    ) || false;
  };

  // Handle permission toggle
  const handlePermissionToggle = (userId: string, permissionId: string, currentValue: boolean) => {
    updatePermissionMutation.mutate({
      userId,
      permissionId,
      granted: !currentValue
    });
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'cmi': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nr-navy mx-auto mb-2"></div>
          <p className="text-gray-600">Loading permission matrix...</p>
        </div>
      </div>
    );
  }

  if (!matrixData?.permissions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Matrix Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Permissions Found</h3>
          <p className="text-gray-600 mb-4">
            Initialize the permission system to start managing user access controls.
          </p>
          <Button 
            onClick={() => initializePermissionsMutation.mutate()}
            disabled={initializePermissionsMutation.isPending}
            className="bg-nr-navy hover:bg-nr-navy/90"
          >
            {initializePermissionsMutation.isPending ? 'Initializing...' : 'Initialize Permissions'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Matrix
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage user permissions across different resources and actions
          </p>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Name, email, or station..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="role">Filter by Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cmi">CMI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Permission Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {PERMISSION_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('all');
                  setSelectedCategory('all');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-max">
              {/* Header Row */}
              <div className="grid grid-cols-[250px,repeat(auto-fit,minmax(120px,1fr))] border-b bg-gray-50">
                <div className="p-4 font-semibold sticky left-0 bg-gray-50 border-r">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Users ({filteredUsers.length})
                  </div>
                </div>
                {filteredPermissions.map(permission => (
                  <div key={permission.id} className="p-2 text-xs font-medium text-center border-r">
                    <div className="writing-mode-vertical transform -rotate-90 whitespace-nowrap">
                      {permission.description}
                    </div>
                  </div>
                ))}
              </div>

              {/* User Rows */}
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className="grid grid-cols-[250px,repeat(auto-fit,minmax(120px,1fr))] border-b hover:bg-gray-50"
                >
                  {/* User Info */}
                  <div className="p-4 sticky left-0 bg-white border-r">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                          {user.role.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">{user.stationSection}</span>
                      </div>
                    </div>
                  </div>

                  {/* Permission Toggles */}
                  {filteredPermissions.map(permission => {
                    const hasAccess = hasPermission(user.id, permission.id);
                    return (
                      <div key={permission.id} className="p-4 flex items-center justify-center border-r">
                        <Switch
                          checked={hasAccess}
                          onCheckedChange={() => handlePermissionToggle(user.id, permission.id, hasAccess)}
                          disabled={updatePermissionMutation.isPending}
                          className="data-[state=checked]:bg-nr-navy"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Permission Categories</h4>
              <div className="space-y-2">
                {PERMISSION_CATEGORIES.map(category => (
                  <div key={category} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-nr-navy"></div>
                    <span className="text-sm">{category}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Role Indicators</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">ADMIN</Badge>
                  <span className="text-sm">System Administrator</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">CMI</Badge>
                  <span className="text-sm">Commercial Inspector</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}