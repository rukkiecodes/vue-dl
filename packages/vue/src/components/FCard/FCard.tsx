import { h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { genericComponent, useRender } from '../../util/defineComponent'
import { propsFactory } from '../../util/propsFactory'
import { makeComponentProps, makeTagProps } from '../../composables/component'
import { makeThemeProps, provideTheme } from '../../composables/theme'
import { FIcon } from '../FIcon'

export type FCardType =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export const makeFCardProps = propsFactory(
  {
    // Layout style, mirroring the five Vuesax card types (1 = default).
    // Type 6 adds a scroll-driven parallax on the image.
    type: { type: [String, Number] as PropType<string | number>, default: '1' },
    // Type 6 only: how far (px) the image drifts across a full pass through
    // the viewport. Higher = more intense.
    parallax: { type: [Number, String] as PropType<number | string>, default: 280 },
    // Convenience props for simple cards (slots take precedence).
    image: String as PropType<string>,
    img: String as PropType<string>,
    // Video media. When set (and no #img slot), the card renders a <video> in its
    // media area. Defaults to a muted, looping, inline autoplay preview so the card
    // visibly plays; set `videoAutoplay: false` for a static poster + play badge
    // (lighter for dense grids), or `videoControls` for a full player.
    video: String as PropType<string>,
    poster: String as PropType<string>,
    videoAutoplay: { type: Boolean as PropType<boolean>, default: true },
    videoControls: { type: Boolean as PropType<boolean>, default: false },
    title: String as PropType<string>,
    text: String as PropType<string>,
    ...makeTagProps({ tag: 'div' }),
    ...makeThemeProps(),
    ...makeComponentProps(),
  },
  'FCard'
)

export const FCard = genericComponent()({
  name: 'FCard',
  inheritAttrs: false,
  props: makeFCardProps(),
  setup(props: any, { slots, attrs }: any) {
    provideTheme(props)

    // ---- Type 6: scroll-driven image parallax ---------------------------
    const cardRef = ref<HTMLElement>()
    let frame = 0
    let attached = false

    function updateParallax() {
      frame = 0
      if (String(props.type) !== '6') return
      const el = cardRef.value
      const img = el?.querySelector(
        '.fui-card__img img, .fui-card__img video'
      ) as HTMLElement | null
      if (!el || !img) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      // 0 as the card enters from the bottom → 1 as it leaves past the top.
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)))
      const range = Number(props.parallax) || 0
      const shift = (0.5 - progress) * range
      img.style.transform = `translate3d(0, ${shift}px, 0)`
    }

    function onScroll() {
      if (frame) return
      frame = requestAnimationFrame(updateParallax)
    }

    function attach() {
      if (attached || typeof window === 'undefined') return
      attached = true
      // Capture phase so scrolling inside any container (not just the window)
      // still drives the effect.
      window.addEventListener('scroll', onScroll, { passive: true, capture: true })
      window.addEventListener('resize', onScroll, { passive: true })
      nextTick(updateParallax)
    }

    function detach() {
      if (!attached) return
      attached = false
      window.removeEventListener('scroll', onScroll, { capture: true } as any)
      window.removeEventListener('resize', onScroll)
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }

    // ---- Types 8 & 9: cursor avoid / follow -----------------------------
    let cursorFrame = 0
    let cursorMove: ((e: MouseEvent) => void) | null = null

    function detachCursor() {
      if (cursorMove) {
        document.removeEventListener('mousemove', cursorMove)
        cursorMove = null
      }
      if (cursorFrame) {
        cancelAnimationFrame(cursorFrame)
        cursorFrame = 0
      }
      const el = cardRef.value
      if (el) {
        el.style.transform = ''
        el.classList.remove('is-flipped')
      }
    }

    function attachCursor() {
      if (typeof window === 'undefined') return
      const t = String(props.type)
      if (t !== '8' && t !== '9' && t !== '10') return
      detachCursor()
      cursorMove = (e: MouseEvent) => {
        if (cursorFrame) return
        cursorFrame = requestAnimationFrame(() => {
          cursorFrame = 0
          const el = cardRef.value
          if (!el) return
          const rect = el.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const dx = e.clientX - cx
          const dy = e.clientY - cy
          if (t === '10') {
            // flip when the cursor comes near (margin gives spatial awareness
            // so it doesn't flicker at the edges).
            const margin = 80
            const near =
              e.clientX >= rect.left - margin &&
              e.clientX <= rect.right + margin &&
              e.clientY >= rect.top - margin &&
              e.clientY <= rect.bottom + margin
            el.classList.toggle('is-flipped', near)
          } else if (t === '9') {
            // follow: tilt + lean toward the cursor while it is over the card.
            const margin = 60
            const inside =
              e.clientX >= rect.left - margin &&
              e.clientX <= rect.right + margin &&
              e.clientY >= rect.top - margin &&
              e.clientY <= rect.bottom + margin
            if (inside) {
              const px = clamp(dx / (rect.width / 2), -1, 1)
              const py = clamp(dy / (rect.height / 2), -1, 1)
              el.style.transform =
                `perspective(800px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) ` +
                `translate(${px * 10}px, ${py * 10}px) scale(1.03)`
            } else {
              el.style.transform = ''
            }
          } else {
            // avoid: shove away from the cursor when it gets close.
            const dist = Math.hypot(dx, dy) || 0.001
            const radius = 180
            if (dist < radius) {
              const force = 1 - dist / radius
              const push = force * 75
              el.style.transform = `translate(${(-dx / dist) * push}px, ${(-dy / dist) * push}px)`
            } else {
              el.style.transform = ''
            }
          }
        })
      }
      document.addEventListener('mousemove', cursorMove, { passive: true })
    }

    // ---- Type 11: Tinder-style swipeable deck ---------------------------
    let deckCleanup: (() => void) | null = null

    function detachDeck() {
      if (deckCleanup) {
        deckCleanup()
        deckCleanup = null
      }
    }

    function attachDeck() {
      if (typeof window === 'undefined') return
      const el = cardRef.value
      if (!el) return
      detachDeck()
      const slides = Array.from(el.children).filter(
        (c): c is HTMLElement => c instanceof HTMLElement
      )
      if (!slides.length) return
      const order = slides.slice()

      function layout() {
        order.forEach((s, i) => {
          const offset = Math.min(i, 3)
          s.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease'
          s.style.zIndex = String(order.length - i)
          s.style.transform = `translateY(${offset * 12}px) scale(${1 - offset * 0.05})`
          s.style.opacity = i < 4 ? '1' : '0'
          s.style.pointerEvents = i === 0 ? 'auto' : 'none'
        })
      }

      let dragging = false
      let startX = 0
      let top: HTMLElement | null = null

      function onDown(e: PointerEvent) {
        const t = order[0]
        if (!t || (t !== e.target && !t.contains(e.target as Node))) return
        top = t
        dragging = true
        startX = e.clientX
        top.style.transition = 'none'
        top.setPointerCapture?.(e.pointerId)
      }
      function onMove(e: PointerEvent) {
        if (!dragging || !top) return
        const dx = e.clientX - startX
        top.style.transform = `translate(${dx}px, ${Math.abs(dx) * 0.06}px) rotate(${dx / 18}deg)`
      }
      function onUp(e: PointerEvent) {
        if (!dragging || !top) return
        dragging = false
        const dx = e.clientX - startX
        const card = top
        top = null
        if (Math.abs(dx) > 90) {
          const dir = dx > 0 ? 1 : -1
          card.style.transition = 'transform 0.45s ease, opacity 0.45s ease'
          card.style.transform = `translate(${dir * 520}px, 60px) rotate(${dir * 35}deg)`
          card.style.opacity = '0'
          window.setTimeout(() => {
            order.push(order.shift() as HTMLElement)
            card.style.transition = 'none'
            layout()
          }, 320)
        } else {
          layout()
        }
      }

      el.addEventListener('pointerdown', onDown)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      layout()

      deckCleanup = () => {
        el.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
    }

    function syncEffects() {
      const t = String(props.type)
      if (t === '6') attach()
      else detach()
      if (t === '8' || t === '9' || t === '10') attachCursor()
      else detachCursor()
      if (t === '11') nextTick(attachDeck)
      else detachDeck()
    }

    onMounted(syncEffects)

    // Attach/detach as the type switches (e.g. in the docs playground), and
    // re-run parallax when the intensity changes.
    watch(() => String(props.type), syncEffects)
    watch(
      () => props.parallax,
      () => updateParallax()
    )

    onBeforeUnmount(() => {
      detach()
      detachCursor()
      detachDeck()
    })

    useRender(() => {
      const src = props.image ?? props.img
      const hasImg = !!(slots.img || src || props.video)
      const hasTitle = !!(slots.title || props.title)
      const hasText = !!(slots.text || props.text)

      const interactions = slots.interactions
        ? h('div', { class: 'fui-card__interactions' }, [slots.interactions()])
        : null

      // Media precedence: #img slot → video prop → image. A video autoplays muted +
      // looped inline by default (a lively preview); with videoAutoplay:false it
      // shows the poster frame under a play badge instead.
      const autoplay = props.videoAutoplay !== false
      const mediaChild = slots.img
        ? slots.img()
        : props.video
          ? h('video', {
              class: 'fui-card__video',
              src: props.video,
              poster: props.poster || undefined,
              muted: true,
              loop: autoplay,
              autoplay,
              playsinline: true,
              controls: !!props.videoControls,
              preload: 'metadata',
            })
          : h('img', { src, alt: '' })

      const playBadge =
        props.video && !slots.img && !autoplay && !props.videoControls
          ? h('span', { class: 'fui-card__play', 'aria-hidden': 'true' }, [
              h('svg', { width: '22', height: '22', viewBox: '0 0 24 24', fill: 'currentColor' }, [
                h('path', { d: 'M8 5v14l11-7z' }),
              ]),
            ])
          : null

      const imgNode = hasImg
        ? h('div', { class: 'fui-card__img' }, [mediaChild, playBadge, interactions])
        : null

      const titleNode = hasTitle
        ? h('div', { class: 'fui-card__title' }, [
            slots.title ? slots.title() : h('h3', props.title),
          ])
        : null

      const textNode =
        hasTitle || hasText
          ? h('div', { class: 'fui-card__text' }, [
              titleNode,
              slots.text ? slots.text() : props.text ? h('p', props.text) : null,
            ])
          : null

      const buttonsNode = slots.buttons
        ? h('div', { class: 'fui-card__buttons' }, [slots.buttons()])
        : null

      // Social-feed building blocks (types 10–12): a header (avatar + name /
      // meta) and an actions row. Layout order is arranged per type in SCSS.
      const headerNode =
        slots.avatar || slots.header
          ? h('div', { class: 'fui-card__header' }, [
              slots.avatar ? h('div', { class: 'fui-card__avatar' }, [slots.avatar()]) : null,
              slots.header ? h('div', { class: 'fui-card__head' }, [slots.header()]) : null,
            ])
          : null

      const actionsNode = slots.actions
        ? h('div', { class: 'fui-card__actions' }, [slots.actions()])
        : null

      // Flip card (type 10): two faces.
      const frontNode = slots.front ? h('div', { class: 'fui-card__front' }, [slots.front()]) : null
      const backNode = slots.back ? h('div', { class: 'fui-card__back' }, [slots.back()]) : null

      const card = h(props.tag, { class: 'fui-card', ...attrs, ref: cardRef }, [
        frontNode,
        backNode,
        headerNode,
        imgNode,
        textNode,
        actionsNode,
        buttonsNode,
        slots.default?.(),
      ])

      // Half the drift range is how much overflow the image needs on each side.
      const parallaxStyle =
        String(props.type) === '6'
          ? { '--fui-parallax-room': `${(Number(props.parallax) || 0) / 2}px` }
          : null

      return h(
        'div',
        {
          class: ['fui-card-content', `fui-card-content--type-${props.type}`, props.class],
          style: [props.style, parallaxStyle],
        },
        [card]
      )
    })
  },
})

