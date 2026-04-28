import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import brandLogoUrl from './assets/brand_logo.svg'
import brandTitleUrl from './assets/brand_title.svg'
import brandCaptionUrl from './assets/brand_caption.svg'
import { initCertificateScene } from './certificate-scene.ts'
import { getInitialVhPx } from './vaa-scroll.ts'
import { VAA_THEME_SEQUENCE, type VAATheme } from './vaa-theme.ts'

/** Edit these to your profiles / portal. */
const NAV_LINKS = [
  { label: 'github', href: 'https://github.com' },
  { label: 'linkedin', href: 'https://www.linkedin.com' },
  { label: 'dev portal', href: '#' },
] as const

const ANNOUNCEMENT = 'ANNOUNCEMENT'
const MOBILE_MEDIA_QUERY = '(max-width: 700px)'
const THEME_COUNT = VAA_THEME_SEQUENCE.length

function randomThemeIndex(): number {
  return Math.floor(Math.random() * THEME_COUNT)
}

let loopThemeIndex = randomThemeIndex()

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const safe = h.length === 3 ? h.split('').map((c) => `${c}${c}`).join('') : h
  const n = Number.parseInt(safe, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return [r, g, b]
}

function srgbToLinear(c: number): number {
  const x = c / 255
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const light = Math.max(l1, l2)
  const dark = Math.min(l1, l2)
  return (light + 0.05) / (dark + 0.05)
}

