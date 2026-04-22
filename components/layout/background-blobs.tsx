'use client'
import { useEffect, useState } from 'react'

export default function BackgroundBlobs() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: isDark ? '#181616' : '#EAF2EF',
      overflow: 'hidden'
    }}>
      {isDark ? (
        <>
          <div style={{ position:'absolute', width:650, height:650, borderRadius:'50%',
            background:'rgba(37,99,235,0.14)', filter:'blur(90px)',
            top:'-10%', left:'-5%', animation:'blobFloat1 20s ease-in-out infinite' }} />
          <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%',
            background:'rgba(82,255,186,0.06)', filter:'blur(85px)',
            bottom:'-8%', right:'-5%', animation:'blobFloat2 24s ease-in-out infinite' }} />
          <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
            background:'rgba(37,99,235,0.08)', filter:'blur(70px)',
            top:'40%', left:'35%', animation:'blobFloat3 28s ease-in-out infinite' }} />
          <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%',
            background:'rgba(37,99,235,0.10)', filter:'blur(80px)',
            top:'10%', right:'15%', animation:'blobFloat1 22s ease-in-out infinite reverse' }} />
        </>
      ) : (
        <>
          <div style={{ position:'absolute', width:650, height:650, borderRadius:'50%',
            background:'rgba(37,99,235,0.07)', filter:'blur(90px)',
            top:'-10%', left:'-5%', animation:'blobFloat1 20s ease-in-out infinite' }} />
          <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%',
            background:'rgba(82,255,186,0.10)', filter:'blur(85px)',
            bottom:'-8%', right:'-5%', animation:'blobFloat2 24s ease-in-out infinite' }} />
          <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
            background:'rgba(179,215,255,0.40)', filter:'blur(70px)',
            top:'40%', left:'35%', animation:'blobFloat3 28s ease-in-out infinite' }} />
          <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%',
            background:'rgba(37,99,235,0.05)', filter:'blur(80px)',
            top:'10%', right:'15%', animation:'blobFloat1 22s ease-in-out infinite reverse' }} />
        </>
      )}
    </div>
  )
}

