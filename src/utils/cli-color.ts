
export const red = (...strs) => {
    const ss = strs.map(s => typeof s === 'string' ? s : `\n${JSON.stringify(s, null, '  ')}\n`)
    return `\x1b[41m\x1b[30m${ss.join('')}\x1b[0m`
}
export const blue = (...strs) => {
    return `\x1b[44m\x1b[30m${strs.join(' ')}\x1b[0m`
}
export const green = (...strs) => {
    return `\x1b[42m\x1b[30m${strs.join(' ')}\x1b[0m`
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)};${parseInt(result[2], 16)};${parseInt(result[3], 16)}` : '0;0;0'

}

export const hex = (hex: string, ...strs) => {
    const rgb = hexToRgb(hex)
    return `\x1b[48;2;${rgb}m\x1b[30m${strs.join(' ')}\x1b[0m`
}

/**
    *returns text with color in rgb
    * @param rgb string color in rgb separated by semicolons 15;89;255
*/
export const rgb = (rgb: string, ...strs) => {
    return `\x1b[48;2;${rgb}m\x1b[30m${strs.join(' ')}\x1b[0m`
}


export const textHex = (hex: string, ...strs) => {
    const rgb = hexToRgb(hex)
    return `\x1b[38;2;${rgb}m${strs.join(' ')}\x1b[0m`
    // return `\x1b[38;2;${rgb}m\x1b[1m${strs.join(' ')}\x1b[0m` //bold
}

/**
    *returns text with color in rgb
    * @param rgb string color in rgb separated by semicolons 15;89;255
*/
export const textRgb = (rgb: string, ...strs: any[]) => {
    return `\x1b[38;2;${rgb}m${strs.join(' ')}\x1b[0m`
}