function readableOn(bg: string, preferred: string, minimum = 4.5): string {
  if (contrastRatio(bg, preferred) >= minimum) return preferred
  const black = '#0D0D0D'
  const white = '#F5F5F5'
  return contrastRatio(bg, black) >= contrastRatio(bg, white) ? black : white
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function positiveMod(n: number, d: number): number {
  return ((n % d) + d) % d
}

function setTextContent(selector: string, text: string): void {
  const el = document.querySelector(selector)
  if (el) el.textContent = text
}

function applyTheme(theme: VAATheme): void {
  const root = document.documentElement
  const text = readableOn(theme.background, theme.text, 4.5)
  const border = readableOn(theme.background, theme.border, 3.2)
  const inputText = readableOn(theme.accent, text, 4.5)
  const buttonBg = readableOn(theme.background, theme.text, 3.2)
  const buttonText = readableOn(buttonBg, theme.accent, 4.5)
  root.style.setProperty('--vaa-blue', theme.background)
  root.style.setProperty('--vaa-blue-upper', theme.accent)
  root.style.setProperty('--vaa-ice', theme.background)
  root.style.setProperty('--vaa-text', text)
  root.style.setProperty('--vaa-topbar-bg', rgba(theme.background, 0.94))
  root.style.setProperty('--vaa-topbar-border', rgba(border, 0.28))
  root.style.setProperty('--vaa-footer-border', rgba(border, 0.45))
  root.style.setProperty('--vaa-input-border', rgba(border, 0.35))
  root.style.setProperty('--vaa-input-bg', theme.accent)
  root.style.setProperty('--vaa-input-text', inputText)
  root.style.setProperty('--vaa-footer-note', rgba(text, 0.82))
  root.style.setProperty('--vaa-footer-placeholder', rgba(text, 0.68))
  root.style.setProperty('--vaa-button-bg', buttonBg)
  root.style.setProperty('--vaa-button-text', buttonText)
  root.style.setProperty('--nav-rail-edge', rgba(border, 0.55))
  root.style.setProperty('--nav-rail-vrule', rgba(border, 0.38))
  root.style.setProperty('--nav-rail-pattern', rgba(border, 0.22))
  root.style.setProperty('--vaa-feature-text', text)
  root.style.setProperty('--vaa-feature-rule', rgba(border, 0.26))
  root.style.setProperty('--vaa-feature-pill', rgba(theme.accent, 0.5))
}

function currentLoopTheme(): VAATheme {
  return VAA_THEME_SEQUENCE[positiveMod(loopThemeIndex, THEME_COUNT)]
}

function lettersMarkup(s: string, baseDelayMs: number): string {
  return s
    .split('')
    .map(
      (ch, i) =>
        `<span class="vaa__title__char" style="animation-delay:${baseDelayMs + i * 70}ms">${ch}</span>`,
    )
    .join('')
}

const titleLine = lettersMarkup(ANNOUNCEMENT, 1200)

const navLinksHtml = NAV_LINKS.map((link) => {
  const ext = link.href.startsWith('http')
  const tgt = ext ? ' target="_blank" rel="noopener noreferrer"' : ''
  return `<a class="vaa__nav-rail__link" href="${link.href}"${tgt}><span class="vaa__nav-rail__link-arrow" aria-hidden="true">↗</span> ${link.label}</a>`
}).join('')

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div class="vaa">
  <div class="vaa__grain" aria-hidden="true" data-film-grain-overlay></div>

  <div class="vaa__masthead">
    <header class="vaa__nav-rail" role="banner">
      <div class="vaa__nav-rail__frame">
        <div class="vaa__nav-rail__inner">
          <a class="vaa__nav-rail__brand" href="/" aria-label="Home">
            <span class="vaa__nav-rail__brand-title" style="--brand-title-url: url('${brandTitleUrl}')" aria-hidden="true"></span>
            <span class="vaa__nav-rail__brand-caption" style="--brand-caption-url: url('${brandCaptionUrl}')" aria-hidden="true"></span>
          </a>
          <span class="vaa__nav-rail__vrule" aria-hidden="true"></span>
          <a class="vaa__nav-rail__mark" href="/" aria-label="Home">
            <span class="vaa__nav-rail__mark-logo" style="--brand-logo-url: url('${brandLogoUrl}')" aria-hidden="true"></span>
          </a>
          <span class="vaa__nav-rail__vrule" aria-hidden="true"></span>
          <div class="vaa__nav-rail__meta">
            <div class="vaa__nav-rail__meta-row">
              <span data-nav-date>--/--/--</span>
              <span class="vaa__nav-rail__meta-page">PAGE N/A</span>
            </div>
            <div class="vaa__nav-rail__meta-tag">[ VAA_ANNOUNCEMENT ]</div>
          </div>
          <span class="vaa__nav-rail__vrule" aria-hidden="true"></span>
          <div class="vaa__nav-rail__pattern" aria-hidden="true"></div>
          <span class="vaa__nav-rail__vrule" aria-hidden="true"></span>
          <div class="vaa__nav-rail__aside">
            <nav class="vaa__nav-rail__links" aria-label="Social and tools">
              ${navLinksHtml}
            </nav>
            <div class="vaa__nav-rail__clock" data-nav-clock>--:--</div>
          </div>
        </div>
      </div>
    </header>
    <div class="vaa__masthead__rule" aria-hidden="true"></div>
    <section class="vaa__masthead__announce" aria-label="Announcement">
      <h1 class="vaa__headline">
        <span class="vaa__title vaa__title--desktop">
          <span class="vaa__title-line">${titleLine}</span>
        </span>
        <span class="vaa__title vaa__title--mobile">
          <span class="vaa__title-line">${titleLine}</span>
        </span>
      </h1>
    </section>
  </div>

  <main class="vaa__main">
    <section class="vaa__feature-strip" aria-label="Virgil Abloh Archive feature">
      <article class="vaa__feature-card vaa__feature-card--lead">
        <div class="vaa__feature-meta">
          <span>V.A.A. ARCHIVE</span>
          <span>DD/MM/YY</span>
          <span>MISSION</span>
        </div>
        <h2 class="vaa__feature-title">The Virgil Abloh Archive</h2>
      </article>
      <article class="vaa__feature-card vaa__feature-card--detail">
        <div class="vaa__feature-pill" aria-hidden="true"></div>
        <div class="vaa__feature-meta">
          <span>V.A.A. ARCHIVE</span>
          <span>S-26</span>
          <span>V. 001</span>
        </div>
        <p class="vaa__feature-copy">
          The Virgil Abloh Archive is a collection of over 20,000 objects from Virgil's creative practice, spanning fashion,
          design, music, art, advertising, and writing.
        </p>
        <p class="vaa__feature-copy">
          The mission is to keep Virgil's ideas alive as an evolving record and an invitation to future builders.
        </p>
      </article>
    </section>
  </main>

  <section class="vaa__stage" aria-hidden="true">
    <div class="vaa__scroll-announce"></div>
    <div class="vaa__scroll-proxy"></div>
    <div class="vaa__cert-wrap" id="cert-wrap">
      <canvas id="cert-gl" class="vaa__cert-canvas" width="800" height="600"></canvas>
      <picture id="cert-fallback" class="vaa__cert-fallback" hidden>
        <source media="(max-width: 700px)" srcset="/images/certificate_mobile.png" />
        <img class="vaa__cert" src="/images/certificate.png" width="2124" height="3000" alt="" decoding="async" />
      </picture>
    </div>
  </section>

  <footer class="vaa__footer" id="vaa-footer">
    <div class="vaa__footer-top-meta">
      <span>V.A.A. ARCHIVE</span>
      <span>S-26</span>
      <span>V. 001</span>
    </div>
    <h2 class="vaa__footer-hero" aria-label="Join the archive">
      <span class="vaa__footer-hero-main">Join<br />archive</span>
    </h2>
    <div class="vaa__footer-spacer" aria-hidden="true"></div>
    <div class="vaa__footer-head">
      <span class="vaa__footer-head-title">MEMBERSHIP SIGNUP</span>
      <span class="vaa__footer-head-date" data-signup-date>DD/MM/YY</span>
      <span class="vaa__footer-head-issue">V. 001</span>
    </div>
    <p class="vaa__footer-lead">
      Free and open to all. Members receive first word on everything the Archive is working on: stories, books,
      exhibitions, events, and V.A.A. editions of Virgil's work.
    </p>
    <p class="vaa__footer-lead">
      For students, emerging creatives, and lifelong learners: Sign up for the Archive Toolkit, a set of free resources
      from the Archive refreshed periodically throughout the year.
    </p>
    <form class="vaa__form" id="vaa-form">
      <label class="vaa__sr-only" for="vaa-name">Name</label>
      <input class="vaa__input" type="text" id="vaa-name" name="name" placeholder="Name" autocomplete="name" />
      <label class="vaa__sr-only" for="vaa-email">Email Address</label>
      <input class="vaa__input" type="email" id="vaa-email" name="email" placeholder="Email Address" autocomplete="email" />
      <label class="vaa__consent" for="vaa-student">
        <input type="checkbox" id="vaa-student" name="student" />
        <span>I'm a student / emerging creative - send me the Archive Toolkit</span>
      </label>
      <button class="vaa__submit" type="submit">SIGN UP</button>
    </form>
    <p class="vaa__footer-note">By signing up, you agree to our Privacy Policy and Terms and Conditions.</p>
  </footer>
  <div class="vaa__loop-tail" aria-hidden="true"></div>
  <span class="vaa__brand-fixed" aria-hidden="true" style="--brand-logo-url: url('${brandLogoUrl}')"></span>
</div>
`

function setViewportVars(): void {
  const v = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--initial-vh', `${v}px`)
}

/** Subtle animated grain offset (matches VAA layout grain RAF). */
function initFilmGrainJitter(): void {
  const el = document.querySelector<HTMLElement>('[data-film-grain-overlay]')
  if (!el) return
  let frame = 0
  const tick = (): void => {
    requestAnimationFrame(tick)
    frame++
    if (frame % 3 !== 0) return
    const ox = Math.floor(4096 * Math.random())
    const oy = Math.floor(4096 * Math.random())
    el.style.backgroundPosition = `${ox}px ${oy}px`
  }
  requestAnimationFrame(tick)
}

function isInteractive(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Element)) return false
  const t = el.closest(
    'a,button,input,textarea,select,label,[role="button"],[contenteditable="true"]',
  )
  return Boolean(t)
}

function initClickToScroll(): void {
  window.addEventListener(
    'click',
    (e) => {
      if (window.scrollY !== 0) return
      if (isInteractive(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      const vh = window.visualViewport?.height ?? window.innerHeight
      window.scrollTo({ top: vh * 0.5, behavior: 'smooth' })
    },
    { capture: true },
  )
}

/** Theme index 1 colors when scroll passes first viewport (production uses Space; we mirror that palette on scroll). */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function formatShortDate(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`
}

