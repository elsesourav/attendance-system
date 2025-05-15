'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash, Edit, Plus } from 'lucide-react';
import { Loading } from '@/components/loading';

interface Subject {
  id: number;
  name: string;
  description: string;
  stream_id: number;
  created_at: string;
}

interface SubjectManagerProps {
  streamId: number;
  streamName: string;
}

export function SubjectManager({ streamId, streamName }: SubjectManagerProps) {
  const { data: session } = useSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const isTeacher = session?.user?.role === 'teacher';

  useEffect(() => {
    fetchSubjects();
  }, [streamId]);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/subjects?streamId=${streamId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }
      
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      toast.error('Subject name is required');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSubjectName,
          description: newSubjectDescription,
          streamId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subject');
      }
      
      toast.success('Subject created successfully');
      setNewSubjectName('');
      setNewSubjectDescription('');
      fetchSubjects();
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while creating the subject');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!currentSubject || !newSubjectName.trim()) {
      toast.error('Subject name is required');
      return;
    }
    
    setIsEditing(true);
    
    try {
      const response = await fetch(`/api/subjects/${currentSubject.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSubjectName,
          description: newSubjectDescription,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subject');
      }
      
      toast.success('Subject updated successfully');
      setCurrentSubject(null);
      fetchSubjects();
    } catch (error) {
      console.error('Error updating subject:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while updating the subject');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!currentSubject) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/subjects/${currentSubject.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete subject');
      }
      
      toast.success('Subject deleted successfully');
      setCurrentSubject(null);
      setDeleteDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while deleting the subject');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllSubjects = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/subjects?streamId=${streamId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete subjects');
      }
      
      toast.success('All subjects deleted successfully');
      setDeleteAllDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subjects:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while deleting subjects');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (subject: Subject) => {
    setCurrentSubject(subject);
    setNewSubjectName(subject.name);
    setNewSubjectDescription(subject.description || '');
  };

  const openDeleteDialog = (subject: Subject) => {
    setCurrentSubject(subject);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subjects in {streamName}</h2>
        {isTeacher && (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Create a new subject for this stream.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject-name">Subject Name</Label>
                    <Input
                      id="subject-name"
                      placeholder="e.g., Data Structures"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject-description">Description (Optional)</Label>
                    <Textarea
                      id="subject-description"
                      placeholder="Enter a description for this subject"
                      value={newSubjectDescription}
                      onChange={(e) => setNewSubjectDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setNewSubjectName('');
                    setNewSubjectDescription('');
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubject} disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Subject'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {subjects.length > 0 && (
              <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete All
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete All Subjects</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete all subjects in this stream? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteAllDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAllSubjects} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete All Subjects'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>
      
      {subjects.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No subjects found in this stream.</p>
          {isTeacher && (
            <p className="mt-2">Click the "Add Subject" button to create your first subject.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Card key={subject.id}>
              <CardHeader>
                <CardTitle>{subject.name}</CardTitle>
                {subject.description && (
                  <CardDescription>{subject.description}</CardDescription>
                )}
              </CardHeader>
              {isTeacher && (
                <CardFooter className="flex justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(subject)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Subject</DialogTitle>
                        <DialogDescription>
                          Update the subject details.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-subject-name">Subject Name</Label>
                          <Input
                            id="edit-subject-name"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-subject-description">Description (Optional)</Label>
                          <Textarea
                            id="edit-subject-description"
                            value={newSubjectDescription}
                            onChange={(e) => setNewSubjectDescription(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCurrentSubject(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateSubject} disabled={isEditing}>
                          {isEditing ? 'Updating...' : 'Update Subject'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(subject)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the subject "{currentSubject?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
