import letters from "./letterToPoints.js";

async function getWordTrieStr() {
  try {
    if (localStorage.getItem("wordTrieStr") && localStorage.getItem("reverseWordTrieStr")) {
      return;
    }
    let {
      data: { wordTrieStr, reverseWordTrieStr },
    } = await axios.get(`http://localhost:3000/wordTrieStr`);
    let localTrieStr = LZString.compress(wordTrieStr);
    let localReverseTrieStr = LZString.compress(reverseWordTrieStr);
    console.log(localTrieStr);
    console.log(localReverseTrieStr);
    localStorage.setItem("wordTrieStr", localTrieStr);
    localStorage.setItem("reverseWordTrieStr", localReverseTrieStr); // TODO: find a way to fit into localStorage
  } catch (error) {
    console.error(error);
  }
}

async function getWordValues(str, numBlanks = 0) {
  let result = [];

  try {
    let {
      data: { wordsFound },
    } = await await axios.get(`http://localhost:3000/wordFinder?letters=${str}&numBlanks=${numBlanks}`);

    wordsFound.forEach((word) => {
      result.push({
        word,
        points: [...word].reduce((accumulator, currentVal) => {
          return accumulator + letters.find((l) => l.letter == currentVal.toUpperCase()).points;
        }, 0),
      });
    });

    let wordsByValue = _.orderBy(result, ["points", "word"], ["desc"]);

    return wordsByValue;
  } catch (error) {
    console.error(error);
  }
}

export { getWordTrieStr, getWordValues };
