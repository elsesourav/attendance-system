"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FiPlus, FiEdit, FiTrash2, FiBook } from "react-icons/fi";
import { toast } from "sonner";

interface Stream {
  id: number;
  name: string;
  description: string | null;
  subjectCount: number;
  studentCount: number;
}

export default function TeacherStreams() {
  const { data: session } = useSession();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await fetch("/api/teacher/streams");
        if (response.ok) {
          const data = await response.json();
          setStreams(data);
        }
      } catch (error) {
        console.error("Error fetching streams:", error);
        toast.error("Failed to load streams");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();
  }, []);

  const handleDeleteStream = async (id: number) => {
    if (!confirm("Are you sure you want to delete this stream? This will also delete all subjects and attendance records associated with it.")) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/streams/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setStreams(streams.filter(stream => stream.id !== id));
        toast.success("Stream deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete stream");
      }
    } catch (error) {
      console.error("Error deleting stream:", error);
      toast.error("An error occurred while deleting the stream");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Streams</h1>
        <Link href="/teacher/streams/create">
          <Button>
            <FiPlus className="mr-2" />
            Create Stream
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading streams...</div>
      ) : streams.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">You haven't created any streams yet.</p>
          <Link href="/teacher/streams/create">
            <Button>
              <FiPlus className="mr-2" />
              Create Your First Stream
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <Card key={stream.id}>
              <CardHeader>
                <CardTitle>{stream.name}</CardTitle>
                <CardDescription>
                  {stream.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div>Subjects: {stream.subjectCount}</div>
                  <div>Students: {stream.studentCount}</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/teacher/streams/${stream.id}`}>
                  <Button variant="outline">
                    <FiBook className="mr-2" />
                    View
                  </Button>
                </Link>
                <div className="space-x-2">
                  <Link href={`/teacher/streams/${stream.id}/edit`}>
                    <Button variant="outline" size="icon">
                      <FiEdit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteStream(stream.id)}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
