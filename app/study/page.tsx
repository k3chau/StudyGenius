"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight, RotateCcw, CheckCircle } from "lucide-react"
import { FlashcardComponent } from "@/components/flashcard"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Define the Flashcard interface locally
interface Flashcard {
  id: string
  front: string
  back: string
  known: boolean | null
}

interface StudySet {
  id: string
  title: string
  description: string
  flashcards: Flashcard[] // Use the local interface
  createdAt: string
}

export default function StudyPage() {
  const router = useRouter()
  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [reviewQueue, setReviewQueue] = useState<number[]>([])
  const [completedCards, setCompletedCards] = useState<number[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [allStudySets, setAllStudySets] = useState<StudySet[]>([])
  const [showManageModal, setShowManageModal] = useState(false)

  useEffect(() => {
    // Load study set from localStorage
    const currentStudySetId = localStorage.getItem("currentStudySetId");
    const studySetsJSON = localStorage.getItem("studySets");
    const oldStudySetJSON = localStorage.getItem("studySet"); // Check for old format
    
    // Handle migration from old format to new format
    if (oldStudySetJSON && (!studySetsJSON || JSON.parse(studySetsJSON).length === 0)) {
      try {
        const oldStudySet = JSON.parse(oldStudySetJSON);
        
        // Generate an ID for the old study set
        const migratedSet = {
          ...oldStudySet,
          id: `set-${Date.now()}`
        };
        
        // Create a new array with this set
        const newStudySets = [migratedSet];
        
        // Save to localStorage in new format
        localStorage.setItem("studySets", JSON.stringify(newStudySets));
        localStorage.setItem("currentStudySetId", migratedSet.id);
        
        // Clean up old format
        localStorage.removeItem("studySet");
        
        // Update state
        setAllStudySets(newStudySets);
        setStudySet(migratedSet);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Failed to migrate old study set format:", e);
      }
    }
    
    // Continue with regular loading logic for new format
    if (studySetsJSON) {
      try {
        const studySets = JSON.parse(studySetsJSON);
        
        // Validate that studySets is an array
        if (!Array.isArray(studySets)) {
          console.error("studySets is not an array:", studySets);
          setIsLoading(false);
          return;
        }
        
        setAllStudySets(studySets);
        
        if (studySets.length > 0) {
          // Find the current study set by ID, or use the most recent one
          const currentSet = currentStudySetId 
            ? studySets.find((set) => set.id === currentStudySetId) 
            : studySets[studySets.length - 1];
          
          if (currentSet) {
            setStudySet(currentSet);
          } else {
            console.error("Could not find study set with ID:", currentStudySetId);
            // If specific ID not found, default to most recent
            setStudySet(studySets[studySets.length - 1]);
          }
        }
      } catch (e) {
        console.error("Failed to parse study sets from localStorage:", e);
      }
    }
    setIsLoading(false);
  }, []);

  const handleKnown = (known: boolean) => {
    if (!studySet) return

    const updatedFlashcards = [...studySet.flashcards]
    updatedFlashcards[currentIndex] = {
      ...updatedFlashcards[currentIndex],
      known,
    }

    const updatedStudySet = {
      ...studySet,
      flashcards: updatedFlashcards,
    }

    setStudySet(updatedStudySet)
    
    // Update this study set in the full collection
    const updatedSets = allStudySets.map(set => 
      set.id === studySet.id ? updatedStudySet : set
    );
    setAllStudySets(updatedSets);
    
    // Save all updated sets back to localStorage
    localStorage.setItem("studySets", JSON.stringify(updatedSets));

    // If thumbs down, add to review queue to see again later
    if (!known && !reviewQueue.includes(currentIndex)) {
      setReviewQueue([...reviewQueue, currentIndex])
    }

    // Add to completed cards
    if (!completedCards.includes(currentIndex)) {
      setCompletedCards([...completedCards, currentIndex])
    }

    // Move to the next card
    moveToNextCard()
  }

  const moveToNextCard = useCallback(() => {
    // If we're at the end of the deck
    if (currentIndex >= studySet!.flashcards.length - 1) {
      // If there are cards to review, move to the first one in the queue
      if (reviewQueue.length > 0) {
        const nextReviewIndex = reviewQueue[0]
        setCurrentIndex(nextReviewIndex)
        setReviewQueue(reviewQueue.slice(1))
      } else {
        // All cards have been reviewed
        setIsCompleted(true)
      }
      return
    }

    // Move to the next card in the deck
    setCurrentIndex(currentIndex + 1)
  }, [currentIndex, reviewQueue, studySet])

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    moveToNextCard()
  }

  const handleReset = () => {
    if (!studySet) return

    const resetFlashcards = studySet.flashcards.map((card) => ({
      ...card,
      known: null,
    }))

    const resetStudySet = {
      ...studySet,
      flashcards: resetFlashcards,
    }

    setStudySet(resetStudySet)
    
    // Update this study set in the full collection
    const updatedSets = allStudySets.map(set => 
      set.id === studySet.id ? resetStudySet : set
    );
    setAllStudySets(updatedSets);
    
    // Save all updated sets back to localStorage
    localStorage.setItem("studySets", JSON.stringify(updatedSets));
    
    setCurrentIndex(0)
    setReviewQueue([])
    setCompletedCards([])
    setIsCompleted(false)
  }

  const getProgress = () => {
    if (!studySet) return 0
    const totalCards = studySet.flashcards.length
    const uniqueAnswered = new Set(completedCards).size
    return (uniqueAnswered / totalCards) * 100
  }

  // Function to switch to a different study set
  const switchStudySet = (studySetId: string) => {
    // Save current progress before switching
    if (studySet) {
      const updatedSets = allStudySets.map(set => 
        set.id === studySet.id ? studySet : set
      );
      localStorage.setItem("studySets", JSON.stringify(updatedSets));
    }
    
    // Find and load the selected study set
    const selectedSet = allStudySets.find(set => set.id === studySetId);
    if (selectedSet) {
      setStudySet(selectedSet);
      setCurrentIndex(0);
      setReviewQueue([]);
      setCompletedCards([]);
      setIsCompleted(false);
      
      // Update current study set ID in localStorage
      localStorage.setItem("currentStudySetId", studySetId);
    }
  }

  // Function to delete a study set
  const deleteStudySet = (idToDelete: string) => {
    // Filter out the set to delete
    const updatedSets = allStudySets.filter(set => set.id !== idToDelete);
    
    // Update state
    setAllStudySets(updatedSets);
    
    // Update localStorage
    if (updatedSets.length > 0) {
      localStorage.setItem("studySets", JSON.stringify(updatedSets));
      
      // If we deleted the current set, load another one
      if (studySet?.id === idToDelete) {
        const newSet = updatedSets[0];
        setStudySet(newSet);
        setCurrentIndex(0);
        setReviewQueue([]);
        setCompletedCards([]);
        setIsCompleted(false);
        localStorage.setItem("currentStudySetId", newSet.id);
      }
    } else {
      // No more sets left, clear localStorage
      localStorage.removeItem("studySets");
      localStorage.removeItem("currentStudySetId");
      
      // Redirect to create page
      router.push("/create");
    }
    
    // Close the modal
    setShowManageModal(false);
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-12 flex items-center justify-center">
        <p>Loading study set...</p>
      </div>
    )
  }

  if (!studySet) {
    return <EmptyState onCreateNew={() => router.push("/create")} />
  }

  // Render completion screen
  if (isCompleted) {
    return (
      <div className="container max-w-4xl py-12">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Study Session Completed!</CardTitle>
            <CardDescription>You've gone through all the flashcards in this study set.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {studySet.flashcards.filter((card) => card.known !== null).length} of {studySet.flashcards.length}{" "}
                  cards
                </span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Known cards:</strong> {studySet.flashcards.filter((card) => card.known === true).length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Cards to review:</strong> {studySet.flashcards.filter((card) => card.known === false).length}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleReset} className="w-full max-w-xs">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset and Study Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold tracking-tight">{studySet.title}</h1>
            
            <div className="flex items-center space-x-4">
              {/* Study Set Selector */}
              {allStudySets.length > 1 && (
                <div className="flex items-center">
                  <label htmlFor="study-set-selector" className="mr-2 text-sm font-medium">
                    Study Sets:
                  </label>
                  <select
                    id="study-set-selector"
                    value={studySet.id}
                    onChange={(e) => switchStudySet(e.target.value)}
                    className="rounded-md border border-gray-300 py-1 px-3 text-sm"
                  >
                    {allStudySets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Manage Sets Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowManageModal(true)}
              >
                Manage Sets
              </Button>
            </div>
          </div>
          
          {studySet.description && <p className="text-gray-500 dark:text-gray-400 mt-2">{studySet.description}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>
              {new Set(completedCards).size} of {studySet.flashcards.length} cards
            </span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>

        <div className="flex flex-col items-center space-y-6">
          <div className="w-full">
            {/* Ensure flashcard exists before rendering */}
            {studySet && studySet.flashcards && studySet.flashcards.length > currentIndex && (
              <FlashcardComponent 
                key={`${studySet.id}-${currentIndex}`} 
                flashcard={studySet.flashcards[currentIndex]} 
              />
            )}
          </div>

          <div className="flex items-center justify-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => handleKnown(false)} className="h-12 w-12 rounded-full">
              <ThumbsDown className="h-6 w-6 text-red-500" />
              <span className="sr-only">I don't know this</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleKnown(true)} className="h-12 w-12 rounded-full">
              <ThumbsUp className="h-6 w-6 text-green-500" />
              <span className="sr-only">I know this</span>
            </Button>
          </div>

          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === studySet.flashcards.length - 1 && reviewQueue.length === 0}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Card {currentIndex + 1} of {studySet.flashcards.length}
          </div>
          {reviewQueue.length > 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <span>Cards to review: {reviewQueue.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Management Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Manage Study Sets</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowManageModal(false)}
              >
                &times;
              </Button>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {allStudySets.map(set => (
                <div key={set.id} className="border-b py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{set.title}</p>
                    <p className="text-sm text-gray-500">
                      {set.flashcards.length} cards • Created {new Date(set.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        switchStudySet(set.id);
                        setShowManageModal(false);
                      }}
                    >
                      Study
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => deleteStudySet(set.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => setShowManageModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

