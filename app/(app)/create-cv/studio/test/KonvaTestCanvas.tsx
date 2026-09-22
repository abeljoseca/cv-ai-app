'use client'

import { useState } from 'react'
import { Stage, Layer, Rect, Text, Circle } from 'react-konva'

const SIDEBAR_COLOR = '#444444'
const ACCENT = '#4B6BFB'

export default function KonvaTestCanvas() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>(['Konva canvas inicializado.'])

  function addLog(msg: string) {
    setLog(prev => [...prev.slice(-4), msg])
  }

  return (
    <div className="flex flex-col gap-4">
      <Stage
        width={300}
        height={200}
        style={{ display: 'block', border: '1px solid #e2e8f0', borderRadius: 8 }}
        onClick={e => {
          if (e.target === e.target.getStage()) {
            setSelectedId(null)
            addLog('Stage clicked — deselected.')
          }
        }}
      >
        <Layer>
          {/* Sidebar rect */}
          <Rect
            id="sidebar"
            x={0} y={0}
            width={110} height={200}
            fill={selectedId === 'sidebar' ? '#555555' : SIDEBAR_COLOR}
            stroke={selectedId === 'sidebar' ? ACCENT : undefined}
            strokeWidth={selectedId === 'sidebar' ? 1.5 : 0}
            draggable
            onClick={() => { setSelectedId('sidebar'); addLog('Sidebar selected — try dragging!') }}
            onDragEnd={e => addLog(`Sidebar moved to (${Math.round(e.target.x())}, ${Math.round(e.target.y())})`)}
          />

          {/* Profile circle */}
          <Circle
            id="photo"
            x={55} y={50}
            radius={28}
            fill="#888888"
            stroke={selectedId === 'photo' ? ACCENT : 'rgba(255,255,255,0.5)'}
            strokeWidth={selectedId === 'photo' ? 2 : 1.5}
            draggable
            onClick={() => { setSelectedId('photo'); addLog('Photo selected — try dragging!') }}
            onDragEnd={e => addLog(`Photo moved to (${Math.round(e.target.x())}, ${Math.round(e.target.y())})`)}
          />

          {/* Name text */}
          <Text
            id="name"
            x={10} y={95}
            width={90}
            text="NOMBRE APELLIDO"
            fontSize={9}
            fontFamily="Poppins, sans-serif"
            fontStyle="bold"
            fill="#ffffff"
            align="center"
            draggable
            onClick={() => { setSelectedId('name'); addLog('Name text selected — try dragging!') }}
            onDragEnd={e => addLog(`Text moved to (${Math.round(e.target.x())}, ${Math.round(e.target.y())})`)}
          />

          {/* Content area */}
          <Rect
            id="content-bg"
            x={110} y={0}
            width={190} height={200}
            fill="#ffffff"
            draggable
            onClick={() => { setSelectedId('content-bg'); addLog('Content area selected — try dragging!') }}
            onDragEnd={e => addLog(`Content moved to (${Math.round(e.target.x())}, ${Math.round(e.target.y())})`)}
          />

          {/* Draggable text block */}
          <Rect
            id="exp-block"
            x={120} y={20}
            width={170} height={60}
            fill={selectedId === 'exp-block' ? '#EEF2FF' : '#F8FAFC'}
            stroke={selectedId === 'exp-block' ? ACCENT : '#E2E8F0'}
            strokeWidth={1}
            cornerRadius={3}
            draggable
            onClick={() => { setSelectedId('exp-block'); addLog('Experience block selected — try dragging!') }}
            onDragEnd={e => addLog(`Block moved to (${Math.round(e.target.x())}, ${Math.round(e.target.y())})`)}
          />
          <Text
            x={126} y={26}
            width={158}
            text="Experiencia Laboral"
            fontSize={8}
            fontFamily="Poppins, sans-serif"
            fontStyle="bold"
            fill="#333333"
            listening={false}
          />
          <Text
            x={126} y={40}
            width={158}
            text={'Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit.'}
            fontSize={7}
            fontFamily="Poppins, sans-serif"
            fill="#666666"
            lineHeight={1.4}
            listening={false}
          />
        </Layer>
      </Stage>

      {/* Interaction log */}
      <div className="bg-[#0F172A] rounded-lg p-3 font-mono text-xs text-green-400 min-h-[80px]">
        {log.map((l, i) => <div key={i}>{'> '}{l}</div>)}
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        Si ves el canvas con barra lateral oscura y puedes arrastrar elementos, Konva funciona correctamente.
      </p>
    </div>
  )
}