/** Sets --vaa-masthead-h for fixed main / mobile padding (spec bar + dash + padded title). */
function initMastheadHeight(): void {
  const el = document.querySelector('.vaa__masthead')
  if (!el) return
  const apply = (): void => {
    requestAnimationFrame(() => {
      const h = Math.ceil(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--vaa-masthead-h', `${h}px`)
    })
  }
  apply()
  const ro = new ResizeObserver(() => apply())
  ro.observe(el)
  window.addEventListener('resize', apply, { passive: true })
}

/** Blueprint rail: live DD/MM/YY and HH:MM (30s refresh). */
function initNavRailClock(): void {
  const tick = (): void => {
    const d = new Date()
    const dateText = formatShortDate(d)
    setTextContent('[data-nav-clock]', `${pad2(d.getHours())}:${pad2(d.getMinutes())}`)
    setTextContent('[data-nav-date]', dateText)
    setTextContent('[data-signup-date]', dateText)
  }
  tick()
  window.setInterval(tick, 30_000)
}

function initPastViewportTheme(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  let raf = 0
  const tick = (): void => {
    const vh = getInitialVhPx()
    const alt = window.scrollY >= vh - 0.5
    document.documentElement.dataset.vaaTheme = alt ? 'alt' : 'default'
    if (meta) meta.setAttribute('content', currentLoopTheme().themeColorMeta)
  }
  const schedule = (): void => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      tick()
    })
  }
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  tick()
}

