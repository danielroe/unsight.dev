import hexRgb from 'hex-rgb'
import rgbToHSL from 'rgb-to-hsl'

export function labelColors(color: string) {
  const value = hexRgb(color)
  const [hue, saturation, lightness] = rgbToHSL(value.red, value.green, value.blue)

  return {
    '--label-r': Math.round(value.red),
    '--label-g': Math.round(value.green),
    '--label-b': Math.round(value.blue),
    '--label-h': Math.round(hue),
    '--label-s': Math.round(Number.parseInt(saturation)),
    '--label-l': Math.round(Number.parseInt(lightness)),
  }
}
