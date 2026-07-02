import { createApp } from 'vue'

const defaultBuild = () => ({
  id: Date.now() + Math.random(),
  name: '',
  shipKey: '',
  quantity: 1,
  inPort: false
})

const defaultState = () => ({
  islandDiscount: false,
  settings: {
    carpentry: false,
    blacksmithing: false
  },
  inventory: {
    i_beam: 0, i_bulkhead: 0, i_canvas: 0, i_plate: 0, i_bronze: 0,
    i_wood: 0, i_iron: 0, i_fabric: 0, i_resin: 0, i_coal: 0, i_copper: 0
  },
  builds: [defaultBuild()]
})

const normalizeState = (raw) => {
  if (!raw) return defaultState()
  const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
  const state = saved || {}
  if (Array.isArray(state.builds) && state.builds.length) {
    return {
      islandDiscount: Boolean(state.islandDiscount),
      settings: {
        carpentry: Boolean(state.settings?.carpentry || false),
        blacksmithing: Boolean(state.settings?.blacksmithing || false)
      },
      inventory: {
        i_beam: Number(state.inventory?.i_beam || state.i_beam || 0),
        i_bulkhead: Number(state.inventory?.i_bulkhead || state.i_bulkhead || 0),
        i_canvas: Number(state.inventory?.i_canvas || state.i_canvas || 0),
        i_plate: Number(state.inventory?.i_plate || state.i_plate || 0),
        i_bronze: Number(state.inventory?.i_bronze || 0),
        i_wood: Number(state.inventory?.i_wood || state.i_wood || 0),
        i_iron: Number(state.inventory?.i_iron || state.i_iron || 0),
        i_fabric: Number(state.inventory?.i_fabric || state.i_fabric || 0),
        i_resin: Number(state.inventory?.i_resin || state.i_resin || 0),
        i_coal: Number(state.inventory?.i_coal || state.i_coal || 0),
        i_copper: Number(state.inventory?.i_copper || 0)
      },
      builds: state.builds.map((b, i) => ({
        id: b.id || `${Date.now()}-${i}`,
        name: b.name || `Build ${i + 1}`,
        shipKey: b.shipKey || b.ship || '',
        quantity: Math.max(1, Number(b.quantity || 1)),
        inPort: Boolean(b.inPort || false)
      }))
    }
  }
  return {
    islandDiscount: Boolean(state.islandDiscount),
    settings: {
      carpentry: Boolean(state.settings?.carpentry || false),
      blacksmithing: Boolean(state.settings?.blacksmithing || false)
    },
    inventory: {
      i_beam: Number(state.i_beam || 0),
      i_bulkhead: Number(state.i_bulkhead || 0),
      i_canvas: Number(state.i_canvas || 0),
      i_plate: Number(state.i_plate || 0),
      i_bronze: Number(state.i_bronze || 0),
      i_wood: Number(state.i_wood || 0),
      i_iron: Number(state.i_iron || 0),
      i_fabric: Number(state.i_fabric || 0),
      i_resin: Number(state.i_resin || 0),
      i_coal: Number(state.i_coal || 0),
      i_copper: Number(state.i_copper || 0)
    },
    builds: [defaultBuild()]
  }
}

const flattenShips = (data) =>
  Object.entries(data || {}).flatMap(([branchName, ships]) =>
    (Array.isArray(ships) ? ships : []).map((ship, index) => ({
      id: `${branchName}:${ship.name}:${index}`,
      ...ship,
      branchName: branchName.replaceAll('_branch', '').replaceAll('_', ' ')
    }))
  )

const matColors = {
  beam: 'text-primary',
  bulkhead: 'text-secondary',
  sailcloth: 'text-info',
  plate: 'text-error',
  bronze: 'text-warning'
}

const resColors = {
  wood: 'text-warning',
  iron: '',
  fabric: 'text-accent',
  resin: 'text-secondary',
  coal: 'opacity-80',
  copper: 'text-accent'
}

const invMatMap = { beam: 'i_beam', bulkhead: 'i_bulkhead', sailcloth: 'i_canvas', plate: 'i_plate', bronze: 'i_bronze' }
const invResMap = { wood: 'i_wood', iron: 'i_iron', fabric: 'i_fabric', resin: 'i_resin', coal: 'i_coal', copper: 'i_copper' }
const dirResMap = { raw_wood: 'wood', raw_textile: 'fabric', iron_ore: 'iron' }