export const FCardGroup = genericComponent()({
  name: 'FCardGroup',
  props: {
    ...makeComponentProps(),
    ...makeTagProps({ tag: 'div' }),
  },
  setup(props: any, { slots }: any) {
    const cards = ref<HTMLElement>()

    function scrollBy(direction: number) {
      const el = cards.value
      if (!el) return
      el.scrollTo({ left: el.scrollLeft + direction * el.clientWidth, behavior: 'smooth' })
    }

    useRender(() =>
      h('div', { class: ['fui-card-group', props.class], style: props.style }, [
        h(
          'button',
          {
            class: 'fui-card-group__nav fui-card-group__prev',
            type: 'button',
            'aria-label': 'Previous',
            onClick: () => scrollBy(-1),
          },
          [h(FIcon, { icon: '$prev' })]
        ),
        h('div', { class: 'fui-card-group__cards', ref: cards }, [slots.default?.()]),
        h(
          'button',
          {
            class: 'fui-card-group__nav fui-card-group__next',
            type: 'button',
            'aria-label': 'Next',
            onClick: () => scrollBy(1),
          },
          [h(FIcon, { icon: '$next' })]
        ),
      ])
    )
  },
})

function makeSection(name: string, klass: string) {
  return genericComponent()({
    name,
    props: { ...makeComponentProps(), ...makeTagProps({ tag: 'div' }) },
    setup(props: any, { slots }: any) {
      useRender(() =>
        h(props.tag, { class: [klass, props.class], style: props.style }, slots.default?.())
      )
    },
  })
}

export const FCardTitle = makeSection('FCardTitle', 'fui-card__title')
export const FCardText = makeSection('FCardText', 'fui-card__text')
export const FCardButtons = makeSection('FCardButtons', 'fui-card__buttons')