function initCertificateScrollCssFallback(): void {
  const cert = document.getElementById('cert-wrap')
  if (!cert) return
  const CERT_REVEAL_SCROLL_OFFSET_VH = 38

  let raf = 0
  const tick = (): void => {
    const vh = window.visualViewport?.height ?? window.innerHeight
    const sy = window.scrollY
    const revealOffsetPx = (CERT_REVEAL_SCROLL_OFFSET_VH / 100) * vh
    const revealY = Math.max(0, sy - revealOffsetPx)
    const mobile = window.matchMedia(MOBILE_MEDIA_QUERY).matches
    const denom = mobile ? 1.5 * vh : 3 * vh
    const t = Math.max(0, Math.min(1, revealY / Math.max(1, denom)))

    const scaleBase = mobile ? 0.52 : 0.4
    const scaleTarget = 1.02
    const scaleCut = 0.33
    let scale: number
    if (t <= scaleCut) {
      scale = scaleBase + (scaleTarget - scaleBase) * (t / scaleCut)
    } else if (t < 0.78) {
      scale = scaleTarget
    } else {
      const u = (t - 0.78) / 0.22
      scale = scaleTarget + (0.88 - scaleTarget) * u
    }

    const rotCut = 0.25
    const rotDeg =
      t <= rotCut ? -20 * (1 - t / rotCut) : t < 0.78 ? 0 : -2 * ((t - 0.78) / 0.22)

    const n = 1.74 / Math.max(0.5, window.innerWidth / vh)
    const yStart = mobile ? 0.42 : 0.35
    const yEnd = mobile ? -0.08 : -0.05
    const ty = (yStart + t * (yEnd - yStart)) * vh * n

    cert.style.transform = `translate3d(0,${ty}px,0) scale(${scale}) rotate(${rotDeg}deg)`
  }

  const schedule = (): void => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      tick()
    })
  }

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  tick()
}

