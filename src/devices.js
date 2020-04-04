'use strict'
const tinycolor = require('tinycolor2')
const tinygradient = require('tinygradient')
const logger = require('./logger.js')

// gets color object
function getcolor (c) {
  const color = tinycolor(c)
  if (!color.isValid()) {
    logger.warn('invalid color.')
    return
  }
  return {
    rgb: color.toRgb(),
    hex: color.toHex(),
    name: color.toName()
  }
}

class Light {
  constructor (type, id, haredware, io, color = 'black', oncolor = 'white') {
    this.type = type
    this.id = id
    this.haredware = haredware
    this.io = io
    this.cycle = {
      ison: false,
      colors: ['#be0000', '#beb500', '#21be00', '#0051be'],
      speed: 8000,
      effect: 'fade'
    }
    this.brightness = 100
    this.oncolor = oncolor
    this.savedcolors = []
    this.color = color
  }

  get color () {
    return 'this._color'
  }

  set color (c) {
    if (this._color !== null && this.status !== 'cycle') {
      this.old_color = this._color
    }
    const color = getcolor(c)
    if (color == null) {
      return
    }
    this._color = color
    this.getstatus()
    const brig = this.getbrightness(color.rgb.r, color.rgb.g, color.rgb.b)
    this.setcolor(brig[0], brig[1], brig[2])
    clearTimeout(this.savetimer)
    this.savecolor('#' + color.hex)
  }

  getbrightness (r, g, b) {
    const rp = Math.ceil((r / 100) * this.brightness)
    const gp = Math.ceil((g / 100) * this.brightness)
    const bp = Math.ceil((b / 100) * this.brightness)
    return [rp, gp, bp]
  }

  getstatus () {
    if (this.cycle.ison) {
      this.status = 'cycle'
      return this.status
    }
    if (this._color.name === 'black') {
      this.status = 'off'
      return this.status
    }
    this.status = 'on'
    return this.status
  }

  setcycle ({ ison, colors, effect, speed }) {
    this.cycle.ison = ison
    this.getstatus()

    if (colors !== undefined) {
      this.cycle.colors = colors
    }

    if (effect !== undefined) {
      this.cycle.effect = effect
    }

    if (speed !== undefined) {
      this.cycle.speed = speed
    }

    this.cycleswitch(this.cycle.effect)
  }

  cycleswitch (mode) {
    switch (mode) {
      case 'fade':
        clearInterval(this.cycle.timer)
        this.fadeTimer(this.cycle.colors)
        break
      case 'flash':
        // clearInterval(this.cycle.timer)
        // flash(data.CycleMode.colors);
        break
      case 'smooth':
        // clearInterval(this.cycle.timer)
        // smooth(data.CycleMode.colors);
        break
      default:
    }
  }

  // add this color HEX to the begining of color list and last color to the end of the list
  afctel (colors) {
    const clist = colors.slice()
    clist.unshift(this._color.hex)
    clist.push(colors[0])
    logger.data(clist)
    return clist
  }

  // get color gradient array
  getgradient (colors) {
    const gradient = tinygradient(colors)
    const steps = gradient.rgb(110)
    const Grad = []

    for (var i = 0; i < steps.length; i++) {
      const color = tinycolor(steps[i])
      Grad.push(color.toRgb())
    }

    return Grad
  }

  getfade (colors) {
    logger.debug('Generating Colors to fade')
    const clist = this.afctel(colors)
    const fadeList = {}

    for (var i = 0; i < clist.length - 1; i++) {
      logger.debug(clist[i], clist[i + 1])
      fadeList[i] = this.getgradient([clist[i], clist[i + 1]])
    }
    return fadeList
  }

  setcolor (r, g, b) {
    this.io.set(r, g, b)
  }

  savecolor (color) {
    if ((this.status === 'off') || (this.status === 'cycle')) {
      return
    }
    this.savetimer = setTimeout(() => {
      const save = this.savedcolors.filter(c => c !== color)
      save.unshift(color)
      save.splice(19, 1)
      this.savedcolors = save
    }, 6000)
  }

  toggle (state) {
    switch (state) {
      case 'on':
        if (this.status === 'cycle') {
          return
        }
        this.color = this.oncolor
        break

      case 'off':
        if (this.status === 'cycle') {
          this.setcycle({ ison: false })
          this.color = 'black'
        }
        this.color = 'black'
        break

      default:
        if (this.status === 'off') {
          this.color = this.oncolor
          return
        }

        if (this.status === 'cycle') {
          this.setcycle({ ison: false })
        }
        this.color = 'black'

        break
    }
  }
}

module.exports = Light
