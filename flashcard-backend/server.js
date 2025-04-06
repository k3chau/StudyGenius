const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { OpenAI } = require('openai');
const { auth } = require('express-oauth2-jwt-bearer');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware Configuration ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Auth Configuration ---
const jwtCheck = auth({
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-nh73t7m51ufsuud2.us.auth0.com',
  audience: process.env.AUTH0_AUDIENCE || 'http://studygeniusapi',
  tokenSigningAlg: 'RS256'
});

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}
const openai = new OpenAI({ apiKey });

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, PNG, or JPG files.'), false);
    }
  }
});

// --- Helper Functions ---
// Process PDF file
async function extractTextFromPDF(buffer) {
  try {
    console.log('Extracting text from PDF...');
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text.replace(/\s+/g, ' ').trim();
    const maxChars = 15000;
    const result = text.length > maxChars ? text.substring(0, maxChars) + "... [content truncated due to length]" : text;
    console.log(`Extracted ${result.length} characters from PDF`);
    return result;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`PDF parsing error: ${error.message}`);
  }
}

// Process Image using OCR
async function extractTextFromImage(buffer, mimetype) {
  try {
    console.log(`Extracting text from image with mimetype: ${mimetype}...`);
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data } = await worker.recognize(buffer);
    await worker.terminate();
    
    const text = data.text
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const maxChars = 15000;
    const result = text.length > maxChars ? text.substring(0, maxChars) + "... [content truncated due to length]" : text;
    console.log(`Extracted ${result.length} characters from image`);
    return result;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error(`OCR processing error: ${error.message}`);
  }
}

// --- Routes ---
// Test route (public)
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Protected route example
app.get('/api/protected', jwtCheck, (req, res) => {
  res.json({ message: 'Protected endpoint accessed successfully!' });
});

// Flashcard generation route
app.post('/api/generate-flashcards', upload.single('file'), async (req, res) => {
  try {
    console.log('Received request to generate flashcards');
    const textContent = req.body.text;
    const file = req.file;
    const cardCount = parseInt(req.body.count, 10) || 10;

    let extractedText = textContent || '';
    
    if (file) {
      try {
        console.log(`Processing file: ${file.originalname}, mimetype: ${file.mimetype}`);
        
        if (file.mimetype === 'application/pdf') {
          extractedText += await extractTextFromPDF(file.buffer);
        } else if (file.mimetype.startsWith('image/')) {
          extractedText += await extractTextFromImage(file.buffer, file.mimetype);
        }
      } catch (error) {
        console.error('Error processing file:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'No text content provided or extracted.' });
    }

    // Create flashcards using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates educational flashcards. Return a JSON object with a 'cards' array where each card has 'front' and 'back' properties."
        },
        {
          role: "user",
          content: `Create ${cardCount} flashcards from this text: "${extractedText}". Format your response as: {"cards": [{"front": "question", "back": "answer"}, ...]}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const parsedResponse = JSON.parse(response.choices[0].message.content);
    console.log('OpenAI Response:', parsedResponse);

    // Ensure we have a valid array of flashcards
    let flashcardsArray;
    if (Array.isArray(parsedResponse)) {
      flashcardsArray = parsedResponse;
    } else if (parsedResponse.cards && Array.isArray(parsedResponse.cards)) {
      flashcardsArray = parsedResponse.cards;
    } else {
      throw new Error('Invalid response format from OpenAI. Expected an array of flashcards or an object with a cards array.');
    }

    // Format the flashcards consistently
    const finalFlashcards = {
      cards: flashcardsArray.map((card, index) => ({
        front: card.front || card.question || 'Question not available',
        back: card.back || card.answer || 'Answer not available'
      }))
    };

    console.log(`Generated ${finalFlashcards.cards.length} flashcards successfully`);
    res.json(finalFlashcards);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ error: 'Failed to generate flashcards: ' + error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid or missing token.' });
  }
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start server
app.listen(port, () => {
  console.log('Environment Configuration:');
  console.log(`- PORT: ${port}`);
  console.log(`- AUTH0_ISSUER_BASE_URL: ${process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-nh73t7m51ufsuud2.us.auth0.com'}`);
  console.log(`- AUTH0_AUDIENCE: ${process.env.AUTH0_AUDIENCE || 'http://studygeniusapi'}`);
  console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
  console.log(`- OPENAI_API_KEY: ******`);
  console.log(`\nServer running at http://localhost:${port}`);
});