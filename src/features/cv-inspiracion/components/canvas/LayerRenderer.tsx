'use client'

import { useEffect, useRef, useState } from 'react'
import { Text, Rect, Image as KonvaImage, Circle, Line, Arrow, RegularPolygon, Star, Path, Group } from 'react-konva'
import Konva from 'konva'
import type {
  Layer, TextLayer, RectLayer, ImageLayer, CircleLayer,
  LineLayer, PolygonLayer, StarLayer, PathLayer, FrameLayer,
} from '../../types/layer.types'

export interface LayerRendererProps {
  layer: Layer
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string) => void
  onTextDblClick: (layer: TextLayer, node: Konva.Text) => void
  onOverflow?: (id: string, has: boolean) => void
  onDragBound?: (id: string, pos: { x: number; y: number }) => { x: number; y: number }
}

function TextNode({ layer, onSelect, onDragEnd, onTransformEnd, onTextDblClick, onOverflow, onDragBound }: LayerRendererProps & { layer: TextLayer }) {
  const textRef = useRef<Konva.Text>(null)

  useEffect(() => {
    // getTextHeight() on a height-constrained node returns only the clipped height,
    // so we measure with a temporary unconstrained node to get the natural height.
    let cancelled = false
    const raf = requestAnimationFrame(() => {
      if (cancelled) return
      if (!layer.height) { onOverflow?.(layer.id, false); return }
      const tempText = new Konva.Text({
        text: layer.text,
        fontSize: layer.fontSize ?? 12,
        fontFamily: layer.fontFamily ?? 'Poppins, sans-serif',
        fontStyle: [layer.fontStyle ?? '', layer.fontWeight ?? ''].join(' ').trim() || 'normal',
        lineHeight: layer.lineHeight ?? 1.2,
        letterSpacing: layer.letterSpacing ?? 0,
        width: layer.width,
        wrap: layer.wrap ?? 'word',
      })
      // getHeight() returns full natural height when height attr is not set;
      // getTextHeight() is deprecated in Konva v10 and returns only fontSize
      const naturalH = tempText.getHeight()
      tempText.destroy()
      onOverflow?.(layer.id, naturalH > layer.height + 1)
    })
    return () => { cancelled = true; cancelAnimationFrame(raf) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.text, layer.fontSize, layer.width, layer.height, layer.fontFamily, layer.lineHeight, layer.letterSpacing, layer.fontWeight, layer.fontStyle, layer.wrap])

  useEffect(() => {
    return () => { onOverflow?.(layer.id, false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Text
      ref={textRef}
      id={layer.id}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      text={layer.text}
      fontSize={layer.fontSize ?? 12}
      fontFamily={layer.fontFamily ?? 'Poppins, sans-serif'}
      fontStyle={[layer.fontStyle ?? '', layer.fontWeight ?? ''].join(' ').trim() || 'normal'}
      fill={layer.fill ?? '#000000'}
      align={layer.align ?? 'left'}
      verticalAlign={layer.verticalAlign ?? 'top'}
      lineHeight={layer.lineHeight ?? 1.2}
      letterSpacing={layer.letterSpacing ?? 0}
      wrap={layer.wrap ?? 'word'}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      rotation={layer.rotation ?? 0}
      draggable={!layer.locked}
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      onDblClick={e => onTextDblClick(layer, e.target as Konva.Text)}
      onDblTap={e => onTextDblClick(layer, e.target as Konva.Text)}
      dragBoundFunc={onDragBound ? (pos) => onDragBound(layer.id, pos) : undefined}
      onDragEnd={e => onDragEnd(layer.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd(layer.id)}
    />
  )
}

function RectNode({ layer, onSelect, onDragEnd, onTransformEnd, onDragBound }: LayerRendererProps & { layer: RectLayer }) {
  return (
    <Rect
      id={layer.id}
      x={layer.x}
      y={layer.y}
      width={layer.width ?? 100}
      height={layer.height ?? 100}
      fill={layer.fill ?? 'transparent'}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth ?? 0}
      cornerRadius={layer.cornerRadius ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      rotation={layer.rotation ?? 0}
      draggable={!layer.locked}
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      dragBoundFunc={onDragBound ? (pos) => onDragBound(layer.id, pos) : undefined}
      onDragEnd={e => onDragEnd(layer.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd(layer.id)}
    />
  )
}

function CircleNode({ layer, onSelect, onDragEnd, onTransformEnd, onDragBound }: LayerRendererProps & { layer: CircleLayer }) {
  return (
    <Circle
      id={layer.id}
      x={layer.x}
      y={layer.y}
      radius={layer.radius}
      fill={layer.fill ?? 'transparent'}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      rotation={layer.rotation ?? 0}
      draggable={!layer.locked}
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      dragBoundFunc={onDragBound ? (pos) => onDragBound(layer.id, pos) : undefined}
      onDragEnd={e => onDragEnd(layer.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd(layer.id)}
    />
  )
}

function PolygonNode({ layer, onSelect, onDragEnd, onTransformEnd, onDragBound }: LayerRendererProps & { layer: PolygonLayer }) {
  return (
    <RegularPolygon
      id={layer.id}
      x={layer.x}
      y={layer.y}
      sides={layer.sides}
      radius={layer.radius}
      fill={layer.fill ?? 'transparent'}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth ?? 0}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      draggable={!layer.locked}
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      dragBoundFunc={onDragBound ? (pos) => onDragBound(layer.id, pos) : undefined}
      onDragEnd={e => onDragEnd(layer.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd(layer.id)}
    />
  )
}

function StarNode({ layer, onSelect, onDragEnd, onTransformEnd, onDragBound }: LayerRendererProps & { layer: StarLayer }) {
  return (
    <Star
      id={layer.id}
      x={layer.x}
      y={layer.y}
      numPoints={layer.numPoints}
      innerRadius={layer.innerRadius}
      outerRadius={layer.outerRadius}
      fill={layer.fill ?? 'transparent'}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth ?? 0}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      draggable={!layer.locked}
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      dragBoundFunc={onDragBound ? (pos) => onDragBound(layer.id, pos) : undefined}
      onDragEnd={e => onDragEnd(layer.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd(layer.id)}
    />
  )
}

function PathNode({ layer, onSelect, onDragEnd, onTransformEnd, onDragBound }: LayerRendererProps & { layer: PathLayer }) {
  return (
    <Path
      id={layer.id}
      x={layer.x}
      y={layer.y}
      data={layer.data}
      fill={layer.fill ?? 'transparent'}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth ?? 0}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      scaleX={layer.scaleX ?? 1}
      scaleY={layer.scaleY ?? 1}
      draggable={!layer.locked}
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      dragBoundFunc={onDragBound ? (pos) => onDragBound(layer.id, pos) : undefined}
      onDragEnd={e => onDragEnd(layer.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd(layer.id)}
    />
  )
}

function LineNode({ layer, onSelect, onDragEnd, onTransformEnd, onDragBound }: LayerRendererProps & { layer: LineLayer }) {
  const pts      = layer.points
  const color    = layer.stroke ?? '#000000'
  const sw       = layer.strokeWidth ?? 1
  const dotR     = Math.max(sw * 1.5, 4)
  const startCap = layer.startCap ?? 'none'
  const endCap   = layer.endCap   ?? 'none'
  const hasArrow = startCap === 'arrow' || endCap === 'arrow'

  return (
    <Group
      id={layer.id}
      x={layer.x ?? 0}
      y={layer.y ?? 0}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      draggable={!layer.locked}
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      dragBoundFunc={onDragBound ? (pos) => onDragBound(layer.id, pos) : undefined}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(layer.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd(layer.id)}
    >
      {hasArrow ? (
        <Arrow
          x={0} y={0} points={pts}
          stroke={color} strokeWidth={sw} fill={color}
          dash={layer.dash} lineCap={layer.lineCap ?? 'round'}
          pointerAtBeginning={startCap === 'arrow'}
          pointerAtEnding={endCap === 'arrow'}
          pointerLength={layer.pointerLength ?? 10}
          pointerWidth={layer.pointerWidth ?? 8}
          listening={false}
        />
      ) : (
        <Line
          x={0} y={0} points={pts}
          stroke={color} strokeWidth={sw}
          dash={layer.dash} lineCap={layer.lineCap ?? 'butt'}
          listening={false}
        />
      )}
      {startCap === 'dot' && (
        <Circle x={pts[0]} y={pts[1]} radius={dotR} fill={color} listening={false} />
      )}
      {endCap === 'dot' && (
        <Circle x={pts[pts.length - 2]} y={pts[pts.length - 1]} radius={dotR} fill={color} listening={false} />
      )}
      <Line x={0} y={0} points={pts} stroke="transparent" strokeWidth={Math.max(12, sw)} />
    </Group>
  )
}

function ImageNode({ layer, onSelect, onDragEnd, onTransformEnd, onDragBound }: LayerRendererProps & { layer: ImageLayer }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!layer.src || layer.src.startsWith('USUARIO_')) return
    const el = new window.Image()
    el.onload = () => setImg(el)
    if (!layer.src.startsWith('data:')) el.crossOrigin = 'anonymous'
    el.src = layer.src
    if (el.complete && el.naturalWidth > 0) setImg(el)
  }, [layer.src])

  if (!img) return null

  const W = layer.width ?? 80
  const H = layer.height ?? 80

  const groupProps = {
    id:       layer.id,
    x:        layer.x,
    y:        layer.y,
    rotation: layer.rotation ?? 0,
    opacity:  layer.opacity ?? 1,
    visible:  layer.visible !== false,
    draggable: !layer.locked,
    onClick:  () => onSelect(layer.id),
    onTap:    () => onSelect(layer.id),
    dragBoundFunc: onDragBound ? (pos: { x: number; y: number }) => onDragBound(layer.id, pos) : undefined,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(layer.id, e.target.x(), e.target.y()),
    onTransformEnd: () => onTransformEnd(layer.id),
  }

  if (layer.clipShape === 'circle') {
    const r = Math.min(W, H) / 2
    function clipCircle(ctx: Konva.Context) {
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2, false)
    }
    return (
      <Group {...groupProps}>
        <Group clipFunc={clipCircle} width={W} height={H}>
          <KonvaImage x={0} y={0} width={W} height={H} image={img} listening={false} />
        </Group>
        <Rect x={0} y={0} width={W} height={H} fill="transparent" />
        {layer.strokeWidth ? (
          <Circle x={W / 2} y={H / 2} radius={r}
            fill="transparent" stroke={layer.stroke ?? '#4B6BFB'} strokeWidth={layer.strokeWidth} listening={false} />
        ) : null}
      </Group>
    )
  }

  if (layer.clipShape === 'pentagon') {
    const r = Math.min(W, H) / 2
    function clipPentagon(ctx: Konva.Context) {
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
        if (i === 0) ctx.moveTo(W / 2 + r * Math.cos(a), H / 2 + r * Math.sin(a))
        else         ctx.lineTo(W / 2 + r * Math.cos(a), H / 2 + r * Math.sin(a))
      }
      ctx.closePath()
    }
    return (
      <Group {...groupProps}>
        <Group clipFunc={clipPentagon} width={W} height={H}>
          <KonvaImage x={0} y={0} width={W} height={H} image={img} listening={false} />
        </Group>
        <Rect x={0} y={0} width={W} height={H} fill="transparent" />
        {layer.strokeWidth ? (
          <RegularPolygon x={W / 2} y={H / 2} sides={5} radius={r}
            fill="transparent" stroke={layer.stroke ?? '#4B6BFB'} strokeWidth={layer.strokeWidth} listening={false} />
        ) : null}
      </Group>
    )
  }

  // Plain image — supports cornerRadius and stroke natively in Konva
  return (
    <KonvaImage
      id={layer.id}
      x={layer.x}
      y={layer.y}
      width={W}
      height={H}
      image={img}
      cornerRadius={layer.cornerRadius ?? 0}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      rotation={layer.rotation ?? 0}
      draggable={!layer.locked}
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      dragBoundFunc={onDragBound ? (pos) => onDragBound(layer.id, pos) : undefined}
      onDragEnd={e => onDragEnd(layer.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd(layer.id)}
    />
  )
}

function FrameNode({ layer, onSelect, onDragEnd, onTransformEnd, onDragBound }: LayerRendererProps & { layer: FrameLayer }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!layer.imageSrc) { setImg(null); return }
    const el = new window.Image()
    el.onload = () => setImg(el)
    if (!layer.imageSrc.startsWith('data:')) el.crossOrigin = 'anonymous'
    el.src = layer.imageSrc
    if (el.complete && el.naturalWidth > 0) setImg(el)
  }, [layer.imageSrc])

  const W = layer.width ?? 160
  const H = layer.height ?? 160
  const cr = layer.cornerRadius ?? 0

  function clipFunc(ctx: Konva.Context) {
    if (layer.shape === 'circle') {
      ctx.arc(W / 2, H / 2, Math.min(W, H) / 2, 0, Math.PI * 2, false)
    } else if (layer.shape === 'pentagon') {
      const r = Math.min(W, H) / 2
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
        if (i === 0) ctx.moveTo(W / 2 + r * Math.cos(a), H / 2 + r * Math.sin(a))
        else         ctx.lineTo(W / 2 + r * Math.cos(a), H / 2 + r * Math.sin(a))
      }
      ctx.closePath()
    } else if (cr > 0) {
      ctx.moveTo(cr, 0); ctx.lineTo(W - cr, 0)
      ctx.quadraticCurveTo(W, 0, W, cr)
      ctx.lineTo(W, H - cr)
      ctx.quadraticCurveTo(W, H, W - cr, H)
      ctx.lineTo(cr, H)
      ctx.quadraticCurveTo(0, H, 0, H - cr)
      ctx.lineTo(0, cr)
      ctx.quadraticCurveTo(0, 0, cr, 0)
      ctx.closePath()
    } else {
      ctx.rect(0, 0, W, H)
    }
  }

  // Cover-fit the image inside the frame
  const ir = (() => {
    if (!img || !img.naturalWidth) return { x: 0, y: 0, w: W, h: H }
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight) * (layer.imageScale ?? 1)
    const w = img.naturalWidth * s
    const h = img.naturalHeight * s
    return { x: (layer.imageX ?? 0) + (W - w) / 2, y: (layer.imageY ?? 0) + (H - h) / 2, w, h }
  })()

  return (
    <Group
      id={layer.id}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity ?? 1}
      visible={layer.visible !== false}
      draggable={!layer.locked}
      onClick={() => onSelect(layer.id)}
      onTap={() => onSelect(layer.id)}
      dragBoundFunc={onDragBound ? (pos) => onDragBound(layer.id, pos) : undefined}
      onDragEnd={e => onDragEnd(layer.id, e.target.x(), e.target.y())}
      onTransformEnd={() => onTransformEnd(layer.id)}
    >
      {/* Clipped area: image or placeholder */}
      <Group clipFunc={clipFunc} width={W} height={H}>
        {img ? (
          <KonvaImage x={ir.x} y={ir.y} width={ir.w} height={ir.h} image={img} listening={false} />
        ) : (
          <>
            <Rect x={0} y={0} width={W} height={H} fill="#EEF2FF" listening={false} />
            {/* Placeholder icon */}
            <Rect x={W / 2 - 18} y={H / 2 - 14} width={36} height={28} cornerRadius={5} fill="#c7d2fe" listening={false} />
            <Circle x={W / 2 - 8} y={H / 2 - 4} radius={5} fill="#a5b4fc" listening={false} />
            <Path
              x={W / 2 - 18} y={H / 2 - 2}
              data="M0 18 L12 6 L20 14 L26 8 L36 18 Z"
              fill="#818cf8" listening={false}
            />
          </>
        )}
      </Group>
      {/* Hit area covers entire frame */}
      <Rect x={0} y={0} width={W} height={H} fill="transparent" />
      {/* Border on top (not clipped) */}
      {layer.shape === 'circle' ? (
        <Circle x={W / 2} y={H / 2} radius={Math.min(W, H) / 2}
          fill="transparent" stroke={layer.stroke ?? '#4B6BFB'} strokeWidth={layer.strokeWidth ?? 2} listening={false} />
      ) : layer.shape === 'pentagon' ? (
        <RegularPolygon x={W / 2} y={H / 2} sides={5} radius={Math.min(W, H) / 2}
          fill="transparent" stroke={layer.stroke ?? '#4B6BFB'} strokeWidth={layer.strokeWidth ?? 2} listening={false} />
      ) : (
        <Rect x={0} y={0} width={W} height={H} cornerRadius={cr}
          fill="transparent" stroke={layer.stroke ?? '#4B6BFB'} strokeWidth={layer.strokeWidth ?? 2} listening={false} />
      )}
    </Group>
  )
}

export function LayerRenderer(props: LayerRendererProps) {
  const { layer, onOverflow } = props
  if (layer.visible === false) { return null }
  switch (layer.type) {
    case 'text':    return <TextNode    {...props} layer={layer as TextLayer} onOverflow={onOverflow} />
    case 'rect':    return <RectNode    {...props} layer={layer as RectLayer} />
    case 'circle':  return <CircleNode  {...props} layer={layer as CircleLayer} />
    case 'polygon': return <PolygonNode {...props} layer={layer as PolygonLayer} />
    case 'star':    return <StarNode    {...props} layer={layer as StarLayer} />
    case 'path':    return <PathNode    {...props} layer={layer as PathLayer} />
    case 'line':    return <LineNode    {...props} layer={layer as LineLayer} />
    case 'image':   return <ImageNode   {...props} layer={layer as ImageLayer} />
    case 'frame':   return <FrameNode   {...props} layer={layer as FrameLayer} />
    default:        return null
  }
}