"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { FileUploader } from "@/components/file-uploader"
import { toast } from "@/components/ui/use-toast"

// Add Image import
import Image from "next/image"

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [textContent, setTextContent] = useState("")
  const [numCards, setNumCards] = useState([10])
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("text")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)

    try {
      // Create FormData to send both text and file content
      const formData = new FormData()
      
      // Add text content if available
      if (textContent) {
        formData.append('text', textContent)
      }
      
      // Add file if available
      if (activeTab === "file" && uploadedFile) {
        formData.append('file', uploadedFile)
      }
      
      // Add number of cards to generate
      formData.append('count', numCards[0].toString())
      
      // Send to backend API
      const response = await fetch('http://localhost:3001/generate-flashcards', {
        method: 'POST',
        body: formData,
      })
      
      // Handle error response
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          // Try to parse as JSON if possible
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown server error' };
        }
        
        throw new Error(errorData.error || errorData.message || 'Failed to generate flashcards');
      }
      
      // Get flashcards from response
      let flashcards;
      try {
        flashcards = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        throw new Error('Invalid response format received from server');
      }

      if (!flashcards || flashcards.length === 0) {
        throw new Error('No flashcards were generated')
      }

      // Generate a unique ID for this study set
      const newStudySetId = `set-${Date.now()}`;
      
      const newStudySet = {
        id: newStudySetId,
        title,
        description,
        flashcards,
        createdAt: new Date().toISOString(),
      };
      
      // Get existing study sets array or create a new one
      const existingStudySetsJSON = localStorage.getItem("studySets");
      let studySets = [];
      
      if (existingStudySetsJSON) {
        try {
          studySets = JSON.parse(existingStudySetsJSON);
          if (!Array.isArray(studySets)) {
            studySets = [];
          }
        } catch (e) {
          console.error("Error parsing study sets:", e);
          studySets = [];
        }
      }
      
      // Add new study set to the array
      studySets.push(newStudySet);
      
      // Store updated array in localStorage
      localStorage.setItem("studySets", JSON.stringify(studySets));
      
      // Set this as the current study set
      localStorage.setItem("currentStudySetId", newStudySetId);

      // Navigate to study page
      router.push("/study")
    } catch (error) {
      console.error("Error generating flashcards:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate flashcards",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Study Set</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Upload your lecture materials and generate flashcards for studying.
          </p>
          {/* Add this section right after the <h1> and description paragraph in the first <div> */}
          <div className="relative w-full h-48 rounded-lg overflow-hidden mb-6">
            <Image
              src="/images/dashboard.png"
              alt="Student studying with notebook and laptop"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Study Set Details</CardTitle>
              <CardDescription>
                Give your study set a title and description to help you remember what it's about.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Biology Chapter 5"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for your study set"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Add your lecture material to generate flashcards.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="file">File Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">Lecture Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Paste your lecture notes or content here"
                      className="min-h-[200px]"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      required={activeTab === "text"}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="file" className="space-y-4 pt-4">
                  <FileUploader onFileSelected={setUploadedFile} />
                  {uploadedFile && (
                    <p className="text-sm text-green-600">
                      File selected: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flashcard Settings</CardTitle>
              <CardDescription>Customize how many flashcards you want to generate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label htmlFor="num-cards">Number of Flashcards</Label>
                  <span className="text-sm font-medium">{numCards[0]}</span>
                </div>
                <Slider id="num-cards" min={5} max={50} step={5} value={numCards} onValueChange={setNumCards} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? "Generating Flashcards..." : "Generate Flashcards"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}

