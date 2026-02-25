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
  let setIntervalId: number | null = null

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
    if (setIntervalId) {
      cancelAnimationFrame(setIntervalId)
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

    // 让每列拥有各自不同的下落速度和初始位置
    const columns = Array.from({ length: columnCount }, () => ({
      x: 0,
      y: Math.random() * height,
      speed: Math.random() * 2 + 1, // 控制每列额外的下落步长
    }))

    // 绘制上一帧的残影，使用固定的绘制循环来控制透明度
    let lastTime = 0
    const fps = 30 // 控制逻辑帧在 30 帧左右，动画用 requestAnimationFrame

    const draw = (timestamp: number) => {
      // 动画请求下一帧
      setIntervalId = requestAnimationFrame(draw)

      // 距离上一次渲染控制的时间间隔，不用太快以防残影消失得太迅速
      if (timestamp - lastTime < 1000 / fps) return
      lastTime = timestamp

      // 绘制带透明度的背景填充，形成轨迹拖影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)

      ctx.font = `${fontSize}px 'Monaco', monospace`

      for (let i = 0; i < columnCount; i++) {
        const col = columns[i]
        const randomChar = getRandomChar()
        col.x = i * columnWidth

        const opacityFactor = col.y / height < 0.2 ? col.y / (height * 0.2) : 1
        ctx.fillStyle = changeAlpha(getRandomColor(), opacityFactor)

        ctx.fillText(randomChar, col.x, col.y)

        // 让字符向下掉落，如果超出屏幕或者随机出现，则将其复位到顶部
        if (col.y > height && Math.random() > 0.98) {
          col.y = 0
        } else {
          // 根据自身的 speed 属性来决定下落快慢
          col.y += fontSize * 0.4 * col.speed // 减缓整体掉落速度，并附加列级缓动
        }
      }
    }

    setIntervalId = requestAnimationFrame(draw)
  }, 300)

  initCodeRain()
  window.addEventListener('resize', initCodeRain)

  return () => {
    if (setIntervalId) cancelAnimationFrame(setIntervalId)
    window.removeEventListener('resize', initCodeRain)
  }
}
