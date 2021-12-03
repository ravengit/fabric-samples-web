const funcs = {

    toJSONObject: (buffer) => {
        try {
            return JSON.parse(buffer.toString())
        } catch(e) {
            return buffer.toString()
        }        
    },

}

module.exports = funcs;
