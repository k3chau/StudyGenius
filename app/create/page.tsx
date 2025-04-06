"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth0 } from "@auth0/auth0-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { FileUploader } from "@/components/file-uploader"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

export default function CreatePage() {
  const router = useRouter()
  const { 
    isAuthenticated, 
    isLoading, 
    loginWithRedirect, 
    getAccessTokenSilently
  } = useAuth0()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [textContent, setTextContent] = useState("")
  const [numCards, setNumCards] = useState([10])
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("text")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
       toast({
         title: "Authentication Required",
         description: "Redirecting to login...",
         variant: "destructive",
       });
       loginWithRedirect({ appState: { returnTo: '/create' } }); 
    }
  }, [isLoading, isAuthenticated, loginWithRedirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
        toast({ title: "Error", description: "You must be logged in to create sets.", variant: "destructive" });
        return;
    }
    setIsGenerating(true)

    try {
      const accessToken = await getAccessTokenSilently()
      
      // Create FormData for the request
      const formData = new FormData()
      
      console.log("Active tab:", activeTab);
      
      if (activeTab === "text") {
        console.log("Adding text content:", textContent.substring(0, 100) + "...");
        formData.append('text', textContent)
      } else if (uploadedFile) {
        console.log("Adding file:", uploadedFile.name);
        formData.append('file', uploadedFile)
      }
      
      console.log("Adding card count:", numCards[0]);
      formData.append('count', numCards[0].toString())
      
      // Define the API URL
      const apiUrl = 'http://localhost:3000/api/generate-flashcards';
      console.log(`Making API request to: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        // Don't include Content-Type for FormData requests
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData,
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If parsing fails, use the raw text or default error
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      let flashcards;
      try {
        const responseData = await response.json();
        // Handle both array and object response formats
        flashcards = Array.isArray(responseData) ? responseData :
                    responseData.cards ? responseData.cards :
                    responseData.flashcards ? responseData.flashcards : null;
                    
        if (!flashcards || !Array.isArray(flashcards)) {
          throw new Error('Invalid flashcard data received from server');
        }
        
        // Ensure each flashcard has the required properties
        flashcards = flashcards.map((card, index) => ({
          id: `card-${Date.now()}-${index}`,
          front: card.front || card.question || 'Question not available',
          back: card.back || card.answer || 'Answer not available',
          known: null
        }));
      } catch (jsonError) {
        console.error("Error parsing flashcard JSON:", jsonError);
        throw new Error("Failed to parse flashcard data from server");
      }

      if (!flashcards || flashcards.length === 0) {
        throw new Error('No flashcards were generated');
      }

      const newStudySetId = `set-${Date.now()}`;
      
      const newStudySet = {
        id: newStudySetId,
        title,
        description,
        flashcards,
        createdAt: new Date().toISOString(),
      };
      
      const existingStudySetsJSON = localStorage.getItem("studySets");
      let studySets = existingStudySetsJSON ? JSON.parse(existingStudySetsJSON) : [];
      if (!Array.isArray(studySets)) studySets = [];
      
      studySets.push(newStudySet);
      
      localStorage.setItem("studySets", JSON.stringify(studySets));
      
      localStorage.setItem("currentStudySetId", newStudySetId);

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

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-12 flex items-center justify-center">
        <p>Loading authentication state...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-12 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to create study sets.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center p-6">
            <div className="relative w-full h-48 mb-6 rounded-lg overflow-hidden">
              <Image
                src="/images/dashboard.png"
                alt="Login required"
                fill
                className="object-cover"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => loginWithRedirect({ appState: { returnTo: '/create' } })}
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Study Set</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Upload your lecture materials and generate flashcards for studying.
          </p>
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

