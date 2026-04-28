/**
 * Scroll / layout constants and target computation ported from the VAA
 * announcement page bundle (module 6687 + scroll closure in page chunk).
 */

export const VAA_U = {
  curl: { amount: -1, tightness: 1, origin: 0, originEdge: 0 },
  scroll: {
    positionYStart: -0.51,
    positionYStartMobile: -0.25,
    positionYEnd: 0.64,
    positionYEndMobile: 0.29,
  },
  animation: {
    scaleBase: 0.41,
    scaleTarget: 1,
    scaleTargetAt: 0.22,
    startRotation: -45,
    startRotationAt: 0.16,
    exitStart: 0.68,
    exitEnd: 1,
    exitScale: 0.58,
    exitRotation: 16,
  },
} as const

export const VAA_LIGHT1 = {
  intensity: 1.14,
  position: [12.92, 5, 10] as const,
}
export const VAA_LIGHT2 = {
  intensity: 0.8,
  position: [8.34, 5, 10] as const,
}
export const VAA_MAT = {
  matteRoughness: 0.25,
  reflectiveStrength: 0.37,
  bevelSize: 0.0006,
  bevelStrength: 1.6,
  foilSaturation: 0.11,
  foilOpacity: 0.44,
  foilContrast: 1.68,
} as const

export const VAA_CAMERA = {
  fov: 20,
  position: [0, 0, 50] as const,
} as const

export interface CertificateTarget {
  scale: number
  positionY: number
  tiltDeg: number
  curlAmount: number
  t: number
  scrollY: number
}

/** Matches layout chunk 2757 `l.k()` — visual viewport height from CSS var or window. */
export function getInitialVhPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--initial-vh').trim()
  const m = raw.match(/^([\d.]+)px$/)
  return m ? parseFloat(m[1]) : window.innerHeight
}

export function computeCertificateTarget(
  scrollY: number,
  innerWidth: number,
  innerHeight: number,
  mobile: boolean,
  scrollOffsetVh = 0,
): CertificateTarget {
  const v = VAA_U
  const i = v.animation
  const r = mobile ? getInitialVhPx() : innerHeight
  const o = scrollY
  const a = Math.max(0, o - (scrollOffsetVh / 100) * r)

  if (mobile) {
    const n = Math.max(0, o - 0 * r)
    const tProg = Math.max(0, Math.min(1, n / (1.5 * r)))
    const l = 1.74 / (innerWidth / innerHeight)
    const sMob = v.scroll

    let scale: number
    if (tProg <= i.scaleTargetAt) {
      const t = i.scaleTargetAt > 0 ? tProg / i.scaleTargetAt : 1
      scale = i.scaleBase + (i.scaleTarget - i.scaleBase) * t
    } else if (tProg < i.exitStart) {
      scale = i.scaleTarget
    } else if (tProg <= i.exitEnd) {
      const t = i.exitEnd > i.exitStart ? (tProg - i.exitStart) / (i.exitEnd - i.exitStart) : 1
      scale = i.scaleTarget + (i.exitScale - i.scaleTarget) * t
    } else {
      scale = i.exitScale
    }

    let tiltDeg: number
    if (tProg <= i.startRotationAt) {
      const t = i.startRotationAt > 0 ? tProg / i.startRotationAt : 1
      tiltDeg = i.startRotation * (1 - t)
    } else if (tProg < i.exitStart) {
      tiltDeg = 0
    } else if (tProg <= i.exitEnd) {
      const t = i.exitEnd > i.exitStart ? (tProg - i.exitStart) / (i.exitEnd - i.exitStart) : 1
      tiltDeg = i.exitRotation * t
    } else {
      tiltDeg = i.exitRotation
    }

    const positionY =
      (sMob.positionYStartMobile + tProg * (sMob.positionYEndMobile - sMob.positionYStartMobile)) * l
    const curlAmount = v.curl.amount * Math.max(0, 1 - tProg / (i.scaleTargetAt || 0.33))
    return { scale, positionY, tiltDeg, curlAmount, t: tProg, scrollY: n }
  }

  const s = Math.max(0, Math.min(1, a / (3 * r)))
  const u = 1.74 / (innerWidth / innerHeight)
  const positionY =
    (v.scroll.positionYStart + s * (v.scroll.positionYEnd - v.scroll.positionYStart)) * u

  let scale: number
  if (s <= i.scaleTargetAt) {
    const t = i.scaleTargetAt > 0 ? s / i.scaleTargetAt : 1
    scale = i.scaleBase + (i.scaleTarget - i.scaleBase) * t
  } else if (s < i.exitStart) {
    scale = i.scaleTarget
  } else if (s <= i.exitEnd) {
    const t = i.exitEnd > i.exitStart ? (s - i.exitStart) / (i.exitEnd - i.exitStart) : 1
    scale = i.scaleTarget + (i.exitScale - i.scaleTarget) * t
  } else {
    scale = i.exitScale
  }

  let tiltDeg: number
  if (s <= i.startRotationAt) {
    const t = i.startRotationAt > 0 ? s / i.startRotationAt : 1
    tiltDeg = i.startRotation * (1 - t)
  } else if (s < i.exitStart) {
    tiltDeg = 0
  } else if (s <= i.exitEnd) {
    const t = i.exitEnd > i.exitStart ? (s - i.exitStart) / (i.exitEnd - i.exitStart) : 1
    tiltDeg = i.exitRotation * t
  } else {
    tiltDeg = i.exitRotation
  }

  const curlAmount = v.curl.amount * Math.max(0, 1 - s / (i.scaleTargetAt || 0.33))
  return { scale, positionY, tiltDeg, curlAmount, t: s, scrollY: a }
}

export function smoothCertificateVisual(
  current: CertificateTarget,
  target: CertificateTarget,
): CertificateTarget {
  const lerp = (from: number, to: number, k: number) => from + (to - from) * k
  const scale = lerp(current.scale, target.scale, 0.12)
  const positionY = lerp(current.positionY, target.positionY, 0.12)
  const tiltDeg = lerp(current.tiltDeg, target.tiltDeg, 0.18)
  const curlAmount = lerp(current.curlAmount, target.curlAmount, 0.54)
  return {
    scale,
    positionY,
    tiltDeg,
    curlAmount,
    t: target.t,
    scrollY: target.scrollY,
  }
}
