import { getWordValues } from "./getRequests.js";
import validate from "./boardValidator.js";
import trie from "../src/trie-prefix-tree/index.js";

window.trie = trie; //! remove from window

const abc = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
let idCount = 122;

async function calcPcMove(gridState, firstTurn, wordsLogged, rivalRack) {
  // console.log(gridState); //TODO: delete log!

  let rack = [];
  let numBlanks = 0;

  // rivalRack = [
  //   { letter: "Z", points: 1 },
  //   { letter: "Z", points: 1 },
  //   { letter: "Z", points: 1 },
  //   { letter: "Z", points: 0 },
  //   { letter: "Z", points: 0 },
  //   { letter: "Z", points: 1 },
  //   { letter: "Z", points: 1 },
  // ].sort((a, b) => (b.letter ? 1 : -1)); //TODO DELETE ME >>keep sort<<
  // rivalRack = rivalRack.sort((a, b) => (b.letter ? 1 : -1));
  rivalRack.forEach((x) => {
    if (!x.letter) numBlanks++;
    rack.push(x.letter);
  });
  // console.log(rivalRack, rack); //TODO: delete log!

  if (firstTurn) {
    let wordSet = await getWordValues(rack.join("").toLowerCase(), numBlanks);
    // console.log(wordSet); //TODO: delete log!
    if (!wordSet.length) return false;
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

        gridState.gridLetters[7][bestWord.start + index].letter = letter;
        gridState.gridLetters[7][bestWord.start + index].pointVal = tiles[index].points;
        gridState.gridLetters[7][bestWord.start + index].hot = false;
        gridState.gridLetters[7][bestWord.start + index].id = idCount;

        letter = !tiles[index].points ? `font-style: italic;">${letter}` : `">${letter}`;

        $(`[data-location="7,${bestWord.start + index}"]`).append(
          `<div data-drag="${++idCount}" class="tile hot ui-draggable ui-draggable-handle" style="z-index: 7; left: 0px; top: 0px; position: relative; font-weight: bolder; font-size: medium; width: 50px; height: 55px;${letter}<div style="bottom: 9px; left: 16px; font-weight: bolder; font-size: 8px;">${
            tiles[index].points
          }</div></div>`
        );
      }
    });
    // console.log("word placed on board");
    // console.log(rivalRack, tiles); //TODO: remove me!!
    wordsLogged.push(bestWord.word);
    return { rivalRack: rivalRack, pointTally: bestWord.pointTally, words: wordsLogged };
  } else {
    // startingCoords.forEach((coord) => {});
    // ?startingCoords = the squares on the board where we can build off from
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

    // console.log(tilesPlayedCoords);

    let potentialWordsMain = [];
    // let potentialPointsMain = [];//?use or not?

    tilesPlayedCoords.forEach((tile) => {
      if (!startingCoords.hasOwnProperty(tile.join(""))) return;
      let tileInfo = gridState.gridLetters[tile[0]][tile[1]];
      let addLimit = {
        up: tile[0],
        down: 14 - tile[0],
        left: tile[1],
        right: 14 - tile[1],
      };

      //?>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>extend path<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      let extendPath = (path, isPre) => {
        let potentialBranchMid = [];

        let potentialBranch2Mid = [];
        // let potentiallettersMid = [];
        // let potentialBranchMid = [];
        // let potentialdetailssMid = [];

        let set = isPre ? "prefix" : "suffix";
        let setTally = `${isPre ? "prefix" : "suffix"}Tally`;

        let supply = {};

        supply[set] = [`${tileInfo.letter}`];
        supply[setTally] = [+`${tileInfo.pointVal}`]; //converts to number //?might be good to keep a string

        // console.log(supply);
        let nextX = tile[0];
        let nextY = tile[1];
        let checkNext = () => {
          //check if and what letters follow in opposite path direction
          path === "up" ? ++nextX : path === "down" ? --nextX : path === "left" ? ++nextY : --nextY;
          let nextCoord;
          if (nextX >= 0 && nextY >= 0 && nextX <= 14 && nextY <= 14) {
            nextCoord == gridState.gridLetters[nextX][nextY];
          }
          if (nextCoord !== undefined && nextCoord.letter !== " ") {
            supply[set].unshift(nextCoord.letter);
            supply[setTally].unshift(+nextCoord.pointVal); //converts to number //?might be good to keep a string
            checkNext();
          }
          return;
        };

        checkNext();
        //TODO make sure "nextCoord" is still on by comparing suffix.length + tile[0] !== 14
        let checkedOut = []; //suffixes that have already been used to insure no repeats
        let checkedOut4Branch = []; //suffixes that have already been used to insure no repeats
        let level = {
          _1: { branch: [], potentialWords: [], potentialPoints: [], branch2: [] },
          _2: { branch: [], potentialWords: [], potentialPoints: [], branch2: [] },
          _3: { branch: [], potentialWords: [], potentialPoints: [], branch2: [] },
          _4: { branch: [], potentialWords: [], potentialPoints: [], branch2: [] },
          _5: { branch: [], potentialWords: [], potentialPoints: [], branch2: [] },
          _6: { branch: [], potentialWords: [], potentialPoints: [], branch2: [] },
          _7: { branch: [], potentialWords: [], potentialPoints: [], branch2: [] },
        };
        // !!!!!numBlanks!!!!!
        // console.log(supply[set], supply[setTally]); // TODO delete me!!
        //iterate over rack tiles and check for suffix with rack tile prepended to following letters

        // let plus = 0;
        // let successPlus = 0;
        // rivalRack = [
        //   { letter: "R", points: 1 },
        //   { letter: "S", points: 1 },
        //   { letter: "E", points: 1 },
        //   { letter: "", points: 0 },
        //   { letter: "", points: 0 },
        //   { letter: "N", points: 1 },
        //   { letter: "A", points: 1 },
        // ].sort((a, b) => (b.letter ? 1 : -1)); //TODO DELETE ME >>keep sort<<
        // console.log(
        //   rivalRack,
        //   rivalRack.map((x) => x.letter)
        // ); //TODO DELETE ME

        // let rackCopy = _.cloneDeep(rivalRack);
        // let max = rivalRack.length - 1;

        // gridState.gridLetters[6][5] = { letter: "S", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles
        // gridState.gridLetters[6][6] = { letter: "Z", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles
        // gridState.gridLetters[5][7] = { letter: " ", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles
        // gridState.gridLetters[6][9] = { letter: "S", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles

        nextX = tile[0]; //resetting value
        nextY = tile[1]; //resetting value
        let mod1 = path === "up" || path === "down" ? 1 : 0;
        let mod2 = mod1 ? 0 : 1;
        let borderX = path === "up" ? nextX + 1 : path === "down" ? nextX - 1 : nextX;
        let borderY = path === "left" ? nextY + 1 : path === "right" ? nextY - 1 : nextY;
        let borderCell;
        if (borderX >= 0 && borderY >= 0 && borderX <= 14 && borderY <= 14) {
          borderCell = gridState.gridLetters[borderX][borderY];
        }
        let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
        let boarderLetter = isBordered ? borderCell.letter : "";
        path === "up" ? --nextX : path === "down" ? ++nextX : path === "left" ? --nextY : ++nextY;

        let cellsB4 = "";
        let cellsAfter = "";

        for (let k = 0; k < 12; k++) {
          if (mod1 && k) ++mod1;
          if (mod2 && k) ++mod2;
          if (nextY - mod1 >= 0 && nextX - mod2 >= 0 && nextY - mod1 <= 14 && nextX - mod2 <= 14) {
            cellsB4 += gridState.gridLetters[nextX - mod2][nextY - mod1].letter;
          }
          if (nextY + mod1 <= 14 && nextX + mod2 <= 14 && nextY + mod1 >= 0 && nextX + mod2 >= 0) {
            cellsAfter += gridState.gridLetters[nextX + mod2][nextY + mod1].letter;
          }
        }

        cellsB4 = cellsB4.split(" ")[0].split("").reverse().join("");
        cellsAfter = cellsAfter.split(" ")[0];
        let jokerUsed = false;
        rivalRack.forEach((start, i) => {
          let letter = start.letter;
          let run = () => {
            if (!letter) return;
            let points = start.points;

            let joined = [...supply[set], letter, boarderLetter].join("");
            if (!checkedOut.includes(joined)) {
              // console.log(nextX, nextY, mod1, mod2);

              let cellsJoined = (cellsB4 + letter + cellsAfter).trim();
              //check if the cells on both side of the new tile make a word together

              if (cellsJoined.length > 1 && !trie().hasWord(cellsJoined)) return;
              if (isPre ? trie().isPrefix(joined) : trie().isSuffix(joined)) {
                checkedOut.push(joined);
                level._1.branch.push({
                  letters: {
                    a: [...supply[set], letter],
                    b: rivalRack.filter((x, index) => index !== i).map((x) => x.letter),
                  },
                  points: {
                    a: [...supply[setTally], points],
                    b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                  },
                  startCoord: [nextX, nextY],
                });
                // level._1.potentialWords.push({
                //   a: [...supply[set], letter],
                //   b: rivalRack.filter((x, index) => index !== i).map((x) => x.letter),
                // });
                // level._1.potentialPoints.push({
                //   a: [...supply[setTally], points],
                //   b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                // });
                if (!isPre ? trie().hasWord([...joined].reverse().join("")) : trie().hasWord(joined)) {
                  // !isPre ? console.log([...joined].reverse().join(""), "rev") : console.log(joined, "reg");
                  //setting up 'word tangents'
                  level._1.branch2.push({
                    letters: {
                      a: [letter],
                      b: rivalRack.filter((x, index) => index !== i).map((x) => x.letter),
                    },
                    points: {
                      a: [points],
                      b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                    },
                  });
                  // level._1.branch2..push(Points:{
                  //   a: [points + "1"],
                  //   b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                  // });
                }
              }
            }
          };
          run();
          if (!letter && !jokerUsed) {
            abc.forEach((joker) => {
              jokerUsed = true;
              letter = joker;
              run();
            });
          }
        });
        //TODO: check which level._1.branch2 array make a word
        //          !!if there is a word check for branch off in 90-deg (suf+pre)
        // console.log(level._1.letters, level._1.points);
        let nextXRotated = nextX;
        let nextYRotated = nextY;
        let nextXRotatedInverse = nextX;
        let nextYRotatedInverse = nextY;
        let startingCell;
        let startingCellInverse;
        let branch2StartingCoords;
        let branch2StartingCoordsInverse;
        let count = 0;
        let checkBranchLevel = (prev, cur) => {
          // console.log(prev.letters);
          ++count;
          // if (count++) {

          // if ((path === "up" || path === "down") && nextYRotated >= 1) {
          //   --nextYRotated;
          // }
          // if ((path === "up" || path === "down") && nextYRotatedInverse <= 13) {
          //   ++nextYRotatedInverse;
          // }

          // if ((path === "left" || path === "right") && nextXRotated >= 1) {
          //   --nextXRotated;
          // }
          // if ((path === "left" || path === "right") && nextXRotatedInverse <= 13) {
          //   ++nextXRotatedInverse;
          // }
          path === "up" || path === "down" ? --nextYRotated : --nextXRotated;
          path === "up" || path === "down" ? ++nextYRotatedInverse : ++nextXRotatedInverse;
          // console.log(nextXRotated, nextYRotated, nextXRotatedInverse, nextYRotatedInverse);
          if (nextXRotated >= 0 && nextYRotated >= 0 && nextXRotated <= 14 && nextYRotated <= 14) {
            startingCell = gridState.gridLetters[nextXRotated][nextYRotated];
            branch2StartingCoords = [nextXRotated, nextYRotated];
          }
          if (
            nextXRotatedInverse >= 0 &&
            nextYRotatedInverse >= 0 &&
            nextXRotatedInverse <= 14 &&
            nextYRotatedInverse <= 14
          ) {
            startingCellInverse = gridState.gridLetters[nextXRotatedInverse][nextYRotatedInverse];
            branch2StartingCoordsInverse = [nextXRotatedInverse, nextYRotatedInverse];
          }
          if (branch2StartingCoords === undefined || branch2StartingCoordsInverse === undefined) {
            // console.log(nextXRotated, nextYRotated, nextXRotatedInverse, nextYRotatedInverse);
          }
          let borderCell;
          let borderCellInverse;
          if (path === "up" || path === "down") {
            // if (path) console.log(nextXRotatedInverse, nextYRotatedInverse);
            if (nextYRotated > 0 && nextYRotated < 14)
              borderCell = gridState.gridLetters[nextXRotated][nextYRotated - 1];
            if (nextYRotatedInverse < 14 && nextYRotatedInverse > 0)
              borderCellInverse = gridState.gridLetters[nextXRotatedInverse][nextYRotatedInverse + 1];
          } else {
            // if (path) console.log(nextXRotatedInverse, nextYRotatedInverse);
            if (nextXRotated > 0 && nextXRotated < 14)
              borderCell = gridState.gridLetters[nextXRotated - 1][nextYRotated];
            if (nextXRotatedInverse < 14 && nextXRotatedInverse > 0)
              borderCellInverse = gridState.gridLetters[nextXRotatedInverse + 1][nextYRotatedInverse];
          }
          // console.log(borderCellInverse);
          // }
          // console.log(nextXRotated, nextYRotated, nextXRotatedInverse, nextYRotatedInverse);
          mod1 = path === "up" || path === "down" ? 0 : 1;
          mod2 = mod1 ? 0 : 1;
          cellsB4 = "";
          cellsAfter = "";
          let cellsB4Inverse = "";
          let cellsAfterInverse = "";
          for (let k = 0; k < 12; k++) {
            if (mod1 && k) ++mod1;
            if (mod2 && k) ++mod2;

            if (
              nextXRotated - mod2 >= 0 &&
              nextYRotated - mod1 >= 0 &&
              nextXRotated - mod2 <= 14 &&
              nextYRotated - mod1 <= 14
            ) {
              // console.log("-B4", nextXRotated - mod2, nextYRotated - mod1);
              cellsB4 += gridState.gridLetters[nextXRotated - mod2][nextYRotated - mod1].letter;
            }
            if (
              nextXRotatedInverse - mod2 >= 0 &&
              nextYRotatedInverse - mod1 >= 0 &&
              nextXRotatedInverse - mod2 <= 14 &&
              nextYRotatedInverse - mod1 <= 14
            ) {
              // console.log("-B4 - I", nextXRotatedInverse - mod2, nextYRotatedInverse - mod1);
              cellsB4Inverse += gridState.gridLetters[nextXRotatedInverse - mod2][nextYRotatedInverse - mod1].letter;
            }

            if (
              nextXRotated + mod2 <= 14 &&
              nextYRotated + mod1 <= 14 &&
              nextXRotated + mod2 >= 0 &&
              nextYRotated + mod1 >= 0
            ) {
              // console.log("+After", nextXRotated + mod2, nextYRotated + mod1);
              cellsAfter += gridState.gridLetters[nextXRotated + mod2][nextYRotated + mod1].letter;
            }
            if (
              nextXRotatedInverse + mod2 <= 14 &&
              nextYRotatedInverse + mod1 <= 14 &&
              nextXRotatedInverse + mod2 >= 0 &&
              nextYRotatedInverse + mod1 >= 0
            ) {
              // console.log("+After - I", nextXRotatedInverse + mod2, nextYRotatedInverse + mod1);
              cellsAfterInverse += gridState.gridLetters[nextXRotatedInverse + mod2][nextYRotatedInverse + mod1].letter;
            }
          }

          cellsB4 = cellsB4.split(" ")[0].split("").reverse().join("");
          cellsB4Inverse = cellsB4Inverse.split(" ")[0].split("").reverse().join("");
          cellsAfter = cellsAfter.split(" ")[0];
          cellsAfterInverse = cellsAfterInverse.split(" ")[0];

          prev.forEach((start, i) => {
            jokerUsed = false;
            let joker2Used = false;
            let joker3Used = false;

            start.letters.b.forEach((letter, i2) => {
              // console.log(nextXRotated, nextYRotated, [...start.a, letter].join(""));
              let run = () => {
                let temp1 = { letters: [], points: [], details: [] };
                let temp2 = { letters: [], points: [], details: [] };
                if (!letter) return; //!check if start.a has already been used with a blank
                let originalLetter = letter;
                let points = prev[i].points.b[i2];
                //!  1.0
                let taken = false;
                if (count === 1 || prev[i].details.type === 1 || prev[i].details.type === 3) {
                  if (startingCell !== undefined && startingCell.letter !== " ") {
                    letter = startingCell.letter;
                    points = +startingCell.pointVal; //?string number value (can help determine which cells are taken)
                    taken = true;
                  }
                  let cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                  if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                    let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
                    let boarderLetter = isBordered ? borderCell.letter : "";
                    let joined = [boarderLetter, letter, ...start.letters.a].join("");
                    if (!checkedOut4Branch.includes(joined)) {
                      //?^^move to else condition without "!"^^?
                      if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                        if (startingCell !== undefined) {
                          checkedOut4Branch.push(joined); //?
                          temp1.letters.push({
                            // cur.letters.push({
                            a: [letter, ...start.letters.a],
                            b: start.letters.b.filter((x, index) => index !== i2),
                          });
                          temp1.points.push({
                            // cur.points.push({
                            a: [points, ...prev[i].points.a],
                            b: prev[i].points.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp1.details.push({ coords: branch2StartingCoords, isEnd: false, type: 1 });
                          // cur.details.push({ coords: [nextXRotated, nextYRotated], isEnd: false, type: 1 });
                        }
                        //!1.1
                        if (
                          ((temp1.letters[0]?.b?.length && count === 1) ||
                            (temp1.letters[0]?.b?.length && prev[i].details.type === 3)) &&
                          startingCellInverse !== undefined
                        ) {
                          let run4Type3 = () => {
                            let taken = false;
                            letter = temp1.letters[0].b[0];
                            points = temp1.points[0].b[0];
                            if (!letter) return; //!check if start.a has already been used with a blank
                            if (startingCellInverse !== undefined && startingCellInverse.letter !== " ") {
                              letter = startingCellInverse.letter;
                              points = +startingCellInverse.pointVal; //?string number value (can help determine which cells are taken)
                              taken = true;
                            }
                            cellsJoined = (cellsB4Inverse + letter + cellsAfter).trim();
                            if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                              let isBordered =
                                borderCellInverse !== undefined && borderCellInverse.letter !== " " ? true : false;
                              let boarderLetter = isBordered ? borderCellInverse.letter : "";
                              let joined = [...temp1.letters[0].a, letter, boarderLetter].join("");
                              if (!checkedOut4Branch.includes(joined)) {
                                if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                                  checkedOut4Branch.push(joined); //?
                                  temp1.letters.unshift({
                                    a: [...temp1.letters[0].a, letter],
                                    b: temp1.letters[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp1.points.unshift({
                                    a: [...temp1.points[0].a, points],
                                    b: temp1.points[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp1.details.unshift({
                                    coords: branch2StartingCoordsInverse,
                                    isEnd: true,
                                    type: 3,
                                  });
                                  let test = null;
                                }
                              }
                            }
                          };
                          run4Type3();
                          if (!letter && !joker2Used) {
                            joker2Used = true;
                            abc.forEach((joker) => {
                              letter = joker;
                              run4Type3();
                            });
                          }
                        }
                      }
                    }
                  }
                }
                if (count === 1 || prev[i].details.type === 2 || prev[i].details.type === 3) {
                  letter = originalLetter;
                  points = prev[i].points.b[i2];
                  let taken = false;
                  //!    2.0
                  if (startingCellInverse !== undefined && startingCellInverse.letter !== " ") {
                    letter = startingCellInverse.letter;
                    points = +startingCellInverse.pointVal; //?string number value (can help determine which cells are taken)
                    taken = true;
                  }
                  let cellsJoined = (cellsB4Inverse + letter + cellsAfter).trim();
                  if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                    let isBordered = borderCellInverse !== undefined && borderCellInverse.letter !== " " ? true : false;
                    let boarderLetter = isBordered ? borderCellInverse.letter : "";
                    let joined = [...start.letters.a, letter, boarderLetter].join("");
                    if (!checkedOut4Branch.includes(joined)) {
                      //?^^move to else condition without "!"^^?
                      if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                        if (startingCellInverse !== undefined) {
                          checkedOut4Branch.push(joined); //?
                          temp2.letters.unshift({
                            a: [...start.letters.a, letter],
                            b: start.letters.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp2.points.unshift({
                            a: [...prev[i].points.a, points],
                            b: prev[i].points.b.filter((x, index) => index !== i2),
                          });
                          temp2.details.push({
                            coords: branch2StartingCoordsInverse,
                            isEnd: true,
                            type: 2,
                          });
                        }
                        let test = null;
                        //!  2.1
                        if (
                          ((temp2.letters[0]?.b?.length && count === 1) ||
                            (temp2.letters[0]?.b?.length && prev[i].details.type === 3)) &&
                          startingCell !== undefined
                        ) {
                          let run4Type3_2 = () => {
                            let taken = false;
                            letter = temp2.letters[0].b[0];
                            points = temp2.points[0].b[0];
                            if (!letter) return; //!check if start.a has already been used with a blank
                            if (startingCell !== undefined && startingCell.letter !== " ") {
                              letter = startingCell.letter;
                              points = +startingCell.pointVal; //?string number value (can help determine which cells are taken)
                              taken = true;
                            }
                            cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                            if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                              let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
                              let boarderLetter = isBordered ? borderCell.letter : "";
                              let joined = [boarderLetter, letter, ...temp2.letters[0].a].join("");
                              if (!checkedOut4Branch.includes(joined)) {
                                if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                                  checkedOut4Branch.push(joined); //?
                                  temp2.letters.unshift({
                                    a: [letter, ...temp2.letters[0].a],
                                    b: temp2.letters[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp2.points.unshift({
                                    a: [points, ...temp2.points[0].a],
                                    b: temp2.points[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp2.details.unshift({
                                    coords: branch2StartingCoords,
                                    isEnd: true,
                                    type: 3,
                                  });
                                  let test = null;
                                }
                              }
                            }
                          };
                          run4Type3_2();
                          if (!letter && !joker3Used) {
                            joker3Used = true;
                            abc.forEach((joker) => {
                              letter = joker;
                              run4Type3_2();
                            });
                          }
                        }
                      }
                    }
                  }
                }
                // cur.branch2.unshift({letters: });
                temp1.letters.forEach((x, i) => {
                  cur.unshift({
                    letters: x,
                    points: temp1.points[i],
                    details: temp1.details[i],
                    score: _.sum(temp1.points[i].a),
                    length: x.a.length,
                  });
                });
                temp2.letters.forEach((x, i) => {
                  cur.unshift({
                    letters: x,
                    points: temp2.points[i],
                    details: temp2.details[i],
                    score: _.sum(temp2.points[i].a),
                    length: 7 - x.b.length,
                  });
                });
                // cur.letters.unshift(...temp1.letters, ...temp2.letters);
                // cur.points.unshift(...temp1.points, ...temp2.points);
                // cur.details.unshift(...temp1.details, ...temp2.details);
              };
              run();
              if (!letter && !jokerUsed) {
                jokerUsed = true;
                abc.forEach((joker) => {
                  letter = joker;
                  run();
                });
              }
            });
          });
        };

        let nextCellInfo;
        let borderCellInfo;
        let borderLetterInverse = boarderLetter;
        let checkLevel = (prev, cur) => {
          //TODO: ^^^ Make it check letters in both directions like checkBranchLevel()
          path === "up" ? --nextX : path === "down" ? ++nextX : path === "left" ? --nextY : ++nextY;

          cellsB4 = "";
          cellsAfter = "";
          mod1 = path === "up" || path === "down" ? 1 : 0;
          mod2 = mod1 ? 0 : 1;

          for (let k = 0; k < 12; k++) {
            if (mod1 && k) ++mod1;
            if (mod2 && k) ++mod2;

            if (nextY - mod1 >= 0 && nextX - mod2 >= 0) {
              cellsB4 += gridState.gridLetters[nextX - mod2][nextY - mod1].letter;
            }
            if (nextY + mod1 <= 14 && nextX + mod2 <= 14) {
              cellsAfter += gridState.gridLetters[nextX + mod2][nextY + mod1].letter;
            }
          }

          cellsB4 = cellsB4.split(" ")[0].split("").reverse().join("");
          cellsAfter = cellsAfter.split(" ")[0];

          prev.forEach((start, i) => {
            jokerUsed = false;
            start.letters.b.forEach((letter, i2) => {
              let run = () => {
                if (!letter) return;
                let taken = false;
                let points = prev[i].points.b[i2];
                if (nextCellInfo !== undefined && nextCellInfo.letter !== " ") {
                  letter = nextCellInfo.letter;
                  points = +nextCellInfo.pointVal; //?string number value (can help determine which cells are taken)
                  taken = true;
                } else {
                  let cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                  if (cellsJoined.length > 1 && !trie().hasWord(cellsJoined)) return;
                }
                let isBordered = borderCellInfo && borderCellInfo.letter !== " " ? true : false;
                let boarderLetter = isBordered ? borderCellInfo.letter : "";
                let joined = [...start.letters.a, letter, boarderLetter].join("");

                if (!checkedOut.includes(joined)) {
                  if (isPre ? trie().isPrefix(joined) : trie().isSuffix(joined)) {
                    checkedOut.push(joined);
                    cur.push({
                      letters: {
                        a: [...start.letters.a, letter],
                        b: start.letters.b.filter((x, index) => index !== (taken ? 8 : i2)),
                      },
                      points: {
                        a: [...prev[i].points.a, points],
                        b: prev[i].points.b.filter((x, index) => index !== (taken ? 8 : i2)),
                      },
                      startCoord: [nextX, nextY],
                    });
                    // cur[i].letters.push({
                    //   a: [...start[i].letters.a, letter],
                    //   b: start.b.filter((x, index) => index !== (taken ? 8 : i2)),
                    // });
                    // cur.push({
                    //   a: [...prev[i].points.a, points],
                    //   b: prev[i].points.b.filter((x, index) => index !== (taken ? 8 : i2)),
                    // });
                    let test = null;
                  }
                }
              };
              run();
              if (!letter && !jokerUsed) {
                abc.forEach((joker) => {
                  jokerUsed = true;
                  letter = joker;
                  run();
                });
              }
            });
          });
        };
        // gridState.gridLetters[1][7] = { letter: "E", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles
        // gridState.gridLetters[2][7] = { letter: "N", id: "34", pointVal: "taken3", hot: " " };
        // gridState.gridLetters[3][7] = { letter: "E", id: "34", pointVal: "taken3", hot: " " };
        // gridState.gridLetters[4][7] = { letter: "G", id: "34", pointVal: "taken2", hot: " " };
        // gridState.gridLetters[5][7] = { letter: "A", id: "34", pointVal: "taken1", hot: " " };

        // if there is a suffix then repeat until there is no suffix || no more tiles to add || can't make longer
        if (level[`_1`].branch.length) {
          potentialBranchMid.unshift(...level[`_1`].branch);
        }

        if (rivalRack.length > 1) {
          for (let j = 1; j < rivalRack.length; j++) {
            checkBranchLevel(level[`_${j}`].branch2, level[`_${j + 1}`].branch2);
            if (level[`_${j}`].branch2.length) {
              potentialBranch2Mid.unshift(...level[`_${j + 1}`].branch2);
              // potentiallettersMid.unshift(...level[`_${j + 1}`].letters);
              // potentialBranchMid.unshift(...level[`_${j + 1}`].points);
              // potentialdetailssMid.unshift(...level[`_${j + 1}`].details);
            }
            // prettier-ignore
            // console.log(`potentials${j + 1}`, level[`_${j + 1}`].branch2); //?rest of the levels one by one
            if (j + 1 <= addLimit[`${path}`]) {
              let x = path === "up" ? tile[0] - (j + 1) : path === "down" ? tile[0] + (j + 1) : tile[0];
              let y = path === "left" ? tile[1] - (j + 1) : path === "right" ? tile[1] + (j + 1) : tile[1];
              
              nextCellInfo = gridState.gridLetters[x][y];
              if(x < 13 && x > 1 &&
                y < 13 && y > 1) {
                  if (x < 13 && x > 1) x = path === "up" ? tile[0] - (j + 2) : path === "down" ? tile[0] + (j + 2) : tile[0];
                  if (y < 13 && y > 1) y = path === "left" ? tile[1] - (j + 2) : path === "right" ? tile[1] + (j + 2) : tile[1];
                  borderCellInfo = gridState.gridLetters[x][y];

                } else {
                  borderCellInfo = false;
                }
              // console.log(x, y, nextCellInfo); //? displays cell info by coord

              checkLevel(level[`_${j}`].branch, level[`_${j + 1}`].branch);
              // prettier-ignore
              // console.log(`potentials${j + 1}`, level[`_${j + 1}`].potentialWords, level[`_${j + 1}`].potentialPoints); //?rest of the levels one by one

              potentialBranchMid.unshift(...level[`_${j + 1}`].branch);
              // potentialBranchMid.unshift(...level[`_${j + 1}`].potentialPoints);
            }
          }
        }
        // console.log("checkedOut:", checkedOut, level._1.potentialWords, level._1.potentialPoints, rackCopy);//? level one<<<<<<
        // console.log("W-Mid:", potentialBranchMid, "P-Mid:", potentialBranchMid);
        // console.log(level._1.branch2); //? tangent branch
        // check starting from the longest suffix if word -> put words in "main" array with path
        if (!potentialBranchMid.length) {
          console.log("no potentialBranchMid");
        }
        let sliceNum = potentialBranchMid.slice(0, 222).length;

        for (let i = 0; i < sliceNum; i++) {
          // cap number of words coming from each cell to 22
          if (potentialBranchMid.length >= sliceNum) {
            let word = potentialBranchMid[i].letters;
            let setWord = isPre ? word.a : word.a.reverse();
            let setPoints = isPre ? potentialBranchMid[i].points.a : potentialBranchMid[i].points.a.reverse();

            if (trie().hasWord(borderLetterInverse.concat(setWord.join("")))) {
              potentialWordsMain.push({
                numHotTiles: 7 - word.b.length,
                remaining: word.b.map((x, index) => {
                  return { letter: x, points: potentialBranchMid[i].points.b[index] };
                }),
                startCoord: potentialBranchMid[i].startCoord,
                word: setWord,
                joined: setWord.join(""),
                points: setPoints,
                score: _.sum(setPoints),
                path,
                reverseOrder: isPre ? true : false,
              }); //?uncomment
            } else {
              sliceNum++;
            }
          }
        }
        // if (!potentialBranch2Mid.length) {
        //   console.log("no potentialBranch2Mid");
        // }
        sliceNum = potentialBranch2Mid.slice(0, 222).length;
        for (let i = 0; i < sliceNum; i++) {
          if (potentialBranch2Mid.length >= sliceNum) {
            // cap number of words coming from each cell to 22
            let word = potentialBranch2Mid[i].letters;
            // let setWord = isPre ? word.a : word.a.reverse();
            let setWord = word.a;
            // let setPoints = isPre ? potentialBranchMid[i].a : potentialBranchMid[i].a.reverse();
            let setPoints = potentialBranch2Mid[i].points.a;

            if (trie().hasWord(setWord.join(""))) {
              potentialWordsMain.push({
                a_set: supply[set].join(""),
                numHotTiles: 7 - word.b.length,
                remaining: word.b.map((x, index) => {
                  return { letter: x, points: potentialBranch2Mid[i].points.b[index] };
                }),
                startCoord: potentialBranch2Mid[i].details.coords,
                word: setWord,
                joined: setWord.join(""),
                points: setPoints,
                score: _.sum(setPoints),
                path,
                a_branch2: true,
                a_isEnd: potentialBranch2Mid[i].details.isEnd,
                reverseOrder: potentialBranch2Mid[i].details.isEnd ? true : false,
              });
            } else {
              sliceNum++;
            }
          }
        }
        // console.log(level._7);
        // let indexList = [];
        // console.log(
        //   potentialdetailssMid.filter((x, i) => {
        //     if (x.type === 3) indexList.push(i);
        //     return x.type === 3;
        //   })
        // );
        // console.log(potentiallettersMid.filter((x, index) => indexList.includes(index)));
        // console.log(potentialBranchMid.filter((x, index) => indexList.includes(index)));
        // console.log(indexList);
        // console.log("mainWords", potentialWordsMain);
        // console.log(
        //   "*******************",
        //   potentiallettersMid,
        //   potentialBranchMid,
        //   potentialdetailssMid
        // );

        // if word add letters and points to gridLetters,pointVal,letter => place pointTally + word in arr
      };
      // console.log(startingCoords, tile.join(""));
      startingCoords[`${tile.join("")}`].branch.forEach((path) => {
        if (path === "up") {
          // console.log("*******************1");
          extendPath(path, false); //?parameters ==> (path: string, isPrefix: boolean)
        }

        if (path === "down") {
          // console.log("*******************2");
          extendPath(path, true); //TODO: reactivate
        }
        if (path === "left") {
          // console.log("*******************3");
          extendPath(path, false); //TODO: reactivate
        }
        if (path === "right") {
          // console.log("*******************4");
          extendPath(path, true); //TODO: reactivate
        }
      });

      //TODO: >>>>>>>  iterate over main words => place on board => validate() && get Score => rank descending pick best =>render
    });
    if (!potentialWordsMain.length) {
      console.log("no main words");
    }
    let bingos = potentialWordsMain.filter((x) => x.numHotTiles === 7);
    let notBingos = potentialWordsMain.filter((x) => x.numHotTiles !== 7);
    notBingos = _.orderBy(notBingos, ["score"], ["desc"]);
    bingos = _.orderBy(bingos, ["score"], ["desc"]);
    let candidates = [...bingos, ...notBingos];
    // console.log(candidates);
    //>>>>>>>>>TODO: what pc does when it's not the first turn <<<<<<<<<<
    if (!candidates.length) {
      console.log("no words", rivalRack);
      return false;
    }
    console.log("candidates:", candidates);
    // let extraCount = 0;
    let wordSlice = candidates.slice(0, 222);
    // let extraIndex = [];

    // console.log(wordSlice);
    candidates = [];
    wordSlice.forEach((item, index) => {
      if (!(item instanceof Object)) {
        console.log(`candidate${index}:`, item);
      }
      // if (wordSlice[x].word.length > 4 && x < 5) {
      //   wordSlice.push(wordSlice[x]);
      //   extraCount++;
      // }
      let badCookie = false;
      let choice = wordSlice[index];
      let cleanGrid = _.cloneDeep(gridState);
      let start = choice.startCoord;
      let gridOrder = [];
      if (choice.reverseOrder) {
        choice.word = choice.word.reverse();
        choice.points = choice.points.reverse();
      }
      choice.word.forEach((letter, i) => {
        if (!(typeof letter === "string")) {
          console.log(`choice.word${i}:`, letter);
        }
        let x;
        let y;

        if (!choice.hasOwnProperty("a_branch2")) {
          if (choice.path === "up") {
            x = choice.reverseOrder ? i * -1 : i;
            y = 0;
          }
          if (choice.path === "down") {
            x = choice.reverseOrder ? i * -1 : i;
            y = 0;
          }
          if (choice.path === "left") {
            x = 0;
            y = choice.reverseOrder ? i * -1 : i;
          }
          if (choice.path === "right") {
            x = 0;
            y = choice.reverseOrder ? i * -1 : i;
          }
        } else {
          if (choice.path === "up" || choice.path === "down") {
            if (choice.a_isEnd) {
              x = 0;
              y = i * -1;
            } else {
              x = 0;
              y = i;
            }
          } else {
            if (choice.a_isEnd) {
              x = i * -1;
              y = 0;
            } else {
              x = i;
              y = 0;
            }
          }
        }
        if (start === undefined) {
          console.log(start);
        }
        if (start[0] + x < 0 || start[1] + y < 0 || start[0] + x > 14 || start[1] + y > 14) {
          badCookie = true;
          return;
        }
        let isHot = true;
        // console.log(choice);
        // console.log(choice, start, start[0] + x, start[1] + y, letter, choice.hasOwnProperty("a_branch2"));
        if (cleanGrid.gridLetters[start[0] + x][start[1] + y].hot === false) {
          isHot = false;
        }
        // console.log(start[0] + x, start[1] + y);
        if (cleanGrid.gridLetters[start[0] + x][start[1] + y].letter === " ") {
          cleanGrid.gridLetters[start[0] + x][start[1] + y].letter = letter;
          cleanGrid.gridLetters[start[0] + x][start[1] + y].pointVal = choice.points[i];
          cleanGrid.gridLetters[start[0] + x][start[1] + y].id = ++idCount;
          cleanGrid.gridLetters[start[0] + x][start[1] + y].hot = isHot;
        }
        gridOrder.push({ x: start[0] + x, y: start[1] + y, taken: !isHot });
      });
      // console.log(cleanGrid, wordsLogged);
      let { words, pointTally } = validate(cleanGrid, firstTurn, wordsLogged, false);
      if (badCookie || pointTally === 0) return;
      pointTally = choice.remaining.length === 0 ? pointTally + 50 : pointTally;

      candidates.push({
        word: choice.word,
        pointTally,
        start,
        remaining: choice.remaining,
        gridOrder,
        points: choice.points,
        reverseOrder: choice.reverseOrder,
        wordsLogged: words,
      });
    });

    // console.log(rivalRack, rack); //TODO: delete log!
    // console.log(candidates, "ext: " + extraCount, "surplus: " + (candidates.length - (extraCount + 5)));

    let bestWord = _.orderBy(candidates, ["pointTally"], ["desc"])[0];
    console.log("bestWord", bestWord, "candidates", candidates, rivalRack);

    if (!bestWord) {
      console.log("no words");
      return false;
    }

    for (let i = 0; i < bestWord.word.length; i++) {
      if (bestWord.gridOrder[i].taken) {
        i++;
      }
      if (i < bestWord.word.length) {
        // console.log("best word length:", bestWord.word.length);
        // console.log($(`[data-location="${bestWord.gridOrder[i].x},${bestWord.gridOrder[i].y}"]`).children());
        if (!$(`[data-location="${bestWord.gridOrder[i].x},${bestWord.gridOrder[i].y}"]`).children().length) {
          // console.count();
          gridState.gridLetters[bestWord.gridOrder[i].x][bestWord.gridOrder[i].y].letter = bestWord.word[i];
          gridState.gridLetters[bestWord.gridOrder[i].x][bestWord.gridOrder[i].y].pointVal = bestWord.points[i];
          gridState.gridLetters[bestWord.gridOrder[i].x][bestWord.gridOrder[i].y].hot = true;
          let letter = !bestWord.points[i] ? `font-style: italic;">${bestWord.word[i]}` : `">${bestWord.word[i]}`;

          $(`[data-location="${bestWord.gridOrder[i].x},${bestWord.gridOrder[i].y}"]`).append(
            `<div data-drag="${
              ++idCount * 2
            }" class="tile hot ui-draggable ui-draggable-handle" style="z-index: 7; left: 0px; top: 0px; position: relative; font-weight: bolder; font-size: medium; width: 50px; height: 55px;${letter}<div style="bottom: 9px; left: 16px; font-weight: bolder; font-size: 8px;">${
              bestWord.points[i]
            }</div></div>`
          );
        }
      }
    }
    // console.log(bestWord.wordsLogged);
    // wordsLogged.push(bestWord.reverseOrder ? bestWord.word.reverse().join("") : bestWord.word.join(""));
    return { rivalRack: bestWord.remaining, pointTally: bestWord.pointTally, words: bestWord.wordsLogged };
  }

  //   return the var holding -> {rivalRack, pointTally: bestWord.pointTally, newWordsLogged};TODO:
  // console.log(trie().hasWord("zi"));
}

export { calcPcMove };
