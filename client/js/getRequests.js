import letters from "./letterToPoints.js";

let localWordTrieStr;

async function getWordTrieStr() {
  try {
    if (localStorage.getItem("wordTrieStr")) return;
    let {
      data: { wordTrieStr },
    } = await axios.get(`http://localhost:3000/wordTrieStr`);
    localWordTrieStr = wordTrieStr;
    localStorage.setItem("wordTrieStr", localWordTrieStr);
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

async function calcPcMove(gridState, firstTurn, wordsLogged, rivalRack) {
  console.log(gridState);

  let rack = [];
  let numBlanks = 0;

  rivalRack.forEach((x) => {
    if (!x.letter) numBlanks++;
    rack.push(x.letter);
  });
  console.log(rack);
  let wordSet = await getWordValues(rack.join("").toLowerCase(), numBlanks); //TODO: delete log!
  console.log(wordSet);
  if (firstTurn && wordSet.length) {
    wordSet.slice(0, 10).forEach((x) => {
      x.word
        .toUpperCase()
        .split("")
        .forEach((letter) => {
          //TODO: take each letter and match it to the letter in the rivalRack -> take the corresponding points and place the letter one by one on the board -> then calculate the score w/ bonus. take the highest scoring word and render its tiles on the board in optimal position(better scoring tiles on the DL/TL)
        });
    });
  }
}

export { getWordTrieStr, calcPcMove };
