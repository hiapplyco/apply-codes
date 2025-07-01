# Project Integration System Documentation

## Overview

The Apply platform now features a comprehensive project management system that allows users to organize all their recruitment activities under unified projects. This system ensures that every tool in the platform can associate its data with a specific project, providing better organization and tracking capabilities.

## Architecture

### Core Components

1. **TypeScript Types** (`/src/types/project.ts`)
   - `Project` - Main project interface
   - `ProjectCandidate` - Junction table interface
   - `CreateProjectInput` - Project creation DTO
   - `UpdateProjectInput` - Project update DTO

2. **React Hooks** (`/src/hooks/useProjects.ts`)
   - Centralized project management logic
   - Handles CRUD operations
   - Manages selected project state
   - Persists selection in localStorage

3. **Context Provider** (`/src/context/ProjectContext.tsx`)
   - App-wide project state management
   - Provides project data to all components
   - Wrapped around the entire app in `App.tsx`

4. **UI Components** (`/src/components/project/ProjectSelector.tsx`)
   - Reusable dropdown selector
   - Inline project creation
   - Visual project identification (colors & icons)

## Database Schema

### Projects Table
```sql
CREATE TABLE public.projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#8B5CF6',
    icon TEXT DEFAULT 'folder',
    candidates_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Associated Tables with Project Support
- `search_history` - Boolean searches and results
- `saved_candidates` - Candidate profiles (via junction table)
- `interview_sessions` - Interview preparation data
- `kickoff_calls` - Kickoff call summaries
- `meetings` - Screening room sessions
- `chat_sessions` - AI chat conversations
- `jobs` - Job postings
- `agent_outputs` - AI-generated analysis

## Implementation Guide

### Adding ProjectSelector to a Page

1. **Import the component and styles**:
```tsx
import { ProjectSelector } from "@/components/project/ProjectSelector";
```

2. **Add the selector to your page**:
```tsx
<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
  <ProjectSelector 
    label="Select project for this activity"
    placeholder="Choose a project (optional)"
    className="max-w-md"
  />
</div>
```

3. **Access selected project in your component**:
```tsx
import { useProjectContext } from "@/context/ProjectContext";

function YourComponent() {
  const { selectedProjectId } = useProjectContext();
  
  // Use selectedProjectId when saving data
}
```

### Saving Data with Project Association

1. **In hooks or API calls**:
```tsx
const { selectedProjectId } = useProjectContext();

const saveData = async (data: YourDataType) => {
  const { error } = await supabase
    .from('your_table')
    .insert({
      ...data,
      project_id: selectedProjectId // Include project association
    });
};
```

2. **In edge functions**:
```tsx
// Pass projectId as parameter
const result = await processJobRequirements(
  content, 
  searchType, 
  companyName, 
  userId, 
  source,
  selectedProjectId // Add project parameter
);
```

## User Flow

1. **Project Selection**
   - User selects a project from dropdown at top of any tool page
   - Selection persists across navigation
   - Can create new projects inline without leaving current workflow

2. **Data Association**
   - All activities are automatically associated with selected project
   - Users can change projects at any time
   - Data remains associated with original project

3. **Project Management**
   - View all project data in Search History & Projects page
   - See aggregated statistics per project
   - Export project data (candidates, searches, etc.)

## API Reference

### useProjects Hook

```tsx
const {
  projects,           // Array of user's projects
  loading,           // Loading state
  selectedProjectId, // Currently selected project ID
  selectedProject,   // Full project object
  setSelectedProjectId,
  createProject,     // Create new project
  updateProject,     // Update existing project
  archiveProject,    // Soft delete project
  refetch           // Refresh projects list
} = useProjects();
```

### ProjectSelector Props

```tsx
interface ProjectSelectorProps {
  onProjectChange?: (projectId: string | null) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  label?: string;
  size?: 'default' | 'sm' | 'lg';
}
```

## Best Practices

1. **Always check for project selection** when saving critical data
2. **Use optional project association** - not all activities require a project
3. **Handle project deletion gracefully** - use `ON DELETE SET NULL` in foreign keys
4. **Show project context** in UI when displaying associated data
5. **Allow bulk operations** per project (export, archive, etc.)

## Security Considerations

1. **Row Level Security (RLS)** ensures users can only see their own projects
2. **Foreign key constraints** maintain data integrity
3. **Cascading deletes** are avoided to prevent data loss
4. **Project access** is validated in both frontend and backend

## Migration Guide

For existing data without project associations:

1. **Searches**: Can be retroactively assigned to projects via UI
2. **Candidates**: Already support project assignment via save dialog
3. **Other data**: Will be associated with projects going forward

## Future Enhancements

1. **Project Templates** - Pre-configured projects for common hiring scenarios
2. **Project Sharing** - Collaborate with team members
3. **Project Analytics** - Advanced insights per project
4. **Bulk Operations** - Apply actions to all items in a project
5. **Project Archival** - Complete project lifecycle management

## Troubleshooting

### Common Issues

1. **Project not persisting**: Check localStorage permissions
2. **Data not associating**: Verify selectedProjectId is passed correctly
3. **Projects not loading**: Check Supabase RLS policies

### Debug Commands

```tsx
// Check current project in console
const { selectedProjectId } = useProjectContext();
console.log('Current project:', selectedProjectId);

// Verify project association in data
const { data } = await supabase
  .from('your_table')
  .select('*, projects(*)')
  .eq('id', recordId);
```

## Component Status

### ✅ Completed (June 29, 2025)
- **Global Infrastructure**
  - TypeScript types and interfaces
  - `useProjects` custom hook
  - `ProjectContext` provider
  - `ProjectSelector` component
  
- **Tool Integrations**
  - ✅ Sourcing page - searches saved with project
  - ✅ Interview Prep - sessions linked to projects
  - ✅ Screening Room - meetings associated with projects
  - ✅ Content Creation - job posts linked to projects
  - ✅ Kickoff Call - kickoff data saved to projects
  - ✅ Search History - existing project support enhanced
  
- **Backend Updates**
  - Database migration adding `project_id` to all relevant tables
  - Updated edge functions to accept project parameters
  - Enhanced RLS policies for project-based access control
  - Project data aggregation functions

### 📋 Planned Features
- **Chat Assistant Integration** - Link chat sessions to projects
- **Project Templates** - Pre-configured projects for common scenarios
- **Bulk Operations** - Export, archive, or modify multiple items
- **Project Sharing** - Collaborate with team members
- **Advanced Analytics** - Project-specific insights and metrics
- **Project Timeline** - Visual representation of project activities

## Implementation Summary

The project integration system is now fully operational across all major tools in the Apply platform. Users can:

1. **Select a project** at the top of any tool page
2. **All activities** are automatically associated with the selected project
3. **View project data** aggregated in the Search History & Projects page
4. **Create projects inline** without leaving their workflow
5. **Persist selection** across navigation sessions

This provides a unified way to organize all recruitment activities, making it easy to manage multiple hiring initiatives simultaneously.