createApp({
  data() {
    const saved = localStorage.getItem('wosb_mats')
    return {
      mats: normalizeState(saved),
      shipCatalog: [],
      shipCatalogLoaded: false,
      formulas: [],
      formulasLoaded: false
    }
  },

  computed: {
    materialOrder() {
      return this.formulas.map(f => f.key)
    },

    resourceOrder() {
      return ['wood', 'iron', 'fabric', 'resin', 'coal', 'copper']
    },

    materialLabels() {
      const labels = {}
      this.formulas.forEach(f => { labels[f.key] = f.name })
      return labels
    },

    resourceLabels() {
      return { wood: 'Wood', iron: 'Iron', fabric: 'Fabric', resin: 'Resin', coal: 'Coal', copper: 'Copper' }
    },

    totals() {
      if (!this.formulas.length) return { materials: {}, resources: {}, rawMaterials: {} }

      const grossMaterials = this.sumGrossMaterials()
      const netMaterials = this.subtractOwned(grossMaterials, invMatMap)
      const grossResources = this.convertMaterialsToResources(netMaterials)
      this.mergeDirectResources(grossResources, this.sumDirectResources())
      const netResources = this.subtractOwned(grossResources, invResMap)

      return {
        materials: this.formatNumbers(netMaterials),
        resources: this.formatNumbers(netResources),
        rawMaterials: netMaterials
      }
    }
  },

  methods: {
    selectedShip(shipKey) {
      return this.shipCatalog.find(s => s.id === shipKey) || null
    },

    matColor(key) {
      return matColors[key] || ''
    },

    resColor(key) {
      return resColors[key] || ''
    },

    getMaterialMod(inPort) {
      return inPort ? 0.8 : 1.0
    },

    getSkillMod(matKey) {
      const s = this.mats.settings || {}
      if ((matKey === 'beam' || matKey === 'bulkhead') && s.carpentry) return 0.93
      if ((matKey === 'plate' || matKey === 'bronze') && s.blacksmithing) return 0.90
      return 1.0
    },

    openSettings() {
      document.getElementById('settings-modal').showModal()
    },

    closeSettings() {
      document.getElementById('settings-modal').close()
    },

    sumGrossMaterials() {
      const totals = {}
      this.formulas.forEach(f => { totals[f.key] = 0 })
      this.mats.builds.forEach(build => {
        const ship = this.selectedShip(build.shipKey)
        if (!ship) return
        const qty = Math.max(1, Number(build.quantity || 1))
        this.formulas.forEach(f => {
          const raw = Number(ship.resources?.[f.shipField] || 0) * qty
          totals[f.key] += Math.max(0, Math.ceil(raw * this.getMaterialMod(build.inPort)))
        })
      })
      return totals
    },

    sumDirectResources() {
      const totals = { raw_wood: 0, raw_textile: 0, iron_ore: 0 }
      this.mats.builds.forEach(build => {
        const ship = this.selectedShip(build.shipKey)
        if (!ship) return
        const qty = Math.max(1, Number(build.quantity || 1))
        const mod = build.inPort ? 0.8 : 1
        const disc = v => Math.max(0, Math.ceil(v * mod))
        totals.raw_wood += disc(Number(ship.resources?.raw_wood || 0) * qty)
        totals.raw_textile += disc(Number(ship.resources?.raw_textile || 0) * qty)
        totals.iron_ore += disc(Number(ship.resources?.iron_ore || 0) * qty)
      })
      return totals
    },

    subtractOwned(gross, map) {
      const net = {}
      const inv = this.mats.inventory || {}
      Object.keys(gross).forEach(key => {
        const owned = Number(inv[map[key]] || 0)
        net[key] = Math.max(0, gross[key] - owned)
      })
      return net
    },

    convertMaterialsToResources(netMats) {
      const totals = {}
      this.formulas.forEach(f => {
        const count = netMats[f.key]
        const mod = this.getSkillMod(f.key)
        Object.entries(f.resources).forEach(([resKey, amount]) => {
          totals[resKey] = (totals[resKey] || 0) + count * Math.ceil(amount * mod)
        })
      })
      return totals
    },

    mergeDirectResources(target, source) {
      Object.entries(dirResMap).forEach(([from, to]) => {
        if (source[from]) target[to] = (target[to] || 0) + source[from]
      })
    },

    formatNumbers(raw) {
      const formatted = {}
      Object.keys(raw).forEach(key => { formatted[key] = raw[key].toLocaleString() })
      return formatted
    },

    addBuild() {
      this.mats.builds.push({
        id: Date.now() + Math.random(),
        name: `Build ${this.mats.builds.length + 1}`,
        shipKey: this.shipCatalog[0]?.id || '',
        quantity: 1,
        inPort: false
      })
    },

    removeBuild(index) {
      if (this.mats.builds.length > 1) {
        this.mats.builds.splice(index, 1)
      }
    },

    loadShipCatalog() {
      fetch('./data/ships.json')
        .then(r => r.json())
        .then(data => {
          this.shipCatalog = flattenShips(data)
          this.shipCatalogLoaded = true
          this.$nextTick(() => {
            this.mats.builds.forEach(b => {
              if (!b.shipKey && this.shipCatalog.length) {
                b.shipKey = this.shipCatalog[0].id
              }
              b.quantity = Math.max(1, Number(b.quantity || 1))
            })
          })
        })
        .catch(err => {
          console.error('Unable to load ship data', err)
          this.shipCatalogLoaded = true
        })
    },

    loadFormulas() {
      fetch('./data/formulas.json')
        .then(r => r.json())
        .then(data => {
          this.formulas = data.materials || []
          this.formulasLoaded = true
        })
        .catch(err => {
          console.error('Unable to load formulas', err)
          this.formulasLoaded = true
        })
    },

    persistState() {
      localStorage.setItem('wosb_mats', JSON.stringify(this.mats))
    }
  },

  watch: {
    mats: {
      deep: true,
      handler() {
        this.persistState()
      }
    }
  },

  mounted() {
    this.loadShipCatalog()
    this.loadFormulas()
    lucide.createIcons()
  },

  updated() {
    lucide.createIcons()
  }
}).mount('#app')
