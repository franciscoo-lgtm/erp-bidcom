'use client'

const OPEN_CMDK_EVENT = 'erp:open-cmdk'

export function openCmdK() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_CMDK_EVENT))
  }
}

// Stub — search can be wired up later
export function CmdK() {
  return null
}
