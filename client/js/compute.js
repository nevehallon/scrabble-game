import { getWordValues } from "./getRequests.js";
import validate from "./boardValidator.js";

async function calcPcMove(gridState, firstTurn, wordsLogged, rivalRack) {
  console.log(gridState); //TODO: delete log!

  let rack = [];
  let numBlanks = 0;

  rivalRack.forEach((x) => {
    if (!x.letter) numBlanks++;
    rack.push(x.letter);
  });
  console.log(rivalRack, rack); //TODO: delete log!
  let wordSet = await getWordValues(rack.join("").toLowerCase(), numBlanks);
  console.log(wordSet); //TODO: delete log!

  if (firstTurn) {
    if (!wordSet.length) return; //TODO:return and set var {rivalRack, score: bestWord.pointTally, newWordsLogged}
    let extraCount = 0;
    let candidates = [];
    let wordSlice = wordSet.slice(0, 5);
    let extraIndex = [];

    for (let x = 0; x < wordSlice.length; x++) {
      if (wordSlice[x].word.length > 4 && x < 5) {
        wordSlice.push(wordSlice[x]);
        extraCount++;
      }

      let cleanGrid = _.cloneDeep(gridState);
      let start = 7;

      wordSlice[x].word
        .toUpperCase()
        .split("")
        .forEach((letter, index) => {
          let rackIndex = rack.findIndex((tile) => tile === letter);
          let points = rackIndex === -1 ? 0 : rivalRack[rackIndex].points;

          if (4 < x && x < 4 + extraCount && points > 1 && index > 4) {
            wordSlice.push(wordSlice[x]);
            extraIndex.push(index);
            // console.count();
          }

          if (x > 4 + extraCount) {
            let bigIndex = extraIndex[candidates.length - (extraCount + 5)];
            start = bigIndex === 5 ? 6 : 5;
            // console.log(start, extraIndex, bigIndex);
          }

          x < 5 && index === 0 && points > 1 && wordSlice[x].word.length > 4 ? (start = 3) : (start = start);

          cleanGrid.gridLetters[7][start + index].letter = letter;
          cleanGrid.gridLetters[7][start + index].pointVal = points;
          cleanGrid.gridLetters[7][start + index].hot = true;
        });

      let { words, pointTally } = validate(cleanGrid, firstTurn, wordsLogged, false);
      candidates.push({ word: words[0], pointTally, start });
    }

    // console.log(rivalRack, rack); //TODO: delete log!
    // console.log(candidates, "ext: " + extraCount, "surplus: " + (candidates.length - (extraCount + 5)));

    let bestWord = _.orderBy(candidates, ["pointTally"], ["desc"])[0];
    // console.log(bestWord);

    if (!bestWord) return false;

    let tiles = [];

    bestWord.word.split("").forEach((letter, index) => {
      let rackIndex = rack.findIndex((tile) => tile === letter);
      if (rackIndex === -1) rackIndex = rack.findIndex((tile) => tile === "");

      if (rackIndex > -1) {
        tiles.push(rivalRack[rackIndex]);

        rack.splice(rackIndex, 1);
        rivalRack.splice(rackIndex, 1);

        letter = !tiles[index].points ? `<i>${letter}</i>` : letter;

        $(`[data-location="7,${bestWord.start + index}"]`).append(
          `<div data-drag="5" class="tile hot ui-draggable ui-draggable-handle" style="z-index: 7; left: 0px; top: 0px; position: relative; font-weight: bolder; font-size: medium; width: 50px; height: 55px;">${letter}<div style="bottom: 9px; left: 16px; font-weight: bolder; font-size: 8px;">${tiles[index].points}</div></div>`
        );
      }
    });
    // console.log(rivalRack, tiles); //TODO: remove me!!
  } else {
    //>>>>>>>>>TODO: what pc does when it's not the first turn <<<<<<<<<<
  }
  //   return the var holding -> {rivalRack, score: bestWord.pointTally, newWordsLogged};TODO:
}

export { calcPcMove };
