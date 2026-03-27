import { useEffect, useRef, useState } from 'react'

interface PupilProps {
  size?: number
  maxDistance?: number
  pupilColor?: string
  forceLookX?: number
  forceLookY?: number
}

function Pupil({
  size = 12,
  maxDistance = 5,
  pupilColor = '#2d2d2d',
  forceLookX,
  forceLookY,
}: PupilProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const pupilRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const calculatePupilPosition = () => {
    if (!pupilRef.current) {
      return { x: 0, y: 0 }
    }

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY }
    }

    const pupilRect = pupilRef.current.getBoundingClientRect()
    const centerX = pupilRect.left + pupilRect.width / 2
    const centerY = pupilRect.top + pupilRect.height / 2
    const deltaX = mousePosition.x - centerX
    const deltaY = mousePosition.y - centerY
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance)
    const angle = Math.atan2(deltaY, deltaX)

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    }
  }

  const pupilPosition = calculatePupilPosition()

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  )
}

interface EyeBallProps {
  size?: number
  pupilSize?: number
  maxDistance?: number
  eyeColor?: string
  pupilColor?: string
  isBlinking?: boolean
  forceLookX?: number
  forceLookY?: number
}

function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = 'white',
  pupilColor = '#2d2d2d',
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const eyeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const calculatePupilPosition = () => {
    if (!eyeRef.current) {
      return { x: 0, y: 0 }
    }

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY }
    }

    const eyeRect = eyeRef.current.getBoundingClientRect()
    const centerX = eyeRect.left + eyeRect.width / 2
    const centerY = eyeRect.top + eyeRect.height / 2
    const deltaX = mousePosition.x - centerX
    const deltaY = mousePosition.y - centerY
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance)
    const angle = Math.atan2(deltaY, deltaX)

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    }
  }

  const pupilPosition = calculatePupilPosition()

  return (
    <div
      ref={eyeRef}
      className="flex items-center justify-center overflow-hidden rounded-full transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  )
}

interface AnimatedCharactersProps {
  isTyping?: boolean
  showPassword?: boolean
  passwordLength?: number
}

function useBlinking() {
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    let blinkTimeoutId: number | undefined
    let resetTimeoutId: number | undefined

    const scheduleBlink = () => {
      blinkTimeoutId = window.setTimeout(
        () => {
          setIsBlinking(true)
          resetTimeoutId = window.setTimeout(() => {
            setIsBlinking(false)
            scheduleBlink()
          }, 150)
        },
        Math.random() * 4000 + 3000
      )
    }

    scheduleBlink()

    return () => {
      if (blinkTimeoutId) {
        window.clearTimeout(blinkTimeoutId)
      }
      if (resetTimeoutId) {
        window.clearTimeout(resetTimeoutId)
      }
    }
  }, [])

  return isBlinking
}

