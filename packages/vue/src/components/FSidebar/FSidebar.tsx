import { computed, getCurrentInstance, h, inject, onMounted, provide, ref } from 'vue'
import type { InjectionKey, PropType, Ref } from 'vue'
import { genericComponent, useRender } from '../../util/defineComponent'
import { propsFactory } from '../../util/propsFactory'
import { makeComponentProps } from '../../composables/component'
import { makeThemeProps, provideTheme } from '../../composables/theme'
import { useProxiedModel } from '../../composables/proxiedModel'
import { useLayoutItem } from '../../composables/layout'
import { shellCornerSvg } from '../../engine/shell'
import { convertToUnit } from '../../util/helpers'
import { parseColor } from '../../util/colors'
import { FIcon } from '../FIcon'

interface SidebarContext {
  activeId: Ref<string | undefined>
  setActive: (id: string | undefined) => void
  reduced: Ref<boolean>
}

export const FSidebarKey: InjectionKey<SidebarContext> = Symbol.for('fusionui:sidebar')

/** Resolve a color name/CSS color to an `r, g, b` triplet for rgb(var(--…)). */
function resolveColorTriplet(color?: string): string | null {
  if (!color) return null
  if (color.startsWith('#') || color.startsWith('rgb')) {
    const { r, g, b } = parseColor(color)
    return `${r}, ${g}, ${b}`
  }
  return `var(--fui-theme-${color})`
}

export const makeFSidebarProps = propsFactory(
  {
    // Active item id (v-model).
    modelValue: String as PropType<string>,
    // Drawer visibility for the overlay mode (v-model:open).
    open: Boolean,
    // Render in place as part of the layout instead of a fixed overlay.
    permanent: Boolean,
    // Collapse to a 50px icon rail (Discord style).
    reduce: Boolean,
    // Expand the rail while hovered.
    hoverExpand: Boolean,
    right: Boolean,
    square: Boolean,
    // Hide the rounded active-line indicator.
    notLineActive: Boolean,
    // Fill the drawer with a theme color (primary, success…) or any CSS color.
    color: String as PropType<string>,
    // Force white text (useful on a colored drawer).
    textWhite: Boolean,
    width: { type: [String, Number] as PropType<string | number>, default: 260 },
    // Layout stacking order when inside an <f-layout> (lower = outer). Default 1
    // keeps the navbar (0) on top, full width; set `order=0` for a full-height
    // sidebar with the navbar beside it.
    order: { type: Number, default: 1 },
    // ── Corner / shape options ───────────────────────────────────────────────
    // Default edges: top-right + bottom-right rounded. `square` removes all radius.
    // `inverseCorner` draws a concave (negative-radius) fillet at the top-right so
    // the drawer flows into the navbar/shell (the docs "frame" look).
    inverseCorner: Boolean,
    // Radius (px) of the inverse-corner fillet.
    cornerSize: { type: Number, default: 22 },
    // Float the drawer as an "island" — a margin on every side + full rounding.
    island: Boolean,
    // Island margin (px). Also widens the layout slot so content clears the gap.
    islandMargin: { type: [Number, String] as PropType<number | string>, default: 12 },
    ...makeThemeProps(),
    ...makeComponentProps(),
  },
  'FSidebar'
)

