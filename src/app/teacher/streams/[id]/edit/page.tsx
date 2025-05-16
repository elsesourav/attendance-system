"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "sonner";

interface StreamData {
  id: number;
  name: string;
  description: string | null;
}

export default function EditStream() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await fetch(`/api/teacher/streams/${streamId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Stream not found");
            router.push("/teacher/streams");
            return;
          }
          throw new Error("Failed to fetch stream");
        }
        
        const data: StreamData = await response.json();
        setFormData({
          name: data.name,
          description: data.description || "",
        });
      } catch (error) {
        console.error("Error fetching stream:", error);
        toast.error("Failed to load stream data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStream();
  }, [streamId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/teacher/streams/${streamId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Stream updated successfully");
        router.push(`/teacher/streams/${streamId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update stream");
      }
    } catch (error) {
      console.error("Error updating stream:", error);
      toast.error("An error occurred while updating the stream");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading stream data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.push(`/teacher/streams/${streamId}`)}
        >
          <FiArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Stream</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Stream Details</CardTitle>
            <CardDescription>
              Update your stream information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Stream Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Computer Science"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a brief description of this stream"
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/teacher/streams/${streamId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
