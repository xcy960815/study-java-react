import { useEffect, useState } from 'react'

/**
 * 鼠标在视口中的二维坐标。
 */
interface PointerPosition {
  x: number
  y: number
}

/**
 * 单个瞳孔的渲染参数。
 */
interface PupilProps {
  mousePosition: PointerPosition
  size?: number
  maxDistance?: number
  pupilColor?: string
  forceLookX?: number
  forceLookY?: number
}

/**
 * 眼球组件参数。
 */
interface EyeBallProps extends PupilProps {
  pupilSize?: number
  eyeColor?: string
  isBlinking?: boolean
}

/**
 * 登录页角色动效组件参数。
 */
interface AnimatedCharactersProps {
  isTyping?: boolean
  showPassword?: boolean
  passwordLength?: number
}

/**
 * 获取当前视口尺寸。
 * SSR 或首帧无法访问 window 时返回兜底值。
 */
const getViewportSize = () => {
  if (typeof window === 'undefined') {
    return { width: 1, height: 1 }
  }

  return {
    width: window.innerWidth || 1,
    height: window.innerHeight || 1,
  }
}

/**
 * 生成角色初始朝向所需的中心点坐标。
 */
const createInitialPointerPosition = (): PointerPosition => {
  const { width, height } = getViewportSize()

  return {
    x: width / 2,
    y: height / 2,
  }
}

/**
 * 将数值限制在指定区间。
 *
 * @param value 原始值
 * @param min 最小值
 * @param max 最大值
 */
const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

/**
 * 将鼠标位置转换为角色可用的相对偏移量。
 *
 * @param mousePosition 鼠标坐标
 * @param maxX X 轴最大偏移
 * @param maxY Y 轴最大偏移
 */
const calculateViewportOffset = (mousePosition: PointerPosition, maxX: number, maxY: number) => {
  const { width, height } = getViewportSize()
  const normalizedX = clamp((mousePosition.x / width - 0.5) * 2, -1, 1)
  const normalizedY = clamp((mousePosition.y / height - 0.5) * 2, -1, 1)

  return {
    x: clamp(normalizedX * maxX, -maxX, maxX),
    y: clamp(normalizedY * maxY, -maxY, maxY),
  }
}

/**
 * 单个瞳孔组件。
 * 支持跟随鼠标或根据外部状态强制指定朝向。
 */
function Pupil({
  mousePosition,
  size = 12,
  maxDistance = 5,
  pupilColor = '#2d2d2d',
  forceLookX,
  forceLookY,
}: PupilProps) {
  const pupilPosition =
    forceLookX !== undefined && forceLookY !== undefined
      ? { x: forceLookX, y: forceLookY }
      : calculateViewportOffset(mousePosition, maxDistance, maxDistance * 0.85)

  return (
    <div
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

/**
 * 眼球组件。
 * 在普通跟随、强制朝向和眨眼三种状态之间切换。
 */
function EyeBall({
  mousePosition,
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = 'white',
  pupilColor = '#2d2d2d',
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const pupilPosition =
    forceLookX !== undefined && forceLookY !== undefined
      ? { x: forceLookX, y: forceLookY }
      : calculateViewportOffset(mousePosition, maxDistance, maxDistance)

  return (
    <div
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

/**
 * 生成随机眨眼状态，给角色增加更自然的生命感。
 */
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

/**
 * 登录页角色动效组件。
 * 通过鼠标位置、输入状态和密码显隐状态驱动角色姿态变化。
 *
 * @param isTyping 是否正在输入
 * @param showPassword 是否显示密码
 * @param passwordLength 当前密码长度
 */
export function AnimatedCharacters({
  isTyping = false,
  showPassword = false,
  passwordLength = 0,
}: AnimatedCharactersProps) {
  const [mousePosition, setMousePosition] = useState(createInitialPointerPosition)
  const isPurpleBlinking = useBlinking()
  const isBlackBlinking = useBlinking()

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  /**
   * 根据鼠标位置计算角色五官和身体的轻微偏转。
   *
   * @param horizontalScale 横向跟随强度
   * @param verticalScale 纵向跟随强度
   * @param skewScale 身体倾斜强度
   */
  const calculateCharacterMotion = (
    horizontalScale: number,
    verticalScale: number,
    skewScale: number
  ) => {
    const offset = calculateViewportOffset(mousePosition, 15, 10)

    return {
      faceX: offset.x * horizontalScale,
      faceY: offset.y * verticalScale,
      bodySkew: clamp((-offset.x / 15) * 6 * skewScale, -6, 6),
    }
  }

  const purplePosition = calculateCharacterMotion(1, 0.9, 0.9)
  const blackPosition = calculateCharacterMotion(0.7, 0.7, 1.2)
  const yellowPosition = calculateCharacterMotion(0.85, 0.8, 0.7)
  const orangePosition = calculateCharacterMotion(1.05, 0.85, 0.6)
  const isHidingPassword = passwordLength > 0 && !showPassword
  const isShowingPassword = passwordLength > 0 && showPassword
  const isLookingAtEachOther = isTyping
  const isPurplePeeking = isShowingPassword

  return (
    <div className="relative mx-auto h-[320px] w-[440px] max-w-full xl:h-[400px] xl:w-[550px]">
      <div
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
            mousePosition={mousePosition}
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
            mousePosition={mousePosition}
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
            mousePosition={mousePosition}
            size={16}
            pupilSize={6}
            maxDistance={4}
            isBlinking={isBlackBlinking}
            forceLookX={isShowingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={isShowingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
          <EyeBall
            mousePosition={mousePosition}
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
            mousePosition={mousePosition}
            size={12}
            maxDistance={5}
            forceLookX={isShowingPassword ? -5 : undefined}
            forceLookY={isShowingPassword ? -4 : undefined}
          />
          <Pupil
            mousePosition={mousePosition}
            size={12}
            maxDistance={5}
            forceLookX={isShowingPassword ? -5 : undefined}
            forceLookY={isShowingPassword ? -4 : undefined}
          />
        </div>
      </div>

      <div
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
            mousePosition={mousePosition}
            size={12}
            maxDistance={5}
            forceLookX={isShowingPassword ? -5 : undefined}
            forceLookY={isShowingPassword ? -4 : undefined}
          />
          <Pupil
            mousePosition={mousePosition}
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
