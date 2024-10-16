import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import img from '@/components/ui/James.png' // Assuming the image file is a PNG
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Student {
  Students: string
  Gender: string
  'After EPTS': string
  'Area of Study (EPTS)': string
  Affiliation: string
  'Gavin Coolness Score': number | '?'
  'Start Year': number | '?'
  'End Year': number | '?'
}

interface Feedback {
  key: keyof Student
  guessedValue: string | number | '?'
  isCorrect: boolean
  hint?: 'higher' | 'lower'
}

interface GuessHistory {
  student: Student
  feedback: Feedback[]
}

export default function EPTSGame() {
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [correctStudent, setCorrectStudent] = useState<Student | null>(null)
  const [guessInput, setGuessInput] = useState('')
  const [guessHistory, setGuessHistory] = useState<GuessHistory[]>([])
  const [gameWon, setGameWon] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const suggestionRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    loadStudents()

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
    if (guessInput.length > 0) {
      const filtered = students
        .map((student) => student.Students)
        .filter((name) => name.toLowerCase().includes(guessInput.toLowerCase()))
        .slice(0, 5) // Limit to 5 suggestions
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [guessInput, students])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/EPTSdle.xlsx')
      const arrayBuffer = await response.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Student[]

      setStudents(jsonData)
      const randomStudent =
        jsonData[Math.floor(Math.random() * jsonData.length)]
      setCorrectStudent(randomStudent)
    } catch (error) {
      setError('Error loading student data. Please try refreshing the page.')
      console.error('Error loading Excel file:', error)
    } finally {
      setLoading(false)
    }
  }
  const compareNumeric = (
    actual: number | '?',
    guess: number | '?',
  ): { isCorrect: boolean; hint?: 'higher' | 'lower' } => {
    if (actual === '?' || guess === '?') return { isCorrect: actual === guess }
    if (actual === guess) return { isCorrect: true }
    return {
      isCorrect: false,
      hint: guess < actual ? 'higher' : 'lower',
    }
  }

  const getFeedback = (
    correctStudent: Student,
    guessedStudent: Student,
  ): Feedback[] => {
    const feedbackFields: (keyof Student)[] = [
      'Gender',
      'After EPTS',
      'Area of Study (EPTS)',
      'Affiliation',
      'Gavin Coolness Score',
      'Start Year',
      'End Year',
    ]

    return feedbackFields.map((field) => {
      const actualValue = correctStudent[field]
      const guessedValue = guessedStudent[field]

      if (typeof actualValue === 'number' || actualValue === '?') {
        const { isCorrect, hint } = compareNumeric(
          actualValue as number | '?',
          guessedValue as number | '?',
        )
        return {
          key: field,
          guessedValue,
          isCorrect,
          hint,
        }
      }

      return {
        key: field,
        guessedValue,
        isCorrect:
          String(actualValue).toLowerCase() ===
          String(guessedValue).toLowerCase(),
      }
    })
  }
  const handleShowAnswer = () => {
    setShowAnswerModal(true)
  }
  const handleGuess = () => {
    if (!correctStudent) return

    const guessedStudent = students.find(
      (s) => s.Students.toLowerCase() === guessInput.toLowerCase(),
    )

    if (!guessedStudent) {
      setError('Student not found. Please try another name.')
      return
    }

    const newFeedback = getFeedback(correctStudent, guessedStudent)
    const newGuessHistory = {
      student: guessedStudent,
      feedback: newFeedback,
    }

    setGuessHistory([newGuessHistory, ...guessHistory])

    if (guessedStudent.Students === correctStudent.Students) {
      setGameWon(true)
    }

    setGuessInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGuess()
  }

  const resetGame = () => {
    const randomStudent = students[Math.floor(Math.random() * students.length)]
    setCorrectStudent(randomStudent)
    setGameWon(false)
    setGuessHistory([])
    setError(null)
    setShowAnswerModal(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false)
    setGuessInput(suggestion)
  }

  const GuessCard = ({ guess }: { guess: GuessHistory }) => (
    <Card className='bg-[#1F1F1F] shadow-xl w-full rounded-3xl mb-4'>
      <CardHeader>
        <CardTitle className='text-[#E0E0E0] text-xl space-y-10'>
          {guess.student.Students}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4'>
          {guess.feedback.map(({ key, guessedValue, isCorrect, hint }) => (
            <div key={key} className='flex  w-40 h-30 flex-col space-y-2'>
              <span className='text-[#B3B3B3] text-sm'>{key}</span>
              <div
                className={`px-3 py-1 rounded-lg flex items-center justify-center ${
                  isCorrect ? 'bg-green text-white' : 'bg-red-500 text-white'
                }`}
              >
                <span className='truncate'>{guessedValue}</span>
                {hint && (
                  <span className='ml-1'>
                    {hint === 'higher' ? (
                      <ArrowUp className='h-4 w-4' />
                    ) : (
                      <ArrowDown className='h-4 w-4' />
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
  const CongratulationsModal = () => (
    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
      <div className='bg-[#1F1F1F] p-6 rounded-xl shadow-lg text-center'>
        <h2 className='text-2xl font-bold text-white mb-4'>Congratulations!</h2>
        <img className='w-80 h-80 mx-auto' src={img} />
        <p className='mb-4 text-white'>You guessed the correct student!</p>
        <Button
          onClick={resetGame}
          className='bg-[#3D5AFE] text-white rounded-full px-8 py-2 hover:bg-blue'
        >
          Play Again
        </Button>
      </div>
    </div>
  )
  const AnswerModal = () => {
    if (!correctStudent) return null

    return (
      <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
        <div className='bg-[#1F1F1F] p-6 rounded-xl shadow-lg max-w-md w-full'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-2xl font-bold text-white'>
              Better luck next time!
            </h2>
            <Button
              variant='ghost'
              onClick={() => setShowAnswerModal(false)}
              className='text-white hover:bg-gray-700 rounded-full p-2'
            >
              <X className='h-6 w-6' />
            </Button>
          </div>

          <div className='space-y-4'>
            <div className='text-center mb-6'>
              <p className='text-xl text-white font-semibold'>
                {correctStudent.Students}
              </p>
            </div>

            {Object.entries(correctStudent).map(([key, value]) => {
              if (key === 'Students') return null // Skip the name since we already showed it
              return (
                <div key={key} className='bg-[#2C2C2C] p-3 rounded-lg'>
                  <p className='text-[#B3B3B3] text-sm'>{key}</p>
                  <p className='text-white font-medium'>{value.toString()}</p>
                </div>
              )
            })}
          </div>

          <div className='mt-6 flex justify-center'>
            <Button
              onClick={resetGame}
              className='bg-[#3D5AFE] text-white rounded-full px-8 py-2 hover:bg-[#536DFE]'
            >
              Play Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    )
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
          EPTSdle
        </h1>
      </nav>

      <div className='px-4 py-6 w-460'>
        <Card className='bg-[#1F1F1F] w-full shadow-xl rounded-3xl mb-6'>
          <CardHeader>
            <CardTitle className='text-[#E0E0E0] text-2xl'>
              Guess the EPTS Student
            </CardTitle>
            <CardDescription className='text-[#B3B3B3]'>
              Enter a student's name to guess. Get feedback on various
              attributes!
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4'>
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
          </CardContent>

          <CardFooter className='flex justify-center pt-4 space-x-4'>
            <Button
              onClick={resetGame}
              className='bg-[#3D5AFE] text-white rounded-full px-8 py-2 hover:bg-[#536DFE]'
            >
              Reset Game
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

        <div className='space-y-4'>
          {guessHistory.map((guess, index) => (
            <GuessCard key={index} guess={guess} />
          ))}
        </div>
      </div>

      {gameWon && <CongratulationsModal />}
      {showAnswerModal && <AnswerModal />}
    </div>
  )
}
