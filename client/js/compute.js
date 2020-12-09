import { getWordValues } from "./getRequests.js";
import validate from "./boardValidator.js";
import trie from "../src/trie-prefix-tree/index.js";

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
    let startingCoords = {};
    let tilesPlayedCoords = [];
    let tilesPlayed = $("#board .tile").parent().toArray();

    tilesPlayed.forEach((coord) => {
      tilesPlayedCoords.push(coord.getAttribute("data-location").split(",").map(Number));
    });
    let tileCompare = tilesPlayedCoords.map((x) => x.join(""));

    tilesPlayedCoords.forEach((coord) => {
      // let startCompare = startingCoords.map((x) => x.join(""));
      let locations = [];
      if (!tileCompare.includes([coord[0] - 1, coord[1]].join("")) && coord[0] !== 0)
        locations.push({
          // free: [coord[0] - 1, coord[1]],
          free: coord,
          branch: "up",
        }); // one square up
      if (!tileCompare.includes([coord[0] + 1, coord[1]].join("")) && coord[0] !== 14)
        locations.push({
          // free: [coord[0] + 1, coord[1]],
          free: coord,
          branch: "down",
        }); // one square down
      if (!tileCompare.includes([coord[0], coord[1] - 1].join("")) && coord[1] !== 0)
        locations.push({
          // free: [coord[0], coord[1] - 1],
          free: coord,
          branch: "left",
        }); // one square left
      if (!tileCompare.includes([coord[0], coord[1] + 1].join("")) && coord[1] !== 14)
        locations.push({
          // free: [coord[0], coord[1] + 1],
          free: coord,
          branch: "right",
        }); // one square right

      locations.forEach((location) => {
        // && !startCompare.includes(location.free.join(""))
        // if (!tileCompare.includes(location.free.join(""))) {
        if (!startingCoords[`${location.free.join("")}`]) {
          startingCoords[`${location.free.join("")}`] = { coord: location.free, branch: [] };
        }

        startingCoords[`${location.free.join("")}`].branch.push(location.branch);
        // }
      });
    });

    console.log(tilesPlayedCoords);

    let potentialWordsMain = [];

    tilesPlayedCoords.forEach((tile) => {
      let tileInfo = gridState.gridLetters[tile[0]][tile[1]];
      console.log(tileInfo);
      startingCoords[`${tile.join("")}`].branch.forEach((path) => {
        if (path === "up") {
          let suffix = [`${tileInfo.letter}`];
          let suffixTally = [+`${tileInfo.pointVal}`];
          //check if and what letters follow bellow
          let next = tile[0];
          let checkNext = () => {
            ++next;
            let nextCoord = gridState.gridLetters[next][tile[1]];
            if (nextCoord.letter !== " ") {
              //TODO make sure "nextCoord" is still on by comparing suffix.length + tile[0] !== 14
              suffix.unshift(nextCoord.letter);
              suffixTally.unshift(+nextCoord.pointVal);
              checkNext();
            }
            return;
          };
          checkNext();
          let checkedOut = []; //suffixes that have already been used to insure no repeats
          let level = {
            _1: { potentialWords: [], potentialPoints: [] },
            _2: { potentialWords: [], potentialPoints: [] },
            _3: { potentialWords: [], potentialPoints: [] },
            _4: { potentialWords: [], potentialPoints: [] },
            _5: { potentialWords: [], potentialPoints: [] },
            _6: { potentialWords: [], potentialPoints: [] },
            _7: { potentialWords: [], potentialPoints: [] },
          };
          // !!!!!numBlanks!!!!!
          console.log(suffix, suffixTally); // TODO delete me!!
          //iterate over rack tiles and check for suffix with rack tile prepended to following letters

          // let plus = 0;
          // let successPlus = 0;
          rivalRack = [
            { letter: "R", points: "R2" },
            { letter: "S", points: "S3" },
            { letter: "E", points: "E4" },
            { letter: "L", points: "L5" },
            { letter: "V", points: "V6" },
            { letter: "N", points: "N7" },
            { letter: "O", points: "O8" },
          ]; //TODO DELETE ME
          console.log(
            rivalRack,
            rivalRack.map((x) => x.letter)
          ); //TODO DELETE ME

          let rackCopy = _.cloneDeep(rivalRack);
          let max = rivalRack.length - 1;

          rivalRack.forEach((start, i) => {
            let letter = start.letter;
            let points = start.points;
            let joined = [...suffix, letter].join("");
            if (!checkedOut.includes(joined)) {
              if (trie().isSuffix(joined)) {
                checkedOut.push(joined);
                level._1.potentialWords.push({
                  a: [...suffix, letter],
                  b: rivalRack.filter((x, index) => index !== i).map((x) => x.letter),
                });
                level._1.potentialPoints.push({
                  a: [...suffixTally, points],
                  b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                });
              }
            }
          });
          let checkLevel = (prev, cur) => {
            prev.potentialWords.forEach((start, i) => {
              start.b.forEach((letter, i2) => {
                let points = prev.potentialPoints[i].b[i2];
                let joined = [...start.a, letter].join("");
                if (!checkedOut.includes(joined)) {
                  if (trie().isSuffix(joined)) {
                    checkedOut.push(joined);
                    cur.potentialWords.push({
                      a: [...start.a, letter],
                      b: start.b.filter((x, index) => index !== i2),
                    });
                    cur.potentialPoints.push({
                      a: [...prev.potentialPoints[i].a, points],
                      b: prev.potentialPoints[i].b.filter((x, index) => index !== i),
                    });
                    let test = null;
                  }
                }
              });
            });
          };
          if (rivalRack.length > 1) {
            for (let j = 1; j < rivalRack.length - 1; j++) {
              checkLevel(level[`_${j}`], level[`_${j + 1}`]);
              console.log("potentials2", level[`_${j + 1}`].potentialWords, level[`_${j + 1}`].potentialPoints);
            }
          }
          console.log("checkedOut:", checkedOut, level._1.potentialWords, level._1.potentialPoints, rackCopy);
          // if there is a suffix then repeat until there is no suffix || no more tiles to add || can't make longer
          // if false check if last valid suffix makes a word
          // if word add letters and points to gridLetters,pointVal,letter => place pointTally + word in arr
        }

        if (path === "down") {
        }
        if (path === "left") {
        }
        if (path === "right") {
        }
      });
    });
    // startingCoords.forEach((coord) => {});
    // ?startingCoords = the squares on the board where we can build off from
    //>>>>>>>>>TODO: what pc does when it's not the first turn <<<<<<<<<<
  }
  //   return the var holding -> {rivalRack, score: bestWord.pointTally, newWordsLogged};TODO:
}

export { calcPcMove };
