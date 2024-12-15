import crypto from 'crypto'

const generateSecureHash = (params, integritySalt) => {
    console.log(params)
    const sortedParams = Object.keys(params)
        .filter((key) => params[key])
        .sort()
        .map((key) => params[key])
        .join('&')

    console.log({ sortedParams })

    const stringToHash = `${integritySalt}&${sortedParams}`

    console.log({ stringToHash })

    const secureHash = crypto
        .createHmac('sha256', integritySalt)
        .update(stringToHash)
        .digest('hex')
        .toUpperCase()

    return secureHash
}


export default generateSecureHash
