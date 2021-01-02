import letters from "./letterToPoints.js";
import { getTrie } from "../src/trie-prefix-tree/index.js";

async function checkServerStatus() {
  try {
    let { status } = await axios.get(`http://localhost:3000/wordFinder?letters=aa&numBlanks=0`);

    if (status == 200) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function getWordTrieStr() {
  try {
    if ((await localforage.getItem("wordTrieStr")) && (await localforage.getItem("reverseWordTrieStr"))) {
      return;
    }
    let {
      data: { wordTrieStr, reverseWordTrieStr },
    } = await axios.get(`http://localhost:3000/wordTrieStr`);
    let localTrieStr = wordTrieStr;
    let localReverseTrieStr = reverseWordTrieStr;
    await localforage.setItem("wordTrieStr", localTrieStr);
    await localforage.setItem("reverseWordTrieStr", localReverseTrieStr);
    getTrie();
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

export { getWordTrieStr, getWordValues, checkServerStatus };
