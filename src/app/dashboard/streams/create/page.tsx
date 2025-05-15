'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CreateStreamPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not a teacher
  if (status === 'authenticated' && session?.user?.role !== 'teacher') {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error('Stream name is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create stream');
      }
      
      toast.success('Stream created successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating stream:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while creating the stream');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Stream</h1>
        <p className="text-muted-foreground">Create a new class or course stream</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Stream Details</CardTitle>
          <CardDescription>
            Enter the details for your new stream
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Stream Name</Label>
              <Input
                id="name"
                placeholder="e.g., Mathematics 101"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide a brief description of this stream"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Link href="/dashboard">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Stream'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
