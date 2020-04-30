exports.toNameString = (originalString) => {
    /*
    This trims a string, then makes it all lower case and then replaces all spaces with '-'
    */
    var newString = originalString.trim().toLowerCase()
    var pos = originalString.indexOf(' ')
    var tempString
    if (pos > -1) {
        while (pos > -1) {
            tempString = newString.replace(' ', '-')
            newString = tempString
            pos = newString.indexOf(' ')
        }
    }
    return newString
}


