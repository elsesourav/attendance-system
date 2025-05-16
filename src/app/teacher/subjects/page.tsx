"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FiSearch, FiEdit, FiEye, FiUsers, FiCalendar } from "react-icons/fi";
import { toast } from "sonner";

interface Subject {
  id: number;
  name: string;
  description: string | null;
  streamName: string;
  streamId: number;
  studentCount: number;
}

export default function TeacherSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch("/api/teacher/subjects");
        if (!response.ok) {
          throw new Error("Failed to fetch subjects");
        }
        
        const data = await response.json();
        setSubjects(data);
        setFilteredSubjects(data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load subjects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    // Filter subjects based on search term
    if (searchTerm.trim() === "") {
      setFilteredSubjects(subjects);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = subjects.filter(
        subject => 
          subject.name.toLowerCase().includes(term) || 
          subject.description?.toLowerCase().includes(term) ||
          subject.streamName.toLowerCase().includes(term)
      );
      setFilteredSubjects(filtered);
    }
  }, [searchTerm, subjects]);

  if (isLoading) {
    return <div className="text-center py-10">Loading subjects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Subjects</h1>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <FiSearch className="text-muted-foreground" />
        <Input
          placeholder="Search subjects by name, description, or stream"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-10 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No subjects match your search" : "No subjects found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id}>
              <CardHeader>
                <CardTitle>{subject.name}</CardTitle>
                <CardDescription>
                  Stream: {subject.streamName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {subject.description || "No description provided"}
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>Students: {subject.studentCount}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="space-x-2">
                  <Link href={`/teacher/subjects/${subject.id}`}>
                    <Button variant="outline" size="sm">
                      <FiEye className="mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/teacher/subjects/${subject.id}/students`}>
                    <Button variant="outline" size="sm">
                      <FiUsers className="mr-2" />
                      Students
                    </Button>
                  </Link>
                </div>
                <div className="space-x-2">
                  <Link href={`/teacher/subjects/${subject.id}/attendance`}>
                    <Button variant="outline" size="sm">
                      <FiCalendar className="mr-2" />
                      Attendance
                    </Button>
                  </Link>
                  <Link href={`/teacher/subjects/${subject.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <FiEdit className="mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
