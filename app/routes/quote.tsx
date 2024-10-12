import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { X } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Student {
  Students?: string // Make optional to handle potential undefined
  Quote: string
}

export default function QuoteGuesser() {
  const [students, setStudents] = useState<Student[]>([])
  const [currentQuote, setCurrentQuote] = useState<Student | null>(null)
  const [guessInput, setGuessInput] = useState('')
  const [gameWon, setGameWon] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [guessCount, setGuessCount] = useState(0)
  const suggestionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadStudentQuotes()

    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Handle cases where students array might be empty
    if (students.length === 0) {
      setFilteredSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (guessInput.length > 0) {
      const filtered = students
        .map((student) => student.Students) // Get Students property
        .filter((name) =>
          name?.toLowerCase().includes(guessInput.toLowerCase()),
        ) // Use optional chaining
        .slice(0, 5) // Limit to 5 suggestions

      setFilteredSuggestions(filtered as string[]) // Cast to string[]
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [guessInput, students])

  const loadStudentQuotes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/Quote.xlsx')
      if (!response.ok) {
        throw new Error(`Failed to fetch quotes. Status: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json<Student>(worksheet) as Student[]

      console.log(jsonData) // Log to check the structure of data
      setStudents(jsonData)
      selectRandomQuote(jsonData)
    } catch (error) {
      setError('Error loading student quotes. Please try refreshing the page.')
      console.error('Error loading Excel file:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectRandomQuote = (data: Student[]) => {
    const randomStudent = data[Math.floor(Math.random() * data.length)]
    setCurrentQuote(randomStudent)
  }

  const handleGuess = () => {
    if (!currentQuote) return

    setGuessCount(guessCount + 1)

    if (guessInput.toLowerCase() === currentQuote.Students?.toLowerCase()) {
      // Use optional chaining
      setGameWon(true)
    } else {
      setError('Incorrect guess. Try again!')
    }

    setGuessInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGuess()
  }

  const resetGame = () => {
    selectRandomQuote(students)
    setGameWon(false)
    setGuessCount(0)
    setError(null)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false)
    setGuessInput(suggestion)
  }

  const handleShowAnswer = () => {
    setGameWon(true)
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-r from-black flex flex-col items-center'>
      <nav className='w-full bg-black px-5 py-4'>
        <h1 className='text-[#E0E0E0] text-2xl font-bold text-center'>
          QuoteGuesser
        </h1>
      </nav>

      <div className='px-4 py-6 w-460'>
        <Card className='bg-[#1F1F1F] w-full shadow-xl rounded-3xl mb-6'>
          <CardHeader>
            <CardTitle className='text-[#E0E0E0] text-2xl'>
              Guess Who Said It
            </CardTitle>
            <CardDescription className='text-[#B3B3B3]'>
              Read the quote and guess which student said it!
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
            {currentQuote && (
              <div className='bg-[#2C2C2C] p-4 rounded-xl mb-4'>
                <p className='text-white text-lg italic'>
                  "{currentQuote.Quote}"
                </p>
              </div>
            )}

            <div className='flex flex-col relative' ref={suggestionRef}>
              <div className='flex space-x-3'>
                <Input
                  className='flex-grow bg-[#2C2C2C] text-white border-none rounded-xl'
                  placeholder='Enter student name'
                  value={guessInput}
                  onChange={(e) => {
                    setGuessInput(e.target.value)
                    setError(null)
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={gameWon}
                />
                <Button
                  className='bg-[#3D5AFE] text-white rounded-2xl px-6 hover:bg-[#536DFE]'
                  onClick={() => {
                    handleGuess()
                    setShowSuggestions(false)
                  }}
                  disabled={gameWon || !guessInput.trim()}
                >
                  Guess
                </Button>
              </div>

              {showSuggestions && (
                <div className='absolute top-full left-0 right-0 mt-1 bg-[#2C2C2C] rounded-xl shadow-lg z-10'>
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className='px-4 py-2 hover:bg-[#3D5AFE] cursor-pointer text-white'
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className='text-red-500 text-center py-2 px-4 rounded-lg bg-red-500/10'>
                {error}
              </div>
            )}

            <div className='text-white text-center'>Guesses: {guessCount}</div>
          </CardContent>

          <CardFooter className='flex justify-center pt-4 space-x-4'>
            <Button
              onClick={resetGame}
              className='bg-[#3D5AFE] text-white rounded-full px-8 py-2 hover:bg-[#536DFE]'
            >
              New Quote
            </Button>
            {!gameWon && (
              <Button
                onClick={handleShowAnswer}
                className='bg-red-500 text-white rounded-full px-8 py-2 hover:bg-red-600'
              >
                Show Answer
              </Button>
            )}
          </CardFooter>
        </Card>

        {gameWon && (
          <Card className='bg-[#1F1F1F] w-full shadow-xl rounded-3xl mb-6'>
            <CardContent className='p-6'>
              <h2 className='text-2xl font-bold text-white mb-4'>
                Congratulations!
              </h2>
              <p className='text-white mb-2'>
                You guessed correctly! The quote was said by:
              </p>
              <p className='text-[#3D5AFE] text-lg'>{currentQuote.Students}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
