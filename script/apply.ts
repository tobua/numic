import { applyPatch } from '../git'

export const apply = (options: { skipEmpty?: boolean }) => {
  applyPatch(options)
}