function initInfiniteLoopScroll(): void {
  let lastY = window.scrollY
  let adjusting = false
  let cycle = loopThemeIndex
  let nearBottomTimer: number | null = null

  const applyLoopTheme = (): void => {
    loopThemeIndex = positiveMod(cycle, THEME_COUNT)
    applyTheme(currentLoopTheme())
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', currentLoopTheme().themeColorMeta)
  }

  const EDGE_PX = 1
  const EDGE_DWELL_MS = 180
  const LOOP_RESET_TARGET_VH = 0.46
  const LOOP_FADE_OUT_MS = 190
  const LOOP_FADE_IN_MS = 320
  const loopLeadPx = (): number => {
    // Only trigger at the true bottom so footer/form content remains reachable.
    return EDGE_PX
  }

  const onScroll = (): void => {
    if (adjusting) return
    const y = window.scrollY
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    if (maxY <= EDGE_PX * 4) return

    const movingDown = y > lastY + 0.5
    const triggerY = Math.max(0, maxY - loopLeadPx())
    const nearBottom = y >= triggerY

    const jumpWithoutFlash = (target: number): void => {
      adjusting = true
      document.documentElement.classList.add('vaa-loop-soft-reset')
      document.documentElement.classList.add('vaa-loop-crossfade')
      document.documentElement.classList.add('vaa-loop-fade-out')
      document.documentElement.classList.add('vaa-loop-snap')
      document.documentElement.classList.add('vaa-loop-hide-stage')
      window.setTimeout(() => {
        window.scrollTo({ top: target, behavior: 'auto' })
        window.dispatchEvent(new CustomEvent('vaa:loop-reset'))
        document.documentElement.classList.remove('vaa-loop-fade-out')
        document.documentElement.classList.add('vaa-loop-fade-in')
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.documentElement.classList.remove('vaa-loop-snap')
            document.documentElement.classList.remove('vaa-loop-hide-stage')
            window.setTimeout(() => {
              document.documentElement.classList.remove('vaa-loop-soft-reset')
              document.documentElement.classList.remove('vaa-loop-crossfade')
              document.documentElement.classList.remove('vaa-loop-fade-in')
            }, LOOP_FADE_IN_MS)
            adjusting = false
            lastY = window.scrollY
          })
        })
      }, LOOP_FADE_OUT_MS)
    }

    if (nearBottom) {
      // Scroll events can stop at the hard bottom edge, so use a timer-based dwell trigger.
      if (movingDown && nearBottomTimer == null) {
        nearBottomTimer = window.setTimeout(() => {
          nearBottomTimer = null
          if (adjusting) return
          const currentY = window.scrollY
          const currentMaxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
          const currentTriggerY = Math.max(0, currentMaxY - loopLeadPx())
          if (currentY < currentTriggerY) return
          cycle++
          applyLoopTheme()
          jumpWithoutFlash(Math.max(EDGE_PX, getInitialVhPx() * LOOP_RESET_TARGET_VH))
        }, EDGE_DWELL_MS)
      }
      lastY = y
      return
    }

    if (nearBottomTimer != null) {
      window.clearTimeout(nearBottomTimer)
      nearBottomTimer = null
    }

    lastY = y
  }

  applyLoopTheme()
  window.addEventListener('scroll', onScroll, { passive: true })
}

function initReleaseFixedLayersAfterCertificate(): void {
  const root = document.documentElement
  const RELEASE_AFTER_VH_DESKTOP = 1.95
  const RELEASE_AFTER_VH_MOBILE = 0.95

  let raf = 0
  const tick = (): void => {
    const vh = getInitialVhPx()
    const mobile = window.matchMedia(MOBILE_MEDIA_QUERY).matches
    const releaseY = (mobile ? RELEASE_AFTER_VH_MOBILE : RELEASE_AFTER_VH_DESKTOP) * vh
    const releaseOffset = Math.max(0, window.scrollY - releaseY)
    root.style.setProperty('--vaa-fixed-release-y', `${releaseOffset}px`)
    root.dataset.vaaPastCertificate = releaseOffset > 0 ? 'true' : 'false'
  }

  const schedule = (): void => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      tick()
    })
  }

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  tick()
}