export function AnimatedCharacters({
  isTyping = false,
  showPassword = false,
  passwordLength = 0,
}: AnimatedCharactersProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)
  const purpleRef = useRef<HTMLDivElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)
  const orangeRef = useRef<HTMLDivElement>(null)
  const isPurpleBlinking = useBlinking()
  const isBlackBlinking = useBlinking()

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (!isTyping) {
      setIsLookingAtEachOther(false)
      return
    }

    setIsLookingAtEachOther(true)
    const timeoutId = window.setTimeout(() => {
      setIsLookingAtEachOther(false)
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [isTyping])

  useEffect(() => {
    if (!(passwordLength > 0 && showPassword)) {
      setIsPurplePeeking(false)
      return
    }

    let nextPeekTimeoutId: number | undefined
    let resetPeekTimeoutId: number | undefined

    const schedulePeek = () => {
      nextPeekTimeoutId = window.setTimeout(
        () => {
          setIsPurplePeeking(true)
          resetPeekTimeoutId = window.setTimeout(() => {
            setIsPurplePeeking(false)
            schedulePeek()
          }, 800)
        },
        Math.random() * 3000 + 2000
      )
    }

    schedulePeek()

    return () => {
      if (nextPeekTimeoutId) {
        window.clearTimeout(nextPeekTimeoutId)
      }
      if (resetPeekTimeoutId) {
        window.clearTimeout(resetPeekTimeoutId)
      }
    }
  }, [passwordLength, showPassword])

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) {
      return { faceX: 0, faceY: 0, bodySkew: 0 }
    }

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 3
    const deltaX = mousePosition.x - centerX
    const deltaY = mousePosition.y - centerY

    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
    }
  }

  const purplePosition = calculatePosition(purpleRef)
  const blackPosition = calculatePosition(blackRef)
  const yellowPosition = calculatePosition(yellowRef)
  const orangePosition = calculatePosition(orangeRef)
  const isHidingPassword = passwordLength > 0 && !showPassword
  const isShowingPassword = passwordLength > 0 && showPassword

  return (
    <div className="relative mx-auto h-[320px] w-[440px] max-w-full xl:h-[400px] xl:w-[550px]">
      <div
        ref={purpleRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '14%',
          width: '32.7%',
          height: isTyping || isHidingPassword ? '110%' : '100%',
          backgroundColor: '#6c3ff5',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform: isShowingPassword
            ? 'skewX(0deg)'
            : isTyping || isHidingPassword
              ? `skewX(${purplePosition.bodySkew - 12}deg) translateX(40px)`
              : `skewX(${purplePosition.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          style={{
            left: isShowingPassword
              ? '20px'
              : isLookingAtEachOther
                ? '55px'
                : `${45 + purplePosition.faceX}px`,
            top: isShowingPassword
              ? '35px'
              : isLookingAtEachOther
                ? '65px'
                : `${40 + purplePosition.faceY}px`,
          }}
        >
          <EyeBall
            size={18}
            pupilSize={7}
            maxDistance={5}
            isBlinking={isPurpleBlinking}
            forceLookX={
              isShowingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined
            }
            forceLookY={
              isShowingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined
            }
          />
          <EyeBall
            size={18}
            pupilSize={7}
            maxDistance={5}
            isBlinking={isPurpleBlinking}
            forceLookX={
              isShowingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined
            }
            forceLookY={
              isShowingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined
            }
          />
        </div>
      </div>

      <div
        ref={blackRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '43.6%',
          width: '21.8%',
          height: '77.5%',
          backgroundColor: '#2d2d2d',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transform: isShowingPassword
            ? 'skewX(0deg)'
            : isLookingAtEachOther
              ? `skewX(${blackPosition.bodySkew * 1.5 + 10}deg) translateX(20px)`
              : isTyping || isHidingPassword
                ? `skewX(${blackPosition.bodySkew * 1.5}deg)`
                : `skewX(${blackPosition.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          style={{
            left: isShowingPassword
              ? '10px'
              : isLookingAtEachOther
                ? '32px'
                : `${26 + blackPosition.faceX}px`,
            top: isShowingPassword
              ? '28px'
              : isLookingAtEachOther
                ? '12px'
                : `${32 + blackPosition.faceY}px`,
          }}
        >
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            isBlinking={isBlackBlinking}
            forceLookX={isShowingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={isShowingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            isBlinking={isBlackBlinking}
            forceLookX={isShowingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={isShowingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      <div
        ref={orangeRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '0',
          width: '43.6%',
          height: '50%',
          zIndex: 3,
          backgroundColor: '#ff9b6b',
          borderRadius: '120px 120px 0 0',
          transform: isShowingPassword ? 'skewX(0deg)' : `skewX(${orangePosition.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{
            left: isShowingPassword ? '50px' : `${82 + orangePosition.faceX}px`,
            top: isShowingPassword ? '85px' : `${90 + orangePosition.faceY}px`,
          }}
        >
          <Pupil
            size={12}
            maxDistance={5}
            forceLookX={isShowingPassword ? -5 : undefined}
            forceLookY={isShowingPassword ? -4 : undefined}
          />
          <Pupil
            size={12}
            maxDistance={5}
            forceLookX={isShowingPassword ? -5 : undefined}
            forceLookY={isShowingPassword ? -4 : undefined}
          />
        </div>
      </div>

      <div
        ref={yellowRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: '56.4%',
          width: '25.4%',
          height: '57.5%',
          backgroundColor: '#e8d754',
          borderRadius: '70px 70px 0 0',
          zIndex: 4,
          transform: isShowingPassword ? 'skewX(0deg)' : `skewX(${yellowPosition.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{
            left: isShowingPassword ? '20px' : `${52 + yellowPosition.faceX}px`,
            top: isShowingPassword ? '35px' : `${40 + yellowPosition.faceY}px`,
          }}
        >
          <Pupil
            size={12}
            maxDistance={5}
            forceLookX={isShowingPassword ? -5 : undefined}
            forceLookY={isShowingPassword ? -4 : undefined}
          />
          <Pupil
            size={12}
            maxDistance={5}
            forceLookX={isShowingPassword ? -5 : undefined}
            forceLookY={isShowingPassword ? -4 : undefined}
          />
        </div>
        <div
          className="absolute h-1 w-20 rounded-full bg-[#2d2d2d] transition-all duration-200 ease-out"
          style={{
            left: isShowingPassword ? '10px' : `${40 + yellowPosition.faceX}px`,
            top: isShowingPassword ? '88px' : `${88 + yellowPosition.faceY}px`,
          }}
        />
      </div>
    </div>
  )
}
