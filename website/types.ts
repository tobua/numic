import { BufferGeometry, Material } from 'three'

export type Nodes = { [name: string]: { geometry: BufferGeometry; material: Material } }
