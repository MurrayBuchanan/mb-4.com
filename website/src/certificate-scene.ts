import * as THREE from 'three'
import certificateFrag from './shaders/certificate.frag.glsl?raw'
import certificateVert from './shaders/certificate.vert.glsl?raw'
import {
  VAA_CAMERA,
  VAA_LIGHT1,
  VAA_LIGHT2,
  VAA_MAT,
  VAA_U,
  computeCertificateTarget,
  getInitialVhPx,
  smoothCertificateVisual,
  type CertificateTarget,
} from './vaa-scroll.ts'

export interface CertificateSceneResult {
  dispose: () => void
  isWebGL: true
}

/** Same denominator as production page RAF: max(body scroll range, 1). */
function maxScrollY(): number {
  return Math.max(1, document.body.scrollHeight - window.innerHeight)
}

/** Fill viewport with certificate plane (cover fit). */
function setCameraDistanceForPlane(
  camera: THREE.PerspectiveCamera,
  meshScale: number,
  planeAspect: number,
  fill = 1,
): void {
  const vFov = (camera.fov * Math.PI) / 180
  const tanHalf = Math.tan(vFov / 2)
  const plateH = meshScale * 1
  const plateW = meshScale * planeAspect
  const a = Math.max(0.2, camera.aspect)
  const distV = plateH / (2 * tanHalf * fill)
  const distH = plateW / (2 * tanHalf * a * fill)
  const z = THREE.MathUtils.clamp(Math.min(distV, distH), 0.6, 160)
  camera.position.set(VAA_CAMERA.position[0], VAA_CAMERA.position[1], z)
}

function loadTextures(mobile: boolean): Promise<{ map: THREE.Texture; foil: THREE.Texture; aspect: number }> {
  const loader = new THREE.TextureLoader()
  const certUrl = mobile ? '/images/certificate_mobile.png' : '/images/certificate.png'
  const foilUrl = mobile ? '/images/certificate_mobile_foil.png' : '/images/certificate_foil.png'

  return new Promise((resolve, reject) => {
    let map: THREE.Texture | undefined
    let foil: THREE.Texture | undefined
    let pending = 2
    const done = () => {
      pending--
      if (pending === 0 && map && foil) {
        for (const t of [map, foil]) {
          t.colorSpace = THREE.SRGBColorSpace
          t.premultiplyAlpha = false
          t.needsUpdate = true
        }
        const aspect = (map.image as HTMLImageElement).width / (map.image as HTMLImageElement).height
        resolve({ map, foil, aspect })
      }
    }
    const err = (e: unknown) => reject(e)
    loader.load(
      certUrl,
      (t: THREE.Texture) => {
        map = t
        done()
      },
      undefined,
      err,
    )
    loader.load(
      foilUrl,
      (t: THREE.Texture) => {
        foil = t
        done()
      },
      undefined,
      err,
    )
  })
}