function initScrollFirmStops(): void {
  const introSection = document.querySelector<HTMLElement>('.vaa__scroll-announce')
  const footer = document.getElementById('vaa-footer')
  if (!introSection || !footer) return

  gsap.registerPlugin(ScrollTrigger)

  const introLanding = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      id: 'vaa-firm-stop-intro',
      trigger: introSection,
      start: 'top top',
      end: () => `+=${Math.round(getInitialVhPx() * 0.12)}`,
      pin: true,
      pinSpacing: false,
      scrub: 1.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })
  introLanding.to(introSection, { yPercent: -2.2, duration: 0.72 }).to(introSection, { yPercent: -3, duration: 0.28 })

  const footerLanding = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      id: 'vaa-firm-stop-form-end',
      trigger: footer,
      start: 'bottom bottom',
      end: () => `+=${Math.round(getInitialVhPx() * 0.16)}`,
      pin: true,
      pinSpacing: true,
      scrub: 1.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })
  footerLanding.to(footer, { yPercent: -1.8, duration: 0.68 }).to(footer, { yPercent: -2.5, duration: 0.32 })
}

function initImageSlideFadeIn(): void {
  const imageLike = Array.from(
    document.querySelectorAll<HTMLElement>('.vaa img, .vaa picture, .vaa canvas'),
  )
  if (!imageLike.length) return
  gsap.set(imageLike, { opacity: 0, x: -48 })
  gsap.to(imageLike, {
    opacity: 1,
    x: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.16,
    delay: 0.15,
    clearProps: 'opacity,transform',
  })
}

interface TypewriterChunk {
  node: Text
  text: string
  start: number
  end: number
}

function initTypewriterText(): void {
  const root = document.querySelector('.vaa')
  if (!root) return

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const chunks: TypewriterChunk[] = []
  let cursor = 0
  let current = walker.nextNode()
  while (current) {
    const node = current as Text
    const parent = node.parentElement
    const text = node.textContent ?? ''
    if (
      parent &&
      text.trim().length > 0 &&
      !parent.closest('script,style,noscript,textarea,option') &&
      !parent.closest('[data-nav-date],[data-nav-clock],[data-signup-date],.vaa__headline')
    ) {
      chunks.push({ node, text, start: cursor, end: cursor + text.length })
      cursor += text.length
      node.textContent = ''
    }
    current = walker.nextNode()
  }

  if (!chunks.length || cursor === 0) return

  const charsPerSecond = 120
  const start = performance.now()
  const render = (now: number): void => {
    const revealed = Math.floor(((now - start) / 1000) * charsPerSecond)
    for (const chunk of chunks) {
      if (revealed <= chunk.start) {
        chunk.node.textContent = ''
      } else if (revealed >= chunk.end) {
        chunk.node.textContent = chunk.text
      } else {
        chunk.node.textContent = chunk.text.slice(0, revealed - chunk.start)
      }
    }
    if (revealed < cursor) requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}

async function initCertificate(): Promise<void> {
  const wrap = document.getElementById('cert-wrap')
  const canvas = document.getElementById('cert-gl') as HTMLCanvasElement | null
  const fallback = document.getElementById('cert-fallback') as HTMLElement | null
  if (!wrap || !canvas) return

  try {
    await initCertificateScene(wrap, canvas)
    canvas.classList.add('vaa__cert-canvas--active')
    if (fallback) fallback.hidden = true
  } catch {
    canvas.classList.remove('vaa__cert-canvas--active')
    if (fallback) fallback.hidden = false
    initCertificateScrollCssFallback()
  }
}

document.getElementById('vaa-form')?.addEventListener('submit', (e) => {
  e.preventDefault()
})

setViewportVars()
applyTheme(currentLoopTheme())
window.addEventListener('resize', setViewportVars)
initFilmGrainJitter()
initClickToScroll()
initMastheadHeight()
initNavRailClock()
initPastViewportTheme()
initInfiniteLoopScroll()
initReleaseFixedLayersAfterCertificate()
initScrollFirmStops()
initImageSlideFadeIn()
initTypewriterText()
void initCertificate()
