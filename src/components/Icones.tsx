import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: Props) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconeUpload = (p: Props) => (
  <Svg {...p}>
    <path d="M12 15V4m0 0 4 4m-4-4L8 8" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </Svg>
)

export const IconeDownload = (p: Props) => (
  <Svg {...p}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </Svg>
)

export const IconeDado = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="8.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="15.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="0.5" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconeImpressora = (p: Props) => (
  <Svg {...p}>
    <path d="M7 8V3h10v5" />
    <rect x="4" y="8" width="16" height="8" rx="2" />
    <path d="M7 13h10v8H7z" />
  </Svg>
)

export const IconePlanilha = (p: Props) => (
  <Svg {...p}>
    <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </Svg>
)

export const IconePessoas = (p: Props) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16.5 4.9a3.5 3.5 0 0 1 0 6.2" />
    <path d="M18 14.3c2 .9 3 2.9 3 5.7" />
  </Svg>
)

export const IconeAlerta = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3 2.5 20h19z" />
    <path d="M12 9.5V14" />
    <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconeInfo = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconeCheck = (p: Props) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
)

export const IconeFechar = (p: Props) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)

export const IconeMover = (p: Props) => (
  <Svg {...p}>
    <path d="M8 7h13m0 0-3-3m3 3-3 3" />
    <path d="M16 17H3m0 0 3 3m-3-3 3-3" />
  </Svg>
)

export const IconeAtualizar = (p: Props) => (
  <Svg {...p}>
    <path d="M20 11A8 8 0 1 0 18.9 15" />
    <path d="M20 4v7h-7" />
  </Svg>
)

export const IconeSeta = (p: Props) => (
  <Svg {...p}>
    <path d="M4 12h16m0 0-5-5m5 5-5 5" />
  </Svg>
)

export const IconeEscudo = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6z" />
    <path d="m9 11.5 2 2 4-4.5" />
  </Svg>
)
