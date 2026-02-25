export function debounce<F extends (...args: any[]) => any>(
  func: F,
  delay: number
): (...args: Parameters<F>) => ReturnType<F> {
  let timeoutId: ReturnType<typeof setTimeout> | null

  const debouncedFunction = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    return new Promise<ReturnType<F>>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(func.apply(context, args))
      }, delay)
    })
  }

  return debouncedFunction as (...args: Parameters<F>) => ReturnType<F>
}

export const initBackground = () => {
  const fontSizeMultiplier = 10
  let setIntervalId: ReturnType<typeof setInterval> | null = null
  let isUnmounted = false

  const fontColors = [
    '#33B5E5',
    '#0099CC',
    '#AA66CC',
    '#9933CC',
    '#99CC00',
    '#669900',
    '#FFBB33',
    '#FF8800',
    '#FF4444',
    '#CC0000',
  ]

  const charSet = 'study-java-react'

  const getRandomColor = () => fontColors[Math.floor(Math.random() * fontColors.length)]
  const getRandomChar = () => charSet[Math.floor(Math.random() * charSet.length)]

  const changeAlpha = (color: string, opacity: number) => {
    // Handling hex color parsing more robustly
    let r, g, b
    if (color.length === 7) {
      r = parseInt(color.slice(1, 3), 16)
      g = parseInt(color.slice(3, 5), 16)
      b = parseInt(color.slice(5, 7), 16)
    } else {
      // Fallback
      r = 255
      g = 255
      b = 255
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  const initCodeRain = debounce(() => {
    if (isUnmounted) return
    if (setIntervalId) {
      clearInterval(setIntervalId)
    }
    const cvs = document.getElementById('cvs') as HTMLCanvasElement
    if (!cvs) return

    const width = window.innerWidth * devicePixelRatio
    const height = window.innerHeight * devicePixelRatio

    cvs.width = width
    cvs.height = height

    const ctx = cvs.getContext('2d') as CanvasRenderingContext2D
    const fontSize = fontSizeMultiplier * devicePixelRatio
    const columnWidth = fontSize
    const columnCount = Math.floor(width / columnWidth)

    const nextCharIndexInColumn = new Array(columnCount).fill(0)

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)

      for (let i = 0; i < columnCount; i++) {
        const randomChar = getRandomChar()
        const xPosition = i * columnWidth
        const yPosition = (nextCharIndexInColumn[i] + 1) * fontSize

        const opacityFactor = yPosition / height < 0.2 ? yPosition / (height * 0.2) : 1

        ctx.fillStyle = changeAlpha(getRandomColor(), opacityFactor)
        ctx.font = `${fontSize}px 'Monaco', monospace`
        ctx.fillText(randomChar, xPosition, yPosition)

        if (yPosition > height && Math.random() > 0.99) {
          nextCharIndexInColumn[i] = 0
        } else {
          nextCharIndexInColumn[i]++
        }
      }
    }

    setIntervalId = setInterval(draw, 100)
  }, 300)

  initCodeRain()
  window.addEventListener('resize', initCodeRain)

  return () => {
    isUnmounted = true
    if (setIntervalId) clearInterval(setIntervalId)
    window.removeEventListener('resize', initCodeRain)
  }
}
