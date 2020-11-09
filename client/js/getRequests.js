import letters from "./letterToPoints.js";

let localWordTrieStr;

async function getWordTrieStr() {
    try {
        let { data: { wordTrieStr } } = await axios.get(`http://localhost:3000/wordTrieStr`);
        localWordTrieStr = localStorage.getItem('wordTrieStr') || wordTrieStr;
        localStorage.setItem('wordTrieStr', localWordTrieStr);
    } catch (error) {
        console.error(error);
    }
}

async function getPossibleWords(str, numBlanks = 0) {
    try {
        return await axios.get(`http://localhost:3000/wordFinder?letters=${str}&numBlanks=${numBlanks}`);
    } catch (error) {
        console.error(error);
    }
}

async function getWordValues() {
    let result = [];
    
    try {
        let { data: { wordsFound } } = await getPossibleWords('striea', 2);

        wordsFound.forEach(word => {
            result.push({
                word,
                points: [...word].reduce((accumulator, currentVal) => {
                    return accumulator + letters.find(l => l.letter == currentVal.toUpperCase()).points;
                }, 0)
            });
        });

        let wordsByValue = _.orderBy(result, ['points', 'word'], ['desc']); 

        console.log(wordsByValue); //TODO delete log!

        return wordsByValue;

    } catch (error) {
        console.error(error);
    }
}

export {
    getWordTrieStr,
    getPossibleWords,
    getWordValues
};