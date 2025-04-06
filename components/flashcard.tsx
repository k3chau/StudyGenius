"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Undo } from "lucide-react"

// Define the Flashcard interface locally
interface Flashcard {
  id: string;
  front: string;
  back: string;
  known: boolean | null;
}

interface FlashcardComponentProps {
  flashcard: Flashcard // Use the local interface
  resetOnChange?: boolean // Add option to control reset behavior
}

export function FlashcardComponent({ flashcard, resetOnChange = true }: FlashcardComponentProps) {
  console.log("FlashcardComponent received:", flashcard);
  
  // Add state for handling the flip
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Reset to question side when flashcard changes
  useEffect(() => {
    if (resetOnChange) {
      setIsFlipped(false);
    }
  }, [flashcard.id, resetOnChange]);
  
  // Function to toggle the flip state
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };
  
  return (
    <div className="perspective-1000 w-full">
      <div 
        className={`relative transition-transform duration-500 transform-style-3d min-h-[300px] w-full cursor-pointer ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        onClick={handleFlip}
      >
        {/* Front of card */}
        <Card className={`absolute w-full h-full backface-hidden ${isFlipped ? "invisible" : ""}`}>
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500">QUESTION</p>
              <p className="text-xl font-medium mt-4">
                {flashcard.front !== undefined && flashcard.front !== null 
                  ? flashcard.front 
                  : '[Question Missing]'}
              </p>
            </div>
            <div className="text-center mt-auto">
              <p className="text-sm text-gray-500 italic">Click to reveal answer</p>
            </div>
          </CardContent>
        </Card>

        {/* Back of card */}
        <Card className={`absolute w-full h-full backface-hidden rotate-y-180 ${!isFlipped ? "invisible" : ""}`}>
          <CardContent className="p-6 h-full flex flex-col justify-center">
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500">ANSWER</p>
              <p className="text-xl font-medium mt-4">
                {flashcard.back !== undefined && flashcard.back !== null 
                  ? flashcard.back 
                  : '[Answer Missing]'}
              </p>
            </div>
            <div className="text-center mt-auto">
              <p className="text-sm text-gray-500 italic">Click to see question</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Flip button */}
      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleFlip();
          }}
          className="rounded-full px-4"
        >
          <Undo className="h-4 w-4 mr-2" />
          Flip Card
        </Button>
      </div>
    </div>
  );
}

