import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import logo from '@/components/ui/image-removebg-preview.png'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowDown, ArrowUp } from 'lucide-react'
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

export default function EPTSGame() {
  const [students, setStudents] = useState<Student[]>([])
  const [correctStudent, setCorrectStudent] = useState<Student | null>(null)
  const [guessInput, setGuessInput] = useState('')
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [gameWon, setGameWon] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('@/components/ui/EPTSdle.xlsx')
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

  const handleGuess = () => {
    if (!correctStudent) return

    const guessedStudent = students.find(
      (s) => s.Students.toLowerCase() === guessInput.toLowerCase(),
    )

    if (!guessedStudent) {
      setError('Student not found. Please try another name.')
      return
    }

    if (guessedStudent.Students === correctStudent.Students) {
      setGameWon(true)
      setFeedback([])
    } else {
      setFeedback(getFeedback(correctStudent, guessedStudent))
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
    setFeedback([])
    setError(null)
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

      <div className='px-4 py-6 w-full max-w-md'>
        <Card className='bg-[#1F1F1F] shadow-xl rounded-3xl'>
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
                onClick={handleGuess}
                disabled={gameWon || !guessInput.trim()}
              >
                Guess
              </Button>
            </div>

            {error && (
              <div className='text-red-500 text-center py-2 px-4 rounded-lg bg-red-500/10'>
                {error}
              </div>
            )}

            {gameWon && (
              <div className='text-green text-center py-2 px-4 rounded-lg bg-green-500/10 font-bold'>
                Congratulations! You guessed the correct student!
              </div>
            )}

            {feedback.length > 0 && (
              <div className='space-y-2'>
                <h3 className='font-bold text-white mb-4'>Feedback:</h3>
                {feedback.map(({ key, guessedValue, isCorrect, hint }) => (
                  <div
                    key={key}
                    className='flex justify-between items-center py-1'
                  >
                    <span className='text-white'>{key}:</span>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`px-3 py-1 rounded-lg flex items-center ${
                          isCorrect
                            ? 'bg-green  text-white border-green'
                            : 'bg-red-500/20 text-white border border-red-500'
                        }`}
                      >
                        {guessedValue}
                        {hint &&
                          (hint === 'higher' ? (
                            <ArrowUp className='ml-2 h-4 w-4' />
                          ) : (
                            <ArrowDown className='ml-2 h-4 w-4' />
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter className='flex justify-center pt-4'>
            <Button
              onClick={resetGame}
              className='bg-[#3D5AFE] text-white rounded-full px-8 py-2 hover:bg-[#536DFE]'
            >
              {gameWon ? 'Play Again' : 'Reset Game'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
