import { applyPatch } from '../git'

export const apply = (options: { skipEmpty?: boolean; reject?: boolean }) => {
  applyPatch(options)
}
