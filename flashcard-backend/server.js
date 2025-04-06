const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const multer = require('multer');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize OpenAI with your API key
const apiKey = process.env.OPENAI_API_KEY;

// Check if API key is available
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  console.error('Please set your API key in the .env file');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

// Multer setup for file upload (in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept PDFs and common image formats
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/jpg'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, PNG, or JPG files.'), false);
    }
  }
});

// Text input endpoint
app.post('/echo', async (req, res) => {
  const { message, count = 10 } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing message in request body' });
  }

  try {
    const flashcards = await generateFlashcardsFromText(message, count);
    res.json(flashcards);
  } catch (err) {
    console.error("GPT API error:", err);
    res.status(500).json({ error: "ChatGPT API call failed: " + err.message });
  }
});

// Process PDF file
async function extractTextFromPDF(buffer) {
  try {
    const pdfData = await pdfParse(buffer);
    // Basic text cleaning
    const text = pdfData.text
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim();
    
    // Limit text length to prevent token limit issues
    const maxChars = 15000; // Approximately 3750 tokens
    if (text.length > maxChars) {
      return text.substring(0, maxChars) + "... [content truncated due to length]";
    }
    
    return text;
  } catch (error) {
    throw new Error(`PDF parsing error: ${error.message}`);
  }
}

// Process Image using OCR
async function extractTextFromImage(buffer, mimetype) {
  try {
    const worker = await createWorker();
    
    // Specify language
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Set image recognition parameters for better results
    await worker.setParameters({
      tessedit_ocr_engine_mode: 3, // Legacy + LSTM mode
      preserve_interword_spaces: 1,
    });
    
    // Recognize text
    const { data } = await worker.recognize(buffer);
    await worker.terminate();
    
    // Basic text cleaning
    const text = data.text
      .replace(/\n+/g, ' ')  // Replace newlines with spaces
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim();
    
    // Limit text length to prevent token limit issues
    const maxChars = 15000; // Approximately 3750 tokens
    if (text.length > maxChars) {
      return text.substring(0, maxChars) + "... [content truncated due to length]";
    }
    
    return text;
  } catch (error) {
    throw new Error(`OCR processing error: ${error.message}`);
  }
}

// Function to generate flashcards from text using AI
async function generateFlashcardsFromText(text, count = 10) {
  // Ensure we have valid input
  if (!text || text.trim().length === 0) {
    throw new Error("No text provided for flashcard generation");
  }

  // Create a simpler prompt template that's less likely to confuse the model
  const promptTemplate = `
    Create ${count} flashcards based on this text: 
    
    "${text.substring(0, 15000)}"
    
    Format your answer as a JSON object with this EXACT structure:
    {
      "flashcards": [
        { "question": "Question 1", "answer": "Answer 1" },
        { "question": "Question 2", "answer": "Answer 2" }
      ]
    }
    
    Be concise and educational. Each answer should be 1-2 sentences.
  `;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: promptTemplate }],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });
    
    const reply = completion.choices[0].message.content?.trim();

    if (!reply) {
      throw new Error("Received empty response from OpenAI");
    }

    // Try to parse the JSON
    try {
      const parsedReply = JSON.parse(reply);
      
      // Check for flashcards array in the response
      if (parsedReply && Array.isArray(parsedReply.flashcards) && parsedReply.flashcards.length > 0) {
        return parsedReply.flashcards;
      } 
      
      // If there's no flashcards array but we got a valid array directly
      else if (Array.isArray(parsedReply) && parsedReply.length > 0) {
        return parsedReply;
      }
      
      // Some other format was returned
      throw new Error("OpenAI response didn't contain valid flashcards array");
      
    } catch (parseError) {
      console.error(`JSON parse error: ${parseError.message}`);
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
    }

  } catch (openaiError) {
    console.error("OpenAI API call failed:", openaiError);
    throw new Error(`OpenAI error: ${openaiError.message || "Unknown error"}`);
  }
}

// Combined endpoint for generating flashcards from text or file
app.post('/generate-flashcards', upload.single('file'), async (req, res) => {
  try {
    // Get parameters
    const textContent = req.body.text || '';
    const count = parseInt(req.body.count) || 10;
    
    let extractedText = '';
    let combinedText = textContent;
    
    // Process file if uploaded
    if (req.file) {
      try {
        const fileType = req.file.mimetype;
        
        if (fileType === 'application/pdf') {
          // Extract text from PDF
          extractedText = await extractTextFromPDF(req.file.buffer);
        } 
        else if (fileType.startsWith('image/')) {
          // Extract text from image using OCR
          extractedText = await extractTextFromImage(req.file.buffer, fileType);
        }
        
        // Combine with text input if provided
        combinedText = textContent 
          ? `${textContent}\n\n${extractedText}` 
          : extractedText;
      } catch (error) {
        return res.status(400).json({ 
          error: `File processing error: ${error.message}` 
        });
      }
    }
    
    // Check if we have any content to process
    if (!combinedText.trim()) {
      return res.status(400).json({ error: 'No content provided (neither text nor valid file content)' });
    }
    
    // Limit combined text to prevent token limit issues
    const maxChars = 15000; // More conservative limit for input text
    if (combinedText.length > maxChars) {
      combinedText = combinedText.substring(0, maxChars) + "... [content truncated due to length]";
    }
    
    // Generate flashcards from the combined text
    try {
      const flashcards = await generateFlashcardsFromText(combinedText, count);
      
      if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error("No valid flashcards were generated");
      }
      
      // Format for frontend compatibility
      const formattedFlashcards = flashcards.map((card, index) => {
        if (!card.question || !card.answer) {
          console.warn(`Card at index ${index} is missing required fields:`, card);
        }
        
        return {
          id: `card-${index}`,
          front: card.question || 'Question not available',
          back: card.answer || 'Answer not available',
          known: null
        };
      });
      
      return res.json(formattedFlashcards);
      
    } catch (flashcardError) {
      return res.status(500).json({ 
        error: 'Failed to generate flashcards', 
        message: flashcardError.message 
      });
    }
  } catch (err) {
    // Catch any other errors
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message || "Unknown error occurred"
    });
  }
});

// Add a global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({ 
    error: 'Server error',
    message: err.message || 'An unexpected error occurred'
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
