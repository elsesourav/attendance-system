'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle } from 'lucide-react';

interface Stream {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  stream_id: number;
}

interface DataCleanupProps {
  streams: Stream[];
  subjects: Subject[];
}

export function DataCleanup({ streams, subjects }: DataCleanupProps) {
  const { data: session } = useSession();
  const [cleanupType, setCleanupType] = useState<'attendance' | 'subjects' | 'inactive_students'>('attendance');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [beforeDate, setBeforeDate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const isTeacher = session?.user?.role === 'teacher';

  if (!isTeacher) {
    return null;
  }

  const filteredSubjects = subjects.filter(
    (subject) => subject.stream_id === parseInt(selectedStreamId)
  );

  const handleCleanup = async () => {
    if (!selectedStreamId && (cleanupType === 'attendance' || cleanupType === 'subjects')) {
      toast.error('Please select a stream');
      return;
    }

    if (!beforeDate) {
      toast.error('Please select a date');
      return;
    }

    setIsProcessing(true);

    try {
      const payload: any = {
        type: cleanupType,
        beforeDate,
      };

      if (cleanupType === 'attendance' || cleanupType === 'subjects') {
        payload.streamId = parseInt(selectedStreamId);
      }

      if (cleanupType === 'attendance' && selectedSubjectId) {
        payload.subjectId = parseInt(selectedSubjectId);
      }

      const response = await fetch('/api/cleanup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clean up data');
      }

      toast.success(data.message || 'Data cleaned up successfully');
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error cleaning up data:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while cleaning up data');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCleanupDescription = () => {
    switch (cleanupType) {
      case 'attendance':
        return `This will delete all attendance records before ${beforeDate}${
          selectedStreamId ? ` for the selected stream` : ''
        }${selectedSubjectId ? ` and subject` : ''}.`;
      case 'subjects':
        return `This will delete all subjects in the selected stream that haven't been used for attendance since ${beforeDate}.`;
      case 'inactive_students':
        return `This will delete all students who haven't attended any classes since ${beforeDate}.`;
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Cleanup</CardTitle>
        <CardDescription>
          Remove old or unused data from the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="attendance" onValueChange={(value) => setCleanupType(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="inactive_students">Inactive Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendance" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="stream-select">Select Stream</Label>
              <Select
                value={selectedStreamId}
                onValueChange={setSelectedStreamId}
              >
                <SelectTrigger id="stream-select">
                  <SelectValue placeholder="Select a stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id.toString()}>
                      {stream.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedStreamId && filteredSubjects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subject-select">Select Subject (Optional)</Label>
                <Select
                  value={selectedSubjectId}
                  onValueChange={setSelectedSubjectId}
                >
                  <SelectTrigger id="subject-select">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All subjects</SelectItem>
                    {filteredSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="before-date">Delete Records Before</Label>
              <Input
                id="before-date"
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="subjects" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="stream-select-subjects">Select Stream</Label>
              <Select
                value={selectedStreamId}
                onValueChange={setSelectedStreamId}
              >
                <SelectTrigger id="stream-select-subjects">
                  <SelectValue placeholder="Select a stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((stream) => (
                    <SelectItem key={stream.id} value={stream.id.toString()}>
                      {stream.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="before-date-subjects">Delete Subjects Unused Since</Label>
              <Input
                id="before-date-subjects"
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="inactive_students" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="before-date-students">Delete Students Inactive Since</Label>
              <Input
                id="before-date-students"
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={
                isProcessing || 
                !beforeDate || 
                ((cleanupType === 'attendance' || cleanupType === 'subjects') && !selectedStreamId)
              }
            >
              Clean Up Data
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Confirm Data Cleanup
              </DialogTitle>
              <DialogDescription>
                {getCleanupDescription()}
                <p className="mt-2 font-semibold text-yellow-600">
                  This action cannot be undone. Are you sure you want to proceed?
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleCleanup} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Confirm Cleanup'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