export async function initCertificateScene(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
): Promise<CertificateSceneResult | null> {
  const CERT_REVEAL_SCROLL_OFFSET_VH = 38
  const initialMobile = window.innerWidth <= 700
  let { map, foil, aspect } = await loadTextures(initialMobile)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    VAA_CAMERA.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  )
  camera.position.set(...VAA_CAMERA.position)

  const light1 = new THREE.SpotLight(0xffffff, VAA_LIGHT1.intensity, 0, Math.PI / 6, 0.5, 1)
  light1.position.set(...VAA_LIGHT1.position)
  const light2 = new THREE.SpotLight(0xffffff, VAA_LIGHT2.intensity, 0, Math.PI / 6, 0.5, 1)
  light2.position.set(...VAA_LIGHT2.position)
  scene.add(light1)
  scene.add(light2)
  light1.target.position.set(0, 0, 0)
  light2.target.position.set(0, 0, 0)
  scene.add(light1.target)
  scene.add(light2.target)

  const geo = new THREE.PlaneGeometry(aspect, 1, 128, 128)
  const uniforms = {
    map: { value: map },
    uFoilMap: { value: foil },
    matteRoughness: { value: VAA_MAT.matteRoughness },
    reflectiveStrength: { value: VAA_MAT.reflectiveStrength },
    uCameraPosition: { value: new THREE.Vector3(...VAA_CAMERA.position) },
    uLight1Position: { value: new THREE.Vector3(...VAA_LIGHT1.position) },
    uLight1Intensity: { value: VAA_LIGHT1.intensity },
    uLight2Position: { value: new THREE.Vector3(...VAA_LIGHT2.position) },
    uLight2Intensity: { value: VAA_LIGHT2.intensity },
    uTime: { value: 0 },
    uScrollOffset: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uBevelSize: { value: VAA_MAT.bevelSize },
    uBevelStrength: { value: VAA_MAT.bevelStrength },
    uFoilSaturation: { value: VAA_MAT.foilSaturation },
    uFoilOpacity: { value: VAA_MAT.foilOpacity },
    uFoilContrast: { value: VAA_MAT.foilContrast },
    uCurlAmount: { value: VAA_U.curl.amount },
    uCurlTightness: { value: VAA_U.curl.tightness },
    uCurlOrigin: { value: VAA_U.curl.origin },
    uCurlOriginEdge: { value: VAA_U.curl.originEdge },
    uAspect: { value: aspect },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: certificateVert,
    fragmentShader: certificateFrag,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: true,
    side: THREE.DoubleSide,
    lights: false,
    glslVersion: THREE.GLSL1,
  })

  const mesh = new THREE.Mesh(geo, material)
  scene.add(mesh)

  const mouseTarget = new THREE.Vector2(0, 0)
  const mouseSmoothed = new THREE.Vector2(0, 0)
  const camWorld = new THREE.Vector3()

  let visual = computeCertificateTarget(
    window.scrollY,
    window.innerWidth,
    window.innerHeight,
    initialMobile,
    CERT_REVEAL_SCROLL_OFFSET_VH,
  )
  let smoothed: CertificateTarget = { ...visual }

  const onMouseMove = (e: MouseEvent): void => {
    const w = window.innerWidth
    const h = window.innerHeight
    mouseTarget.x = (e.clientX / w) * 2 - 1
    mouseTarget.y = -(e.clientY / h) * 2 + 1
  }
  window.addEventListener('mousemove', onMouseMove)

  const onLoopReset = (): void => {
    const w = window.innerWidth
    const h = window.innerHeight
    const mobile = w <= 700
    visual = computeCertificateTarget(window.scrollY, w, h, mobile, CERT_REVEAL_SCROLL_OFFSET_VH)
    smoothed = { ...visual }
    mouseTarget.set(0, 0)
    mouseSmoothed.set(0, 0)
    mesh.scale.setScalar(smoothed.scale)
    mesh.position.y = smoothed.positionY
    mesh.rotation.z = (smoothed.tiltDeg * Math.PI) / 180
    material.uniforms.uCurlAmount.value = smoothed.curlAmount
    setCameraDistanceForPlane(camera, smoothed.scale, aspect)
  }
  window.addEventListener('vaa:loop-reset', onLoopReset as EventListener)

  let raf = 0
  let alive = true

  const resize = (): void => {
    const rect = container.getBoundingClientRect()
    let w = Math.max(1, Math.floor(rect.width))
    let h = Math.max(1, Math.floor(rect.height))
    if (w < 2 || h < 2) {
      w = Math.max(1, window.innerWidth)
      h = Math.floor(window.innerWidth <= 700 ? getInitialVhPx() * 1.2 : window.innerHeight)
    }
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }

  const ro = new ResizeObserver(() => resize())
  ro.observe(container)
  ro.observe(document.documentElement)
  resize()

  const tick = (): void => {
    if (!alive) return
    raf = requestAnimationFrame(tick)

    const w = window.innerWidth
    const h = window.innerHeight
    const mobile = w <= 700

    visual = computeCertificateTarget(window.scrollY, w, h, mobile, CERT_REVEAL_SCROLL_OFFSET_VH)
    smoothed = smoothCertificateVisual(smoothed, visual)

    mesh.scale.setScalar(smoothed.scale)
    mesh.position.y = smoothed.positionY
    mesh.rotation.z = (smoothed.tiltDeg * Math.PI) / 180

    setCameraDistanceForPlane(camera, smoothed.scale, aspect)

    material.uniforms.uCurlAmount.value = smoothed.curlAmount
    material.uniforms.uTime.value = performance.now() / 1000
    material.uniforms.uScrollOffset.value = (window.scrollY / maxScrollY()) * 4

    mouseSmoothed.x += (mouseTarget.x - mouseSmoothed.x) * 0.06
    mouseSmoothed.y += (mouseTarget.y - mouseSmoothed.y) * 0.06
    material.uniforms.uMouse.value.copy(mouseSmoothed)

    camera.getWorldPosition(camWorld)
    material.uniforms.uCameraPosition.value.copy(camWorld)

    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(tick)

  const dispose = (): void => {
    alive = false
    cancelAnimationFrame(raf)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('vaa:loop-reset', onLoopReset as EventListener)
    ro.disconnect()
    mesh.geometry.dispose()
    material.dispose()
    map.dispose()
    foil.dispose()
    renderer.dispose()
  }

  return { dispose, isWebGL: true }
}
