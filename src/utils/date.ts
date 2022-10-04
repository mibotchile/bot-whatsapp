
export const now = (timeZone = 'UTC') => {
    const formater = new Intl.DateTimeFormat('af-ZA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZone })

    return formater.format(Date.now())
}