export const FSidebar = genericComponent()({
  name: 'FSidebar',
  props: makeFSidebarProps(),
  emits: {
    'update:modelValue': (_v: string | undefined) => true,
    'update:open': (_v: boolean) => true,
  },
  setup(props: any, { slots }: any) {
    provideTheme(props)
    const model = useProxiedModel(props, 'modelValue', undefined)
    const isOpen = useProxiedModel(props, 'open', false)

    const hovered = ref(false)
    const reduced = computed(() => props.reduce && !(props.hoverExpand && hovered.value))
    const sidebarColor = computed(() => resolveColorTriplet(props.color))

    // Layout coordination: register as a side drawer when permanent inside an
    // <f-layout> so <f-main> insets and the navbar stacks correctly. In overlay
    // mode (mobile, not permanent) it stays inactive and uses its own CSS.
    const layoutWidth = computed(() => parseInt(String(convertToUnit(props.width)), 10) || 260)
    const islandMarginPx = computed(() =>
      props.island ? parseInt(String(props.islandMargin), 10) || 0 : 0
    )
    const { hasLayout, layoutItemStyles } = useLayoutItem({
      id: `fui-sidebar-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
      position: computed(() => (props.right ? 'right' : 'left')) as any,
      size: layoutWidth,
      order: computed(() => Number(props.order ?? 1)) as any,
      active: computed(() => !!props.permanent),
      margin: islandMarginPx as any,
    })
    const inLayout = computed(() => hasLayout && props.permanent)

    provide(FSidebarKey, {
      activeId: model,
      setActive: id => {
        model.value = id
      },
      reduced,
    })

    // Overlay mode closes on an outside click via the backdrop below. The
    // backdrop is a real element that covers the page, so the click lands on it
    // and closes the drawer instead of passing through to whatever is beneath —
    // no stray action fires in the "empty" space. (This replaces an older
    // window-level click listener that closed the drawer but let the same click
    // reach the content underneath.)
    function closeFromBackdrop(e: MouseEvent) {
      e.stopPropagation()
      isOpen.value = false
    }

    useRender(() => {
      const backdrop =
        !props.permanent && isOpen.value
          ? h('div', {
              class: 'fui-sidebar-backdrop',
              'aria-hidden': 'true',
              onClick: closeFromBackdrop,
            })
          : null

      const aside = h(
        'aside',
        {
          class: [
            'fui-sidebar',
            {
              'fui-sidebar--open': isOpen.value || props.permanent,
              'fui-sidebar--permanent': props.permanent,
              'fui-sidebar--in-layout': inLayout.value,
              'fui-sidebar--reduce': reduced.value,
              'fui-sidebar--right': props.right,
              'fui-sidebar--square': props.square,
              'fui-sidebar--island': props.island,
              'fui-sidebar--inverse-corner': props.inverseCorner,
              'fui-sidebar--no-line': props.notLineActive,
              'fui-sidebar--colored': !!sidebarColor.value,
              'fui-sidebar--text-white': props.textWhite,
            },
            props.class,
          ],
          style: [
            { '--fui-sidebar-width': convertToUnit(props.width) },
            props.island
              ? { '--fui-sidebar-island-margin': convertToUnit(props.islandMargin) }
              : null,
            sidebarColor.value ? { '--fui-sidebar-color': sidebarColor.value } : null,
            inLayout.value ? layoutItemStyles.value : null,
            props.style,
          ],
          onMouseenter: () => {
            hovered.value = true
          },
          onMouseleave: () => {
            hovered.value = false
          },
        },
        [
          slots.logo ? h('div', { class: 'fui-sidebar__logo' }, slots.logo()) : null,
          slots.header ? h('div', { class: 'fui-sidebar__header' }, slots.header()) : null,
          h('div', { class: 'fui-sidebar__body' }, slots.default?.()),
          slots.footer ? h('div', { class: 'fui-sidebar__footer' }, slots.footer()) : null,
          // Concave junction at the top-right: a shell-coloured fillet (clipped to
          // the goo curve) that carves the content's corner. `background: inherit`
          // tracks the drawer colour for free. Needs the root overflow-visible
          // (see &--inverse-corner in the scss).
          props.inverseCorner && !props.right
            ? h('div', {
                class: 'fui-sidebar__goo',
                'aria-hidden': 'true',
                style: {
                  position: 'absolute',
                  left: '100%',
                  top: '0',
                  width: `${props.cornerSize}px`,
                  height: `${props.cornerSize}px`,
                  backgroundColor: 'inherit',
                  clipPath: `path('${shellCornerSvg(props.cornerSize)}')`,
                  pointerEvents: 'none',
                },
              })
            : null,
        ]
      )

      // Backdrop first so it paints beneath the drawer; both are root-level.
      return [backdrop, aside]
    })
  },
})

export const makeFSidebarItemProps = propsFactory(
  {
    id: String as PropType<string>,
    active: Boolean,
    to: String as PropType<string>,
    href: String as PropType<string>,
    target: { type: String, default: '_blank' },
    ...makeComponentProps(),
  },
  'FSidebarItem'
)

export const FSidebarItem = genericComponent()({
  name: 'FSidebarItem',
  props: makeFSidebarItemProps(),
  emits: { click: (_e: MouseEvent) => true },
  setup(props: any, { slots, emit }: any) {
    const sidebar = inject(FSidebarKey, null)
    const vm = getCurrentInstance()

    const isActive = computed(
      () => props.active || (!!props.id && sidebar?.activeId.value === props.id)
    )

    function onClick(e: MouseEvent) {
      emit('click', e)
      if (props.id && sidebar) sidebar.setActive(props.id)
      if (props.to) {
        const router = vm?.appContext.config.globalProperties.$router
        router?.push(props.to)
      } else if (props.href && typeof window !== 'undefined') {
        window.open(props.href, props.target)
      }
    }

    useRender(() =>
      h(
        'button',
        {
          type: 'button',
          class: [
            'fui-sidebar__item',
            {
              'fui-sidebar__item--active': isActive.value,
              'fui-sidebar__item--has-icon': !!slots.icon,
            },
            props.class,
          ],
          style: props.style,
          onClick,
        },
        [
          slots.icon ? h('div', { class: 'fui-sidebar__item-icon' }, slots.icon()) : null,
          h('div', { class: 'fui-sidebar__item-text' }, slots.default?.()),
        ]
      )
    )
  },
})

export const makeFSidebarGroupProps = propsFactory(
  {
    open: Boolean,
    ...makeComponentProps(),
  },
  'FSidebarGroup'
)

export const FSidebarGroup = genericComponent()({
  name: 'FSidebarGroup',
  props: makeFSidebarGroupProps(),
  setup(props: any, { slots }: any) {
    const isOpen = ref(props.open)
    const contentRef = ref<HTMLElement>()
    const groupRef = ref<HTMLElement>()

    function afterTransition(el: HTMLElement, fn: () => void) {
      const done = () => {
        fn()
        el.removeEventListener('transitionend', done)
      }
      el.addEventListener('transitionend', done)
    }

    function toggle() {
      const c = contentRef.value
      if (!c) {
        isOpen.value = !isOpen.value
        return
      }
      if (isOpen.value) {
        c.style.height = c.scrollHeight + 'px'
        void c.offsetHeight
        c.style.height = '0'
      } else {
        c.style.height = c.scrollHeight + 'px'
        afterTransition(c, () => (c.style.height = 'auto'))
      }
      isOpen.value = !isOpen.value
    }

    onMounted(() => {
      // Open automatically when it contains the active item (Vuesax).
      if (groupRef.value?.querySelector('.fui-sidebar__item--active')) isOpen.value = true
      const c = contentRef.value
      if (!c) return
      c.style.transition = 'none'
      c.style.height = isOpen.value ? 'auto' : '0'
      void c.offsetHeight
      c.style.transition = ''
    })

    useRender(() =>
      h(
        'div',
        {
          ref: groupRef,
          class: ['fui-sidebar__group', { 'fui-sidebar__group--open': isOpen.value }, props.class],
          style: props.style,
        },
        [
          h('div', { class: 'fui-sidebar__group-header', onClick: toggle }, [
            slots.header?.(),
            h(FIcon, { icon: '$dropdown', class: 'fui-sidebar__group-chevron', size: 'small' }),
          ]),
          h('div', { ref: contentRef, class: 'fui-sidebar__group-content' }, slots.default?.()),
        ]
      )
    )
  },
})
