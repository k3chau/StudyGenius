"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth0 } from "@auth0/auth0-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight, RotateCcw, CheckCircle } from "lucide-react"
import { FlashcardComponent } from "@/components/flashcard"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

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
  const { 
    isAuthenticated, 
    isLoading, 
    loginWithRedirect 
  } = useAuth0();
  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewQueue, setReviewQueue] = useState<number[]>([])
  const [completedCards, setCompletedCards] = useState<number[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [allStudySets, setAllStudySets] = useState<StudySet[]>([])
  const [showManageModal, setShowManageModal] = useState(false)

  const loadStudySets = useCallback(() => {
    const currentStudySetId = localStorage.getItem("currentStudySetId");
    const studySetsJSON = localStorage.getItem("studySets");
    const oldStudySetJSON = localStorage.getItem("studySet"); // Migration check

    if (oldStudySetJSON && (!studySetsJSON || JSON.parse(studySetsJSON).length === 0)) {
      try {
        const oldStudySet = JSON.parse(oldStudySetJSON);
        const migratedSet = { ...oldStudySet, id: `set-${Date.now()}` };
        const newStudySets = [migratedSet];
        localStorage.setItem("studySets", JSON.stringify(newStudySets));
        localStorage.setItem("currentStudySetId", migratedSet.id);
        localStorage.removeItem("studySet");
        setAllStudySets(newStudySets);
        setStudySet(migratedSet);
        return; // Exit after migration
      } catch (e) {
        console.error("Failed to migrate old study set format:", e);
      }
    }

    if (studySetsJSON) {
      try {
        const parsedSets = JSON.parse(studySetsJSON);
        if (Array.isArray(parsedSets)) {
          setAllStudySets(parsedSets);
          if (parsedSets.length > 0) {
            const currentSet = currentStudySetId 
              ? parsedSets.find((set) => set.id === currentStudySetId) 
              : parsedSets[parsedSets.length - 1]; // Default to last set
            
            setStudySet(currentSet || parsedSets[parsedSets.length - 1]); // Fallback if ID not found
          }
        }
      } catch (e) {
        console.error("Failed to parse study sets:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadStudySets();
    }
  }, [isLoading, isAuthenticated, loadStudySets]);

  const handleKnown = (known: boolean) => {
    if (!studySet) return

    const updatedFlashcards = [...studySet.flashcards]
    updatedFlashcards[currentIndex] = { ...updatedFlashcards[currentIndex], known }
    const updatedStudySet = { ...studySet, flashcards: updatedFlashcards }
    setStudySet(updatedStudySet)

    const updatedSets = allStudySets.map(set => set.id === studySet.id ? updatedStudySet : set)
    setAllStudySets(updatedSets)
    localStorage.setItem("studySets", JSON.stringify(updatedSets))

    if (!known && !reviewQueue.includes(currentIndex)) {
      setReviewQueue([...reviewQueue, currentIndex])
    }
    if (!completedCards.includes(currentIndex)) {
      setCompletedCards([...completedCards, currentIndex])
    }
    moveToNextCard()
  }

  const moveToNextCard = useCallback(() => {
    if (!studySet) return;
    if (currentIndex >= studySet.flashcards.length - 1) {
      if (reviewQueue.length > 0) {
        const nextReviewIndex = reviewQueue[0]
        setCurrentIndex(nextReviewIndex)
        setReviewQueue(reviewQueue.slice(1))
      } else {
        setIsCompleted(true)
      }
      return
    }
    setCurrentIndex(currentIndex + 1)
  }, [currentIndex, reviewQueue, studySet])

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const handleNext = () => moveToNextCard()

  const handleReset = () => {
    if (!studySet) return
    const resetFlashcards = studySet.flashcards.map(card => ({ ...card, known: null }))
    const resetStudySet = { ...studySet, flashcards: resetFlashcards }
    setStudySet(resetStudySet)

    const updatedSets = allStudySets.map(set => set.id === studySet.id ? resetStudySet : set)
    setAllStudySets(updatedSets)
    localStorage.setItem("studySets", JSON.stringify(updatedSets))
    
    setCurrentIndex(0)
    setReviewQueue([])
    setCompletedCards([])
    setIsCompleted(false)
  }

  const getProgress = () => {
    if (!studySet) return 0
    const totalCards = studySet.flashcards.length
    const uniqueAnswered = new Set(completedCards).size
    return totalCards > 0 ? (uniqueAnswered / totalCards) * 100 : 0
  }

  const switchStudySet = (studySetId: string) => {
    const newSet = allStudySets.find(set => set.id === studySetId);
    if (newSet) {
        setStudySet(newSet);
        localStorage.setItem("currentStudySetId", studySetId);
        setCurrentIndex(0);
        setReviewQueue([]);
        setCompletedCards([]);
        setIsCompleted(false);
        setShowManageModal(false); 
    }
  };

  const deleteStudySet = (studySetId: string) => {
    const updatedSets = allStudySets.filter(set => set.id !== studySetId);
    setAllStudySets(updatedSets);
    localStorage.setItem("studySets", JSON.stringify(updatedSets));

    if (studySet?.id === studySetId) {
        const nextSet = updatedSets.length > 0 ? updatedSets[updatedSets.length - 1] : null;
        setStudySet(nextSet);
        localStorage.setItem("currentStudySetId", nextSet?.id || "");
        setCurrentIndex(0);
        setReviewQueue([]);
        setCompletedCards([]);
        setIsCompleted(false);
    }
    setShowManageModal(false);
  };

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
              Please log in to view or manage study sets.
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
              onClick={() => loginWithRedirect({ appState: { returnTo: '/study' } })}
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!studySet) {
    return <EmptyState onCreateNew={() => router.push('/create')} />;
  }

  const currentCard = studySet.flashcards[currentIndex];

  return (
    <div className="container max-w-3xl py-12">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => setShowManageModal(true)}>
          Manage Study Sets
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-2">{studySet.title}</h1>
      {studySet.description && <p className="text-muted-foreground mb-6">{studySet.description}</p>}

      {!isCompleted ? (
        <>
          <Progress value={getProgress()} className="mb-6" />
          <FlashcardComponent flashcard={currentCard} />
          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => handleKnown(false)}>
                <ThumbsDown className="mr-2 h-4 w-4" /> Didn't Know
              </Button>
              <Button variant="default" onClick={() => handleKnown(true)}>
                <ThumbsUp className="mr-2 h-4 w-4" /> Knew It
              </Button>
            </div>
            <Button variant="outline" onClick={handleNext} disabled={currentIndex >= studySet.flashcards.length - 1 && reviewQueue.length === 0}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-semibold">Study Session Complete!</h2>
            <p className="text-muted-foreground">
              You've reviewed all the cards in this set.
            </p>
            <Button onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Study Again
            </Button>
          </CardContent>
        </Card>
      )}

      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Manage Study Sets</CardTitle>
              <CardDescription>Select a set to study or delete existing sets.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[60vh] overflow-y-auto">
              {allStudySets.length > 0 ? (
                  <ul className="space-y-2">
                      {allStudySets.map(set => (
                          <li key={set.id} className="flex justify-between items-center p-2 border rounded">
                              <span>{set.title || 'Untitled Set'}</span>
                              <div className="space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => switchStudySet(set.id)} disabled={studySet?.id === set.id}>
                                      Study
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteStudySet(set.id)}>
                                      Delete
                                  </Button>
                              </div>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-center text-muted-foreground">No study sets found.</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={() => setShowManageModal(false)}>Close</